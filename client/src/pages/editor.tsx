import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { AudioPlayer } from "@/components/audio-player";
import { VideoModal } from "@/components/video-modal";
import { MicOff, Video, Download, Users, Play, Settings, Zap, Expand } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/user-context";
import type { Model, InsertGeneratedContent } from "@shared/schema";
import { VoiceSettings } from "@/components/tts/voice-settings";
import { GenerationPanel } from "@/components/generation-panel";

export default function VideoEditor() {
  const [inputText, setInputText] = useState("");
  const [selectedCharacterModelId, setSelectedCharacterModelId] = useState<string>("");
  const [emotion, setEmotion] = useState("neutral");
  const [voiceGenerationType, setVoiceGenerationType] = useState<"basic_tts" | "voice_model">("basic_tts");
  const [selectedTTSProvider, setSelectedTTSProvider] = useState("edgetts");
  const [selectedTTSModel, setSelectedTTSModel] = useState("zh-CN-XiaoxiaoNeural"); // 設置預設聲音
  const [referenceAudio, setReferenceAudio] = useState<File | null>(null);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(() => {
    const saved = sessionStorage.getItem('generatedAudio');
    return saved || null;
  });
  const [generatedAudioId, setGeneratedAudioId] = useState<string | null>(() => {
    const saved = sessionStorage.getItem('generatedAudioId');
    return saved || null;
  });
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(() => {
    const saved = sessionStorage.getItem('generatedVideo');
    return saved || null;
  });
  const [generatedVideoId, setGeneratedVideoId] = useState<string | null>(() => {
    const saved = sessionStorage.getItem('generatedVideoId');
    return saved || null;
  });
  const [selectedVoiceModelId, setSelectedVoiceModelId] = useState<string>("");
  const [selectedGeneratedAudioId, setSelectedGeneratedAudioId] = useState<string>("");

  const [videoModalOpen, setVideoModalOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentUser } = useUser();

  // 監聽頁面刷新時清除 sessionStorage（這樣刷新後會清除狀態）
  useEffect(() => {
    const handleBeforeUnload = () => {
      // 只有在真正刷新頁面時才清除，而不是切換頁面
      if (performance.navigation.type === performance.navigation.TYPE_RELOAD) {
        sessionStorage.removeItem('generatedVideo');
        sessionStorage.removeItem('generatedVideoId');
        sessionStorage.removeItem('generatedAudio');
        sessionStorage.removeItem('generatedAudioId');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // 分享/取消分享
  const toggleShareMutation = useMutation({
    mutationFn: async ({ id, isShared }: { id: string; isShared: boolean }) => {
      const response = await apiRequest("PATCH", `/api/content/${id}/favorite`, { 
        isFavorite: isShared, // 後端還是用 isFavorite 欄位，但語義是分享
        userId: currentUser?.username
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      toast({
        title: "操作成功",
        description: data.data.isFavorite ? "已分享給所有人" : "已取消分享",
      });
    },
    onError: () => {
      toast({
        title: "操作失敗",
        description: "請稍後重試",
        variant: "destructive",
      });
    },
  });

  const { data: modelsResponse } = useQuery({
    queryKey: ["/api/models", currentUser?.username],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (currentUser?.username) params.append("userId", currentUser.username);
      const response = await apiRequest("GET", `/api/models?${params.toString()}`);
      return response.json();
    },
  });

  const models = modelsResponse?.data?.list || [];
  const characterModels = models.filter((m: Model) => m.type === "character" && m.status === "ready");
  const voiceModels = models.filter((m: Model) => m.type === "voice" && m.status === "ready");

  // 預設選擇第一個可用的角色模特
  useEffect(() => {
    if (!selectedCharacterModelId && characterModels.length > 0) {
      setSelectedCharacterModelId(characterModels[0].id.toString());
    }
  }, [characterModels, selectedCharacterModelId]);

  // TTS 提供商
  const ttsProviders = [
    { id: "edgetts", name: "EdgeTTS (微軟)", description: "免費，多語言支援" },
    { id: "minimax", name: "MiniMax", description: "付費，高品質中文，支援情緒控制" },
    { id: "aten", name: "ATEN AIVoice", description: "專業級語音合成，支援中文、英文、台語" },
    { id: "fishtts", name: "FishTTS", description: "開源，可自訓練" },
  ];

  // TTS 聲音選項
  const ttsVoices = {
    edgetts: [
      { id: "zh-CN-XiaoxiaoNeural", name: "曉曉 (溫柔女聲)", language: "zh-CN" },
      { id: "zh-CN-YunxiNeural", name: "雲希 (活潑男聲)", language: "zh-CN" },
      { id: "zh-CN-XiaoyiNeural", name: "曉伊 (甜美女聲)", language: "zh-CN" },
      { id: "zh-CN-YunjianNeural", name: "雲健 (沉穩男聲)", language: "zh-CN" },
      { id: "en-US-JennyNeural", name: "Jenny (美式女聲)", language: "en-US" },
      { id: "en-US-GuyNeural", name: "Guy (美式男聲)", language: "en-US" },
    ],
    minimax: [
      { id: "moss_audio_069e7ef7-45ab-11f0-b24c-2e48b7cbf811", name: "小安 (女)", language: "zh-CN" },
      { id: "moss_audio_e2651ab2-50e2-11f0-8bff-3ee21232901d", name: "小賴 (男)", language: "zh-CN" },
      { id: "moss_audio_9e3d9106-42a6-11f0-b6c4-9e15325fe584", name: "Hayley (女)", language: "zh-CN" },
    ],
    aten: [
      // 男聲聲優
      { id: "Aaron", name: "沉穩男聲-裕祥", language: "zh-TW" },
      { id: "Shawn", name: "斯文男聲-俊昇", language: "zh-TW" },
      { id: "Jason", name: "自在男聲-展河", language: "zh-TW" },
      { id: "Winston_narrative", name: "悠然男聲-展揚", language: "zh-TW" },
      { id: "Alan_colloquial", name: "穩健男聲-展仁", language: "zh-TW" },
      { id: "Waldo_Ad", name: "廣告男聲-展龍", language: "zh-TW" },
      { id: "Bill_cheerful", name: "活力男聲-力晨", language: "zh-TW" },
      { id: "Eason_broadcast", name: "廣播男聲-展宏", language: "zh-TW" },
      
      // 女聲聲優
      { id: "Bella_host", name: "動人女聲-貝拉", language: "zh-TW" },
      { id: "Bella_vivid", name: "開朗女聲-貝拉", language: "zh-TW" },
      { id: "Rena", name: "溫和女聲-思柔", language: "zh-TW" },
      { id: "Hannah_colloquial", name: "自在女聲-思涵", language: "zh-TW" },
      { id: "Michelle_colloquial", name: "悠然女聲-思婷", language: "zh-TW" },
      { id: "Celia_call_center", name: "客服女聲-思琪", language: "zh-TW" },
      { id: "Hannah_news", name: "知性女聲-思涵", language: "zh-TW" },
      { id: "Aurora", name: "穩重女聲-嘉妮", language: "zh-TW" },
      
      // 台語聲優
      { id: "Easton_news", name: "台語男聲-文雄", language: "TL" },
      { id: "Raina_narrative", name: "台語女聲-思羽", language: "TL" },
      { id: "Winston_narrative_taigi", name: "台語悠然男聲-展揚", language: "TL" },
      { id: "Celia_call_center_taigi", name: "台語客服女聲-思琪", language: "TL" },
    ],
    fishtts: [
      { id: "default", name: "預設聲音", language: "zh-CN" },
    ],
  };

  // MiniMax 情緒選項
  const minimaxEmotions = [
    { id: "neutral", name: "中性" },
    { id: "happy", name: "開心" },
    { id: "sad", name: "悲傷" },
    { id: "angry", name: "憤怒" },
    { id: "surprised", name: "驚訝" },
    { id: "calm", name: "平靜" },
  ];

  const generateAudioMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/generate/audio", data);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratingAudio(true);
      setAudioProgress(0);
      // 清除之前的音頻狀態
      setGeneratedAudio(null);
      setGeneratedAudioId(null);
      sessionStorage.removeItem('generatedAudio');
      sessionStorage.removeItem('generatedAudioId');

      const interval = setInterval(() => {
        setAudioProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setGeneratingAudio(false);
            // 防護性檢查：確保 data.data 存在
            if (data?.data?.audioUrl) {
              setGeneratedAudio(data.data.audioUrl);
              setGeneratedAudioId(data.data.id);
              // 保存到 sessionStorage
              sessionStorage.setItem('generatedAudio', data.data.audioUrl);
              sessionStorage.setItem('generatedAudioId', data.data.id);
              toast({
                title: "語音生成完成",
                description: "您的語音內容已準備好",
              });
            } else {
              toast({
                title: "語音生成失敗",
                description: "回應格式錯誤，請稍後重試",
                variant: "destructive",
              });
            }
            return 100;
          }
          return prev + 10;
        });
      }, 300);

      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
    },
    onError: () => {
      toast({
        title: "生成失敗",
        description: "請稍後重試",
        variant: "destructive",
      });
      setGeneratingAudio(false);
    },
  });

  const generateVideoMutation = useMutation({
    mutationFn: async (data: InsertGeneratedContent) => {
      const response = await apiRequest("POST", "/api/generate/video", data);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratingVideo(true);
      setVideoProgress(0);
      // 清除之前的影片狀態
      setGeneratedVideo(null);
      setGeneratedVideoId(null);
      sessionStorage.removeItem('generatedVideo');
      sessionStorage.removeItem('generatedVideoId');

      const taskCode = data.data.taskCode;
      console.log(`🎬 開始監控影片生成進度: ${taskCode}`);

      // 真正的進度追蹤 - 增加重試計數和更長的等待時間
      let retryCount = 0;
      const maxRetries = 60; // 最多重試 60 次 (約 5 分鐘)
      
      const checkProgress = async () => {
        try {
          const statusResponse = await apiRequest("GET", `/api/video/query?code=${taskCode}`);
          const statusData = await statusResponse.json();

          console.log(`Face2Face 回應 (重試 ${retryCount}/${maxRetries}):`, statusData);

          // Face2Face 容器的回應格式: { code: 10000, data: {...}, msg: "...", success: true }
          if (statusData.code === 10000) {
            const data = statusData.data;
            const status = data.status;
            const progress = data.progress || 0;

            setVideoProgress(progress);
            retryCount = 0; // 重置重試計數

            if (status === 2 && data.result) {
              // 影片生成完成 (status === 2 表示完成)
              setGeneratingVideo(false);
              setVideoProgress(100);
              const videoUrl = data.video_url || `/videos/${data.result}`;
              setGeneratedVideo(videoUrl);
              setGeneratedVideoId(taskCode);
              // 保存到 sessionStorage
              sessionStorage.setItem('generatedVideo', videoUrl);
              sessionStorage.setItem('generatedVideoId', taskCode);
              toast({
                title: "影片生成完成",
                description: "您的 AI 影片已準備好",
              });
              queryClient.invalidateQueries({ queryKey: ["/api/content"] });
              return; // 停止檢查
            } else if (status === 'failed' || status === -1) {
              // 影片生成失敗
              setGeneratingVideo(false);
              toast({
                title: "影片生成失敗",
                description: "請稍後重試",
                variant: "destructive",
              });
              return; // 停止檢查
            }

            // 繼續檢查進度
            setTimeout(checkProgress, 3000); // 3 秒後再次檢查
          } else if (statusData.code === 10004) {
            // 任務不存在，可能已完成或還在處理中
            retryCount++;
            console.log(`任務暫時查不到 (重試 ${retryCount}/${maxRetries})，可能還在處理中...`);
            
            // 檢查是否超過最大重試次數
            if (retryCount >= maxRetries) {
              console.log('達到最大重試次數，檢查資料庫狀態...');
              
              try {
                // 從 taskCode 提取內容 ID
                const contentIdMatch = taskCode.match(/task_(\d+)_/);
                if (contentIdMatch) {
                  const contentId = contentIdMatch[1];
                  
                  // 檢查資料庫中的內容狀態
                  const contentResponse = await apiRequest("GET", `/api/content/${contentId}`);
                  const contentData = await contentResponse.json();
                  
                  if (contentData.success && contentData.data.status === "completed") {
                    // 任務已在資料庫中標記為完成
                    setGeneratingVideo(false);
                    setVideoProgress(100);
                    setGeneratedVideo(contentData.data.outputPath);
                    setGeneratedVideoId(contentData.data.id);
                    // 保存到 sessionStorage
                    sessionStorage.setItem('generatedVideo', contentData.data.outputPath);
                    sessionStorage.setItem('generatedVideoId', contentData.data.id);
                    toast({
                      title: "影片生成完成",
                      description: "您的 AI 影片已準備好",
                    });
                    queryClient.invalidateQueries({ queryKey: ["/api/content"] });
                    return;
                  } else if (contentData.data.status === "failed") {
                    // 任務失敗
                    setGeneratingVideo(false);
                    toast({
                      title: "影片生成失敗",
                      description: "請稍後重試",
                      variant: "destructive",
                    });
                    return;
                  }
                }
              } catch (error) {
                console.error('檢查資料庫狀態失敗:', error);
              }
              
              // 如果資料庫中還是 processing 狀態，停止監控
              setGeneratingVideo(false);
              toast({
                title: "監控超時",
                description: "影片可能還在生成中，請稍後到作品管理查看",
                variant: "destructive",
              });
              return;
            }
            
            // 繼續嘗試，但間隔時間更長
            setTimeout(checkProgress, 5000); // 5 秒後再次檢查
          } else {
            // 其他錯誤，繼續嘗試
            retryCount++;
            console.log(`查詢失敗 (重試 ${retryCount}/${maxRetries}):`, statusData.msg);
            
            if (retryCount >= maxRetries) {
              setGeneratingVideo(false);
              toast({
                title: "監控超時",
                description: "無法獲取影片生成狀態，請稍後到作品管理查看",
                variant: "destructive",
              });
              return;
            }
            
            setTimeout(checkProgress, 5000); // 5 秒後再次檢查
          }
        } catch (error) {
          retryCount++;
          console.error(`檢查影片生成進度失敗 (重試 ${retryCount}/${maxRetries}):`, error);
          
          if (retryCount >= maxRetries) {
            setGeneratingVideo(false);
            toast({
              title: "監控超時",
              description: "網路連接問題，請稍後到作品管理查看",
              variant: "destructive",
            });
            return;
          }
          
          // 繼續嘗試
          setTimeout(checkProgress, 5000); // 5 秒後再次檢查
        }
      };

      // 開始檢查進度
      setTimeout(checkProgress, 5000); // 5 秒後開始第一次檢查

      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
    },
    onError: () => {
      toast({
        title: "生成失敗",
        description: "請稍後重試",
        variant: "destructive",
      });
      setGeneratingVideo(false);
    },
  });

  const handleGenerateAudio = () => {
    if (!inputText && voiceGenerationType === "basic_tts") {
      toast({
        title: "請輸入文本",
        description: "TTS 生成需要輸入文本內容",
        variant: "destructive",
      });
      return;
    }

    if (voiceGenerationType === "voice_model" && selectedTTSModel === "upload_new" && !referenceAudio) {
      toast({
        title: "請上傳參考音頻",
        description: "上傳音頻需要上傳音頻文件",
        variant: "destructive",
      });
      return;
    }

    generateAudioMutation.mutate({
      inputText: voiceGenerationType === "basic_tts" ? inputText : "",
      emotion,
      type: "audio",
      voiceSource: voiceGenerationType === "basic_tts" ? "default" : (selectedTTSModel === "upload_new" ? "reference" : "model"),
      provider: selectedTTSProvider,
      ttsModel: selectedTTSModel,
      referenceAudio: referenceAudio,
      userId: currentUser?.username, // 確保音頻歸屬於當前用戶
    });
  };

  const handleGenerateVideo = () => {
    if (!selectedCharacterModelId) {
      toast({
        title: "請選擇人物形象",
        description: "影片生成需要選擇人物形象",
        variant: "destructive",
      });
      return;
    }

    if (!inputText && voiceGenerationType === "basic_tts") {
      toast({
        title: "請輸入文本",
        description: "TTS 生成需要輸入文本內容",
        variant: "destructive",
      });
      return;
    }

    if (voiceGenerationType === "voice_model" && selectedTTSModel === "upload_new" && !referenceAudio) {
      toast({
        title: "請上傳參考音頻",
        description: "上傳音頻需要上傳音頻文件",
        variant: "destructive",
      });
      return;
    }

    const videoData: any = {
      modelId: parseInt(selectedCharacterModelId), // 轉換為數字
      inputText: voiceGenerationType === "basic_tts" ? inputText : "",
      emotion,
      type: "video",
      voiceSource: voiceGenerationType === "basic_tts" ? "default" : (selectedTTSModel === "upload_new" ? "reference" : "model"),
      provider: selectedTTSProvider,
      ttsModel: selectedTTSModel,
      userId: currentUser?.username, // 確保影片歸屬於當前用戶
    };

    // 如果有參考音頻，添加到數據中
    if (referenceAudio) {
      videoData.referenceAudio = referenceAudio;
    }

    generateVideoMutation.mutate(videoData);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">影音生成器</h1>
        <p className="text-gray-600">使用AI模特創建專業的影片和語音內容</p>
      </div>

      <Tabs defaultValue="audio" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="audio">語音生成</TabsTrigger>
          <TabsTrigger value="video">影片生成</TabsTrigger>
        </TabsList>

        <TabsContent value="audio" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">語音生成</h3>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-6">
                  <VoiceSettings
                    voiceGenerationType={voiceGenerationType}
                    setVoiceGenerationType={setVoiceGenerationType}
                    inputText={inputText}
                    setInputText={setInputText}
                    selectedTTSProvider={selectedTTSProvider}
                    setSelectedTTSProvider={setSelectedTTSProvider}
                    selectedTTSModel={selectedTTSModel}
                    setSelectedTTSModel={setSelectedTTSModel}
                    referenceAudio={referenceAudio}
                    setReferenceAudio={setReferenceAudio}
                    ttsProviders={ttsProviders}
                    ttsVoices={ttsVoices}
                    minimaxEmotions={[]}
                    voiceModels={voiceModels}
                    showMinimaxAdvanced={false}
                    setShowMinimaxAdvanced={() => {}}
                    minimaxEmotion=""
                    setMinimaxEmotion={() => {}}
                    minimaxVolume={[1.0]}
                    setMinimaxVolume={() => {}}
                    minimaxSpeed={[1.0]}
                    setMinimaxSpeed={() => {}}
                    minimaxPitch={[0]}
                    setMinimaxPitch={() => {}}
                    showATENAdvanced={false}
                    setShowATENAdvanced={() => {}}
                    atenPitch={[0]}
                    setAtenPitch={() => {}}
                    atenRate={[1.0]}
                    setAtenRate={() => {}}
                    atenVolume={[0]}
                    setAtenVolume={() => {}}
                    atenSilenceScale={[1.0]}
                    setAtenSilenceScale={() => {}}
                  />
                </div>

                <GenerationPanel>
                  <Button
                    className="w-full"
                    onClick={handleGenerateAudio}
                    disabled={generatingAudio || generateAudioMutation.isPending}
                  >
                    <MicOff className="mr-2 h-4 w-4" />
                    {generatingAudio ? "生成中..." : "生成語音"}
                  </Button>

                  {generatingAudio && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        <span className="text-blue-700 text-sm font-medium">正在生成語音...</span>
                      </div>
                      <Progress value={audioProgress} className="h-2" />
                    </div>
                  )}

                  {generatedAudio && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">語音預覽</span>
                        <div className="flex items-center space-x-2">
                          {generatedAudioId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleShareMutation.mutate({ id: generatedAudioId, isShared: true })}
                              className="text-gray-400 hover:text-blue-500"
                              title="分享給所有人"
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              if (generatedAudio) {
                                const link = document.createElement('a');
                                link.href = generatedAudio;
                                link.download = `ai-audio-${Date.now()}.wav`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <AudioPlayer src={generatedAudio} />
                    </div>
                  )}
                </GenerationPanel>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="video" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">影片生成 (包含語音)</h3>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-6">
                  {/* 人物形象選擇 */}
                  <div>
                    <Label className="text-base font-semibold">選擇人物形象</Label>
                    <Select value={selectedCharacterModelId} onValueChange={setSelectedCharacterModelId}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="選擇人物形象" />
                      </SelectTrigger>
                      <SelectContent>
                        {characterModels.map((model: Model) => (
                          <SelectItem key={model.id} value={model.id.toString()}>
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700">
                                人物
                              </span>
                              <span>{model.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <VoiceSettings
                    voiceGenerationType={voiceGenerationType}
                    setVoiceGenerationType={setVoiceGenerationType}
                    inputText={inputText}
                    setInputText={setInputText}
                    selectedTTSProvider={selectedTTSProvider}
                    setSelectedTTSProvider={setSelectedTTSProvider}
                    selectedTTSModel={selectedTTSModel}
                    setSelectedTTSModel={setSelectedTTSModel}
                    referenceAudio={referenceAudio}
                    setReferenceAudio={setReferenceAudio}
                    ttsProviders={ttsProviders}
                    ttsVoices={ttsVoices}
                    minimaxEmotions={[]}
                    voiceModels={voiceModels}
                    showMinimaxAdvanced={false}
                    setShowMinimaxAdvanced={() => {}}
                    minimaxEmotion=""
                    setMinimaxEmotion={() => {}}
                    minimaxVolume={[1.0]}
                    setMinimaxVolume={() => {}}
                    minimaxSpeed={[1.0]}
                    setMinimaxSpeed={() => {}}
                    minimaxPitch={[0]}
                    setMinimaxPitch={() => {}}
                    showATENAdvanced={false}
                    setShowATENAdvanced={() => {}}
                    atenPitch={[0]}
                    setAtenPitch={() => {}}
                    atenRate={[1.0]}
                    setAtenRate={() => {}}
                    atenVolume={[0]}
                    setAtenVolume={() => {}}
                    atenSilenceScale={[1.0]}
                    setAtenSilenceScale={() => {}}
                  />
                </div>

                <GenerationPanel>
                  <Button
                    className="w-full bg-purple-500 hover:bg-purple-600"
                    onClick={handleGenerateVideo}
                    disabled={generatingVideo || generateVideoMutation.isPending}
                  >
                    <Video className="mr-2 h-4 w-4" />
                    {generatingVideo ? "生成中..." : "生成影片"}
                  </Button>

                  {generatingVideo && (
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                        <span className="text-purple-700 text-sm font-medium">正在生成影片...</span>
                      </div>
                      <Progress value={videoProgress} className="h-2" />
                    </div>
                  )}

                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                    {generatedVideo ? (
                      <div className="w-full h-full relative group">
                        <video
                          src={generatedVideo}
                          controls
                          className="w-full h-full rounded-lg object-contain"
                          onError={(e) => {
                            console.error('影片載入失敗:', e);
                            toast({
                              title: "影片載入失敗",
                              description: "請檢查影片檔案是否存在",
                              variant: "destructive",
                            });
                          }}
                        >
                          您的瀏覽器不支援影片播放
                        </video>
                        
                        {/* 放大按鈕 */}
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setVideoModalOpen(true)}
                        >
                          <Expand className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-sm font-medium text-gray-700">影片預覽</span>
                          <div className="flex items-center space-x-2">
                            {generatedVideoId && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleShareMutation.mutate({ id: generatedVideoId, isShared: true })}
                                className="text-gray-400 hover:text-blue-500"
                                title="分享給所有人"
                              >
                                <Users className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                if (generatedVideo) {
                                  const link = document.createElement('a');
                                  link.href = generatedVideo;
                                  link.download = `ai-video-${Date.now()}.mp4`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Video className="text-gray-400 h-8 w-8 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">影片將在此顯示</p>
                      </div>
                    )}
                  </div>
                </GenerationPanel>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* 影片放大模態框 */}
      {generatedVideo && (
        <VideoModal
          src={generatedVideo}
          title="AI 生成影片預覽"
          isOpen={videoModalOpen}
          onClose={() => setVideoModalOpen(false)}
          onDownload={() => {
            if (generatedVideo) {
              const link = document.createElement('a');
              link.href = generatedVideo;
              link.download = `ai-video-${Date.now()}.mp4`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
          }}
        />
      )}
    </div>
  );
}
