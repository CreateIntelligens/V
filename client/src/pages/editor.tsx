import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { AudioPlayer } from "@/components/audio-player";
import { MicOff, Video, Download, Star, Play, Settings, Zap } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Model, InsertGeneratedContent } from "@shared/schema";

export default function VideoEditor() {
  const [inputText, setInputText] = useState("");
  const [selectedCharacterModelId, setSelectedCharacterModelId] = useState<string>("");
  const [emotion, setEmotion] = useState("neutral");
  const [voiceGenerationType, setVoiceGenerationType] = useState<"basic_tts" | "voice_model" | "voice_clone">("basic_tts");
  const [selectedTTSProvider, setSelectedTTSProvider] = useState("edgetts");
  const [selectedTTSModel, setSelectedTTSModel] = useState("zh-CN-XiaoxiaoNeural"); // 設置預設聲音
  const [referenceAudio, setReferenceAudio] = useState<File | null>(null);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [generatedAudioId, setGeneratedAudioId] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [generatedVideoId, setGeneratedVideoId] = useState<string | null>(null);
  const [selectedVoiceModelId, setSelectedVoiceModelId] = useState<string>("");
  const [selectedGeneratedAudioId, setSelectedGeneratedAudioId] = useState<string>("");

  // MiniMax 進階控制
  const [minimaxEmotion, setMinimaxEmotion] = useState("neutral");
  const [minimaxVolume, setMinimaxVolume] = useState([1.0]);
  const [minimaxSpeed, setMinimaxSpeed] = useState([1.0]);
  const [minimaxPitch, setMinimaxPitch] = useState([0]);
  const [showMinimaxAdvanced, setShowMinimaxAdvanced] = useState(false);

  // ATEN 進階控制
  const [showATENAdvanced, setShowATENAdvanced] = useState(false);
  const [atenPitch, setAtenPitch] = useState([0]);
  const [atenRate, setAtenRate] = useState([1.0]);
  const [atenVolume, setAtenVolume] = useState([0]);
  const [atenSilenceScale, setAtenSilenceScale] = useState([1.0]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 收藏/取消收藏
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const response = await apiRequest("PATCH", `/api/content/${id}/favorite`, { isFavorite });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      toast({
        title: data.message,
        description: data.data.isFavorite ? "已加入收藏" : "已取消收藏",
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
    queryKey: ["/api/models"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/models");
      return response.json();
    },
  });

  const models = modelsResponse?.data?.list || [];
  const characterModels = models.filter((m: Model) => m.type === "character" && m.status === "ready");

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

      const interval = setInterval(() => {
        setAudioProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setGeneratingAudio(false);
            // 防護性檢查：確保 data.data 存在
            if (data?.data?.audioUrl) {
              setGeneratedAudio(data.data.audioUrl);
              setGeneratedAudioId(data.data.id);
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
              setGeneratedVideo(data.video_url || `/videos/${data.result}`);
              setGeneratedVideoId(taskCode);
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

    if (voiceGenerationType === "voice_clone" && !referenceAudio) {
      toast({
        title: "請上傳參考音頻",
        description: "參考音頻生成需要上傳音頻文件",
        variant: "destructive",
      });
      return;
    }

    generateAudioMutation.mutate({
      inputText: voiceGenerationType === "basic_tts" ? inputText : "",
      emotion,
      type: "audio",
      voiceSource: voiceGenerationType === "basic_tts" ? "model" : "reference",
      provider: selectedTTSProvider,
      ttsModel: selectedTTSModel,
      referenceAudio: referenceAudio,
      // MiniMax 進階設定
      minimaxEmotion,
      minimaxVolume: minimaxVolume[0],
      minimaxSpeed: minimaxSpeed[0],
      minimaxPitch: minimaxPitch[0],
      // ATEN 進階設定
      atenPitch: atenPitch[0],
      atenRate: atenRate[0],
      atenVolume: atenVolume[0],
      atenSilenceScale: atenSilenceScale[0],
    });
  };

  const handleGenerateVideo = () => {
    if (!selectedCharacterModelId) {
      toast({
        title: "請選擇人物模特",
        description: "影片生成需要選擇人物模特",
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

    if (voiceGenerationType === "voice_clone" && !referenceAudio) {
      toast({
        title: "請上傳參考音頻",
        description: "參考音頻生成需要上傳音頻文件",
        variant: "destructive",
      });
      return;
    }

    const videoData: any = {
      modelId: parseInt(selectedCharacterModelId), // 轉換為數字
      inputText: voiceGenerationType === "basic_tts" ? inputText : "",
      emotion,
      type: "video",
      voiceSource: voiceGenerationType === "basic_tts" ? "model" : "reference",
      provider: selectedTTSProvider,
      ttsModel: selectedTTSModel,
      // MiniMax 進階設定
      minimaxEmotion,
      minimaxVolume: minimaxVolume[0],
      minimaxSpeed: minimaxSpeed[0],
      minimaxPitch: minimaxPitch[0],
      // ATEN 進階設定
      atenPitch: atenPitch[0],
      atenRate: atenRate[0],
      atenVolume: atenVolume[0],
      atenSilenceScale: atenSilenceScale[0],
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
                  {/* 語音生成方式選擇 */}
                  <div>
                    <Label className="text-base font-semibold">語音生成方式</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                      <Card
                        className={`cursor-pointer transition-all ${voiceGenerationType === "basic_tts"
                            ? 'ring-2 ring-primary border-primary'
                            : 'hover:shadow-md'
                          }`}
                        onClick={() => setVoiceGenerationType("basic_tts")}
                      >
                        <CardContent className="p-4">
                          <h4 className="font-medium text-gray-900 mb-1">基礎TTS</h4>
                          <p className="text-xs text-gray-600">使用預設聲音快速轉換文字為語音</p>
                        </CardContent>
                      </Card>

                      <Card
                        className={`cursor-pointer transition-all ${voiceGenerationType === "voice_model"
                            ? 'ring-2 ring-primary border-primary'
                            : 'hover:shadow-md'
                          }`}
                        onClick={() => setVoiceGenerationType("voice_model")}
                      >
                        <CardContent className="p-4">
                          <h4 className="font-medium text-gray-900 mb-1">聲音模特</h4>
                          <p className="text-xs text-gray-600">使用已訓練的聲音模特生成語音</p>
                        </CardContent>
                      </Card>

                      <Card
                        className={`cursor-pointer transition-all ${voiceGenerationType === "voice_clone"
                            ? 'ring-2 ring-primary border-primary'
                            : 'hover:shadow-md'
                          }`}
                        onClick={() => setVoiceGenerationType("voice_clone")}
                      >
                        <CardContent className="p-4">
                          <h4 className="font-medium text-gray-900 mb-1">聲音克隆</h4>
                          <p className="text-xs text-gray-600">上傳參考音頻即時克隆聲音特徵</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* 文本輸入 (基礎TTS 模式) */}
                  {voiceGenerationType === "basic_tts" && (
                    <div>
                      <Label htmlFor="inputText">輸入文本</Label>
                      <Textarea
                        id="inputText"
                        placeholder="輸入要轉換的文本內容..."
                        rows={4}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="resize-none mt-2"
                      />
                    </div>
                  )}

                  {/* TTS 提供商選擇 (基礎TTS 模式) */}
                  {voiceGenerationType === "basic_tts" && (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-semibold">選擇 TTS 提供商</Label>
                        <Select value={selectedTTSProvider} onValueChange={(value) => {
                          setSelectedTTSProvider(value);
                          // 設置該提供商的預設聲音
                          const defaultVoice = ttsVoices[value as keyof typeof ttsVoices]?.[0]?.id || "";
                          setSelectedTTSModel(defaultVoice);
                        }}>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="選擇 TTS 提供商" />
                          </SelectTrigger>
                          <SelectContent>
                            {ttsProviders.map((provider) => (
                              <SelectItem key={provider.id} value={provider.id}>
                                <div className="flex flex-col items-start w-full">
                                  <span className="font-medium text-left">{provider.name}</span>
                                  <span className="text-xs text-gray-500 text-left">{provider.description}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedTTSProvider && (
                        <div>
                          <Label className="text-base font-semibold">選擇聲音</Label>
                          <Select value={selectedTTSModel} onValueChange={setSelectedTTSModel}>
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="選擇聲音" />
                            </SelectTrigger>
                            <SelectContent>
                              {ttsVoices[selectedTTSProvider as keyof typeof ttsVoices]?.map((voice) => (
                                <SelectItem key={voice.id} value={voice.id}>
                                  <div className="flex items-center space-x-2">
                                    <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">
                                      {voice.language}
                                    </span>
                                    <span>{voice.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* MiniMax 進階設定 */}
                      {selectedTTSProvider === "minimax" && (
                        <div className="space-y-3">
                          <Collapsible open={showMinimaxAdvanced} onOpenChange={setShowMinimaxAdvanced}>
                            <CollapsibleTrigger asChild>
                              <Button variant="outline" className="w-full">
                                <Settings className="mr-2 h-4 w-4" />
                                <Zap className="mr-2 h-4 w-4 text-yellow-500" />
                                MiniMax 進階設定
                                {showMinimaxAdvanced ? " (已展開)" : " (點擊展開)"}
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-4 mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                              {/* 情緒選擇 */}
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">情緒表達</Label>
                                <Select value={minimaxEmotion} onValueChange={setMinimaxEmotion}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="選擇情緒" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {minimaxEmotions.map((emotion) => (
                                      <SelectItem key={emotion.id} value={emotion.id}>
                                        {emotion.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* 音量控制 */}
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">音量: {minimaxVolume[0].toFixed(1)}</Label>
                                <Slider
                                  value={minimaxVolume}
                                  onValueChange={setMinimaxVolume}
                                  max={2.0}
                                  min={0.1}
                                  step={0.1}
                                  className="w-full"
                                />
                                <div className="flex justify-between text-xs text-gray-500">
                                  <span>0.1 (最小)</span>
                                  <span>2.0 (最大)</span>
                                </div>
                              </div>

                              {/* 語速控制 */}
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">語速: {minimaxSpeed[0].toFixed(1)}</Label>
                                <Slider
                                  value={minimaxSpeed}
                                  onValueChange={setMinimaxSpeed}
                                  max={2.0}
                                  min={0.5}
                                  step={0.1}
                                  className="w-full"
                                />
                                <div className="flex justify-between text-xs text-gray-500">
                                  <span>0.5 (慢)</span>
                                  <span>2.0 (快)</span>
                                </div>
                              </div>

                              {/* 音調控制 */}
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">音調: {minimaxPitch[0] > 0 ? '+' : ''}{minimaxPitch[0]}</Label>
                                <Slider
                                  value={minimaxPitch}
                                  onValueChange={setMinimaxPitch}
                                  max={12}
                                  min={-12}
                                  step={1}
                                  className="w-full"
                                />
                                <div className="flex justify-between text-xs text-gray-500">
                                  <span>-12 (低)</span>
                                  <span>+12 (高)</span>
                                </div>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      )}

                      {/* ATEN 進階設定 */}
                      {selectedTTSProvider === "aten" && (
                        <div className="space-y-3">
                          <Collapsible open={showATENAdvanced} onOpenChange={setShowATENAdvanced}>
                            <CollapsibleTrigger asChild>
                              <Button variant="outline" className="w-full">
                                <Settings className="mr-2 h-4 w-4" />
                                ATEN 進階語音設定
                                {showATENAdvanced ? " (已展開)" : " (點擊展開)"}
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-4 mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                              <div className="space-y-4">
                                <Label className="text-base font-semibold">精細語音參數調整</Label>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  {/* 音調 */}
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <Label className="text-sm font-medium">音調 (Pitch)</Label>
                                      <span className="text-sm text-muted-foreground">
                                        {atenPitch[0] > 0 ? '+' : ''}{atenPitch[0].toFixed(1)}st
                                      </span>
                                    </div>
                                    <Slider
                                      value={atenPitch}
                                      onValueChange={setAtenPitch}
                                      min={-2}
                                      max={2}
                                      step={0.1}
                                      className="w-full"
                                    />
                                    <div className="text-xs text-muted-foreground">
                                      調整聲音的基頻高低 (-2st ~ +2st)
                                    </div>
                                  </div>

                                  {/* 語速 */}
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <Label className="text-sm font-medium">語速 (Rate)</Label>
                                      <span className="text-sm text-muted-foreground">
                                        {atenRate[0].toFixed(1)}x
                                      </span>
                                    </div>
                                    <Slider
                                      value={atenRate}
                                      onValueChange={setAtenRate}
                                      min={0.8}
                                      max={1.2}
                                      step={0.1}
                                      className="w-full"
                                    />
                                    <div className="text-xs text-muted-foreground">
                                      調整說話速度 (0.8x ~ 1.2x)
                                    </div>
                                  </div>

                                  {/* 音量 */}
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <Label className="text-sm font-medium">音量 (Volume)</Label>
                                      <span className="text-sm text-muted-foreground">
                                        {atenVolume[0] > 0 ? '+' : ''}{atenVolume[0].toFixed(1)}dB
                                      </span>
                                    </div>
                                    <Slider
                                      value={atenVolume}
                                      onValueChange={setAtenVolume}
                                      min={-6}
                                      max={6}
                                      step={0.5}
                                      className="w-full"
                                    />
                                    <div className="text-xs text-muted-foreground">
                                      調整音量大小 (-6dB ~ +6dB)
                                    </div>
                                  </div>

                                  {/* 停頓時間 */}
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <Label className="text-sm font-medium">停頓時間 (Silence Scale)</Label>
                                      <span className="text-sm text-muted-foreground">
                                        {atenSilenceScale[0].toFixed(1)}x
                                      </span>
                                    </div>
                                    <Slider
                                      value={atenSilenceScale}
                                      onValueChange={setAtenSilenceScale}
                                      min={0.5}
                                      max={3.0}
                                      step={0.1}
                                      className="w-full"
                                    />
                                    <div className="text-xs text-muted-foreground">
                                      調整注音符號停頓時間 (0.5x ~ 3.0x)
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      )}

                    </div>
                  )}

                  {/* 參考音頻上傳 */}
                  {voiceGenerationType === "voice_clone" && (
                    <div>
                      <Label className="text-base font-semibold">上傳參考音頻</Label>
                      <div className="mt-3">
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={(e) => setReferenceAudio(e.target.files?.[0] || null)}
                          className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-primary file:text-primary-foreground
                            hover:file:bg-primary/90"
                        />
                        {referenceAudio && (
                          <p className="mt-2 text-sm text-gray-600">
                            已選擇: {referenceAudio.name}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
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
                              onClick={() => toggleFavoriteMutation.mutate({ id: generatedAudioId, isFavorite: true })}
                              className="text-gray-400 hover:text-yellow-500"
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <AudioPlayer src={generatedAudio} />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="video" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">影片生成 (包含語音)</h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  {/* 人物模特選擇 */}
                  <div>
                    <Label className="text-base font-semibold">選擇人物模特</Label>
                    <Select value={selectedCharacterModelId} onValueChange={setSelectedCharacterModelId}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="選擇人物模特" />
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

                  {/* 語音生成方式選擇 */}
                  <div>
                    <Label className="text-base font-semibold">語音生成方式</Label>
                    <div className="grid grid-cols-1 gap-3 mt-3">
                      <Card
                        className={`cursor-pointer transition-all ${voiceGenerationType === "basic_tts"
                            ? 'ring-2 ring-primary border-primary'
                            : 'hover:shadow-md'
                          }`}
                        onClick={() => setVoiceGenerationType("basic_tts")}
                      >
                        <CardContent className="p-4">
                          <h4 className="font-medium text-gray-900 mb-1">基礎TTS</h4>
                          <p className="text-xs text-gray-600">使用預設聲音快速轉換文字為語音</p>
                        </CardContent>
                      </Card>

                      <Card
                        className={`cursor-pointer transition-all ${voiceGenerationType === "voice_model"
                            ? 'ring-2 ring-primary border-primary'
                            : 'hover:shadow-md'
                          }`}
                        onClick={() => setVoiceGenerationType("voice_model")}
                      >
                        <CardContent className="p-4">
                          <h4 className="font-medium text-gray-900 mb-1">聲音模特</h4>
                          <p className="text-xs text-gray-600">使用已訓練的聲音模特生成語音</p>
                        </CardContent>
                      </Card>

                      <Card
                        className={`cursor-pointer transition-all ${voiceGenerationType === "voice_clone"
                            ? 'ring-2 ring-primary border-primary'
                            : 'hover:shadow-md'
                          }`}
                        onClick={() => setVoiceGenerationType("voice_clone")}
                      >
                        <CardContent className="p-4">
                          <h4 className="font-medium text-gray-900 mb-1">聲音克隆</h4>
                          <p className="text-xs text-gray-600">上傳參考音頻即時克隆聲音特徵</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* 文本輸入 (基礎TTS 模式) */}
                  {voiceGenerationType === "basic_tts" && (
                    <div>
                      <Label htmlFor="videoInputText">輸入文本</Label>
                      <Textarea
                        id="videoInputText"
                        placeholder="輸入要轉換的文本內容..."
                        rows={4}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="resize-none mt-2"
                      />
                    </div>
                  )}

                  {/* TTS 提供商選擇 (基礎TTS 模式) */}
                  {voiceGenerationType === "basic_tts" && (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-semibold">選擇 TTS 提供商</Label>
                        <Select value={selectedTTSProvider} onValueChange={(value) => {
                          setSelectedTTSProvider(value);
                          // 設置該提供商的預設聲音
                          const defaultVoice = ttsVoices[value as keyof typeof ttsVoices]?.[0]?.id || "";
                          setSelectedTTSModel(defaultVoice);
                        }}>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="選擇 TTS 提供商" />
                          </SelectTrigger>
                          <SelectContent>
                            {ttsProviders.map((provider) => (
                              <SelectItem key={provider.id} value={provider.id}>
                                <div className="flex flex-col items-start w-full">
                                  <span className="font-medium text-left">{provider.name}</span>
                                  <span className="text-xs text-gray-500 text-left">{provider.description}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedTTSProvider && (
                        <div>
                          <Label className="text-base font-semibold">選擇聲音</Label>
                          <Select value={selectedTTSModel} onValueChange={setSelectedTTSModel}>
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="選擇聲音" />
                            </SelectTrigger>
                            <SelectContent>
                              {ttsVoices[selectedTTSProvider as keyof typeof ttsVoices]?.map((voice) => (
                                <SelectItem key={voice.id} value={voice.id}>
                                  <div className="flex items-center space-x-2">
                                    <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">
                                      {voice.language}
                                    </span>
                                    <span>{voice.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* MiniMax 進階設定 (影片生成) */}
                      {selectedTTSProvider === "minimax" && (
                        <div className="space-y-3">
                          <Collapsible open={showMinimaxAdvanced} onOpenChange={setShowMinimaxAdvanced}>
                            <CollapsibleTrigger asChild>
                              <Button variant="outline" className="w-full">
                                <Settings className="mr-2 h-4 w-4" />
                                <Zap className="mr-2 h-4 w-4 text-yellow-500" />
                                MiniMax 進階設定
                                {showMinimaxAdvanced ? " (已展開)" : " (點擊展開)"}
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-4 mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                              {/* 情緒選擇 */}
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">情緒表達</Label>
                                <Select value={minimaxEmotion} onValueChange={setMinimaxEmotion}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="選擇情緒" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {minimaxEmotions.map((emotion) => (
                                      <SelectItem key={emotion.id} value={emotion.id}>
                                        {emotion.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* 音量控制 */}
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">音量: {minimaxVolume[0].toFixed(1)}</Label>
                                <Slider
                                  value={minimaxVolume}
                                  onValueChange={setMinimaxVolume}
                                  max={2.0}
                                  min={0.1}
                                  step={0.1}
                                  className="w-full"
                                />
                                <div className="flex justify-between text-xs text-gray-500">
                                  <span>0.1 (最小)</span>
                                  <span>2.0 (最大)</span>
                                </div>
                              </div>

                              {/* 語速控制 */}
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">語速: {minimaxSpeed[0].toFixed(1)}</Label>
                                <Slider
                                  value={minimaxSpeed}
                                  onValueChange={setMinimaxSpeed}
                                  max={2.0}
                                  min={0.5}
                                  step={0.1}
                                  className="w-full"
                                />
                                <div className="flex justify-between text-xs text-gray-500">
                                  <span>0.5 (慢)</span>
                                  <span>2.0 (快)</span>
                                </div>
                              </div>

                              {/* 音調控制 */}
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">音調: {minimaxPitch[0] > 0 ? '+' : ''}{minimaxPitch[0]}</Label>
                                <Slider
                                  value={minimaxPitch}
                                  onValueChange={setMinimaxPitch}
                                  max={12}
                                  min={-12}
                                  step={1}
                                  className="w-full"
                                />
                                <div className="flex justify-between text-xs text-gray-500">
                                  <span>-12 (低)</span>
                                  <span>+12 (高)</span>
                                </div>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 參考音頻上傳 */}
                  {voiceGenerationType === "voice_clone" && (
                    <div>
                      <Label className="text-base font-semibold">上傳參考音頻</Label>
                      <div className="mt-3">
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={(e) => setReferenceAudio(e.target.files?.[0] || null)}
                          className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-primary file:text-primary-foreground
                            hover:file:bg-primary/90"
                        />
                        {referenceAudio && (
                          <p className="mt-2 text-sm text-gray-600">
                            已選擇: {referenceAudio.name}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
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
                      <div className="w-full h-full">
                        <video
                          src={generatedVideo}
                          controls
                          className="w-full h-full rounded-lg object-cover"
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
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-sm font-medium text-gray-700">影片預覽</span>
                          <div className="flex items-center space-x-2">
                            {generatedVideoId && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleFavoriteMutation.mutate({ id: generatedVideoId, isFavorite: true })}
                                className="text-gray-400 hover:text-yellow-500"
                              >
                                <Star className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm">
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
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
