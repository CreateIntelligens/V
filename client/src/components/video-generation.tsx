import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Play, Download, Loader2, Video, Upload, User, Mic } from "lucide-react";
import { VoiceSynthesisPanel } from "@/components/tts/voice-synthesis-panel";

interface VideoGenerationProps {
  onVideoGenerated?: (videoUrl: string) => void;
}

// TTS 提供商選項
const TTS_PROVIDERS = [
  { id: "edgetts", name: "EdgeTTS (免費)", description: "微軟 Edge 語音合成" },
  { id: "minimax", name: "MiniMax (高品質)", description: "商業級語音合成" },
  { id: "fishtts", name: "Fish TTS (本地)", description: "本地語音合成" },
];

// EdgeTTS 聲音選項
const EDGETTS_VOICES = [
  { id: "zh-CN-XiaoxiaoNeural", name: "曉曉 - 溫柔女聲", language: "zh-CN" },
  { id: "zh-CN-YunxiNeural", name: "雲希 - 成熟男聲", language: "zh-CN" },
  { id: "zh-CN-YunyangNeural", name: "雲揚 - 專業男聲", language: "zh-CN" },
  { id: "zh-CN-XiaoyiNeural", name: "曉伊 - 甜美女聲", language: "zh-CN" },
  { id: "zh-CN-YunjianNeural", name: "雲健 - 渾厚男聲", language: "zh-CN" },
];

export function VideoGeneration({ onVideoGenerated }: VideoGenerationProps) {
  const { toast } = useToast();
  const [selectedModel, setSelectedModel] = useState<string>("1751016573603");
  const [textInput, setTextInput] = useState("");
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [taskCode, setTaskCode] = useState<string>("");

  // 語音生成相關狀態
  const [voiceGenerationType, setVoiceGenerationType] = useState<"basic_tts" | "voice_model">("basic_tts");
  const [selectedTTSProvider, setSelectedTTSProvider] = useState("edgetts");
  const [selectedTTSModel, setSelectedTTSModel] = useState("zh-CN-XiaoxiaoNeural");
  const [referenceAudio, setReferenceAudio] = useState<File | null>(null);

  // VoAI 進階設定狀態
  const [showVoAIAdvanced, setShowVoAIAdvanced] = useState(false);
  const [voaiModel, setVoaiModel] = useState("Neo");
  const [voaiStyle, setVoaiStyle] = useState("預設");
  const [voaiSpeed, setVoaiSpeed] = useState([1.0]);
  const [voaiPitch, setVoaiPitch] = useState([0]);

  // MiniMax 進階設定狀態
  const [showMinimaxAdvanced, setShowMinimaxAdvanced] = useState(false);
  const [minimaxEmotion, setMinimaxEmotion] = useState("neutral");
  const [minimaxVolume, setMinimaxVolume] = useState([1.0]);
  const [minimaxSpeed, setMinimaxSpeed] = useState([1.0]);
  const [minimaxPitch, setMinimaxPitch] = useState([0]);

  // ATEN 進階設定狀態
  const [showATENAdvanced, setShowATENAdvanced] = useState(false);
  const [atenPitch, setAtenPitch] = useState([0]);
  const [atenRate, setAtenRate] = useState([1.0]);
  const [atenVolume, setAtenVolume] = useState([0]);
  const [atenSilenceScale, setAtenSilenceScale] = useState([1.0]);

  // 獲取可用的人物模型
  const { data: modelsData, isLoading, error } = useQuery({
    queryKey: ["/api/models"],
    select: (data: any) => data?.data?.list || [],
  });

  // 獲取自定義聲音模型
  const { data: voiceModelsData } = useQuery({
    queryKey: ["/api/models", "voice"],
    select: (data: any) => {
      const allModels = data?.data?.list || [];
      return allModels.filter((model: any) => model.type === "voice");
    },
  });

  // 獲取 TTS 提供商
  const { data: ttsProvidersData } = useQuery({
    queryKey: ["/api/tts/providers"],
    select: (data: any) => data?.data || [],
  });

  // 獲取 TTS 聲音列表
  const { data: ttsVoicesData } = useQuery({
    queryKey: ["/api/tts/voices"],
    select: (data: any) => data?.data || {},
  });

  // 獲取 MiniMax 情緒列表
  const { data: minimaxEmotionsData } = useQuery({
    queryKey: ["/api/tts/minimax/emotions"],
    select: (data: any) => data?.data || [],
  });

  // 載入保存的選擇
  useEffect(() => {
    const savedModel = localStorage.getItem('selectedVideoModel');
    const savedProvider = localStorage.getItem('selectedVideoProvider');
    const savedVoice = localStorage.getItem('selectedVideoVoice');
    
    if (savedModel) {
      setSelectedModel(savedModel);
    }
    if (savedProvider && TTS_PROVIDERS.find(p => p.id === savedProvider)) {
      setSelectedTTSProvider(savedProvider);
    }
    if (savedVoice) {
      setSelectedTTSModel(savedVoice);
    }
  }, []);

  // 設定TTS預設值
  useEffect(() => {
    if (ttsProvidersData && ttsProvidersData.length > 0 && !selectedTTSProvider) {
      const defaultProvider = ttsProvidersData[0]?.id || "edgetts";
      setSelectedTTSProvider(defaultProvider);
    }
  }, [ttsProvidersData, selectedTTSProvider]);

  // 設定語音角色預設值
  useEffect(() => {
    if (selectedTTSProvider && ttsVoicesData && ttsVoicesData[selectedTTSProvider] && !selectedTTSModel) {
      const defaultVoice = ttsVoicesData[selectedTTSProvider]?.[0]?.id || "";
      if (defaultVoice) {
        setSelectedTTSModel(defaultVoice);
      }
    }
  }, [selectedTTSProvider, ttsVoicesData, selectedTTSModel]);

  // 設定人物模型預設值
  useEffect(() => {
    if (modelsData && modelsData.length > 0 && !selectedModel) {
      const defaultModel = modelsData[0]?.id?.toString() || "1751016573603";
      setSelectedModel(defaultModel);
    }
  }, [modelsData, selectedModel]);

  // 記住用戶的選擇
  useEffect(() => {
    if (selectedModel) {
      localStorage.setItem('selectedVideoModel', selectedModel);
    }
  }, [selectedModel]);

  useEffect(() => {
    if (selectedTTSProvider) {
      localStorage.setItem('selectedVideoProvider', selectedTTSProvider);
    }
  }, [selectedTTSProvider]);

  useEffect(() => {
    if (selectedTTSModel) {
      localStorage.setItem('selectedVideoVoice', selectedTTSModel);
    }
  }, [selectedTTSModel]);


  // 本地影片生成
  const generateVideoMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/generate/video", {
        inputText: data.text,
        modelId: data.modelId,
        provider: data.provider,
        ttsModel: data.ttsModel,
        voiceType: data.voiceType,
        // 添加 TTS 高級設定
        voiceGenerationType: data.voiceGenerationType,
        // VoAI 設定
        voaiModel: data.voaiModel,
        voaiStyle: data.voaiStyle,
        voaiSpeed: data.voaiSpeed,
        voaiPitch: data.voaiPitch,
        // MiniMax 設定
        minimaxEmotion: data.minimaxEmotion,
        minimaxVolume: data.minimaxVolume,
        minimaxSpeed: data.minimaxSpeed,
        minimaxPitch: data.minimaxPitch,
        // ATEN 設定
        atenPitch: data.atenPitch,
        atenRate: data.atenRate,
        atenVolume: data.atenVolume,
        atenSilenceScale: data.atenSilenceScale,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setIsGenerating(true);
      setGenerationProgress(0);
      setTaskCode(data.data.taskCode);
      
      // 開始輪詢進度
      const pollProgress = () => {
        const interval = setInterval(async () => {
          try {
            const response = await apiRequest("GET", `/api/video/query?code=${data.data.taskCode}`);
            const result = await response.json();
            
            if (result.code === 10000) {
              // 生成完成
              clearInterval(interval);
              setIsGenerating(false);
              setGenerationProgress(100);
              
              // 確保影片 URL 是完整的
              let videoUrl = result.data.video_url;
              if (videoUrl && !videoUrl.startsWith('http')) {
                // 如果是相對路徑，轉換為完整 URL
                const baseUrl = window.location.origin;
                videoUrl = `${baseUrl}${videoUrl.startsWith('/') ? '' : '/'}${videoUrl}`;
              }
              
              setGeneratedVideoUrl(videoUrl);
              toast({
                title: "影片生成完成",
                description: "您的 AI 影片已準備好",
              });
              if (onVideoGenerated) {
                onVideoGenerated(videoUrl);
              }
            } else if (result.code === 10001) {
              // 還在處理中
              setGenerationProgress(prev => Math.min(prev + 5, 90));
            } else if (result.code === 10004) {
              // 任務不存在，可能是服務忙碌導致任務未創建
              clearInterval(interval);
              setIsGenerating(false);
              toast({
                title: "影片生成失敗",
                description: "Face2Face 服務忙碌中，請稍後重試",
                variant: "destructive",
              });
            } else {
              // 其他錯誤
              clearInterval(interval);
              setIsGenerating(false);
              toast({
                title: "影片生成失敗",
                description: result.msg || "生成過程中發生錯誤",
                variant: "destructive",
              });
            }
          } catch (error) {
            console.error('輪詢進度失敗:', error);
          }
        }, 3000); // 每3秒查詢一次
      };
      
      pollProgress();
    },
    onError: (error: any) => {
      setIsGenerating(false);
      toast({
        title: "影片生成失敗",
        description: error.message || "請檢查網路連接和服務狀態",
        variant: "destructive",
      });
    },
  });

  const handleGenerateVideo = () => {
    if (!textInput.trim()) {
      toast({
        title: "請輸入文字內容",
        description: "需要文字內容來生成影片",
        variant: "destructive",
      });
      return;
    }

    if (!selectedModel) {
      toast({
        title: "請選擇人物模型",
        description: "需要選擇一個人物模型來生成影片",
        variant: "destructive",
      });
      return;
    }

    generateVideoMutation.mutate({
      text: textInput,
      modelId: selectedModel,
      provider: selectedTTSProvider,
      ttsModel: selectedTTSModel,
      voiceType: voiceGenerationType,
      // 傳遞語音生成類型
      voiceGenerationType: voiceGenerationType,
      // VoAI 設定
      voaiModel: voaiModel,
      voaiStyle: voaiStyle,
      voaiSpeed: voaiSpeed,
      voaiPitch: voaiPitch,
      // MiniMax 設定
      minimaxEmotion: minimaxEmotion,
      minimaxVolume: minimaxVolume,
      minimaxSpeed: minimaxSpeed,
      minimaxPitch: minimaxPitch,
      // ATEN 設定
      atenPitch: atenPitch,
      atenRate: atenRate,
      atenVolume: atenVolume,
      atenSilenceScale: atenSilenceScale,
    });
  };

  const selectedModelData = modelsData?.find((m: any) => m.id.toString() === selectedModel);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-blue-600" />
            本地 AI 影片生成
          </CardTitle>
          <p className="text-sm text-gray-600">
            使用本地 Face2Face 技術生成專業的數位人影片
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 人物模型選擇 */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              選擇人物模型
            </Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger>
                <SelectValue placeholder="選擇模型" />
              </SelectTrigger>
              <SelectContent>
                {modelsData?.map((model: any) => (
                  <SelectItem key={model.id} value={model.id.toString()}>
                    <div className="flex items-center gap-3 w-full py-1">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex flex-col items-start flex-1 min-w-0">
                        <div className="font-medium text-left truncate w-full">{model.name}</div>
                        <div className="text-sm text-gray-500 text-left truncate w-full">{model.description || '人物形象'}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedModelData && (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                {selectedModelData.name}
              </div>
            )}
          </div>

          {/* 語音合成面板 */}
          <div className="border-t pt-6">
            <VoiceSynthesisPanel
              voiceGenerationType={voiceGenerationType}
              setVoiceGenerationType={setVoiceGenerationType}
              inputText={textInput}
              setInputText={setTextInput}
              selectedTTSProvider={selectedTTSProvider}
              setSelectedTTSProvider={setSelectedTTSProvider}
              selectedTTSModel={selectedTTSModel}
              setSelectedTTSModel={setSelectedTTSModel}
              referenceAudio={referenceAudio}
              setReferenceAudio={setReferenceAudio}
              ttsProviders={ttsProvidersData || []}
              ttsVoices={ttsVoicesData || {}}
              minimaxEmotions={minimaxEmotionsData || []}
              voiceModels={voiceModelsData || []}
              showMinimaxAdvanced={showMinimaxAdvanced}
              setShowMinimaxAdvanced={setShowMinimaxAdvanced}
              minimaxEmotion={minimaxEmotion}
              setMinimaxEmotion={setMinimaxEmotion}
              minimaxVolume={minimaxVolume}
              setMinimaxVolume={setMinimaxVolume}
              minimaxSpeed={minimaxSpeed}
              setMinimaxSpeed={setMinimaxSpeed}
              minimaxPitch={minimaxPitch}
              setMinimaxPitch={setMinimaxPitch}
              showATENAdvanced={showATENAdvanced}
              setShowATENAdvanced={setShowATENAdvanced}
              atenPitch={atenPitch}
              setAtenPitch={setAtenPitch}
              atenRate={atenRate}
              setAtenRate={setAtenRate}
              atenVolume={atenVolume}
              setAtenVolume={setAtenVolume}
              atenSilenceScale={atenSilenceScale}
              setAtenSilenceScale={setAtenSilenceScale}
              showVoAIAdvanced={showVoAIAdvanced}
              setShowVoAIAdvanced={setShowVoAIAdvanced}
              voaiModel={voaiModel}
              setVoaiModel={setVoaiModel}
              voaiStyle={voaiStyle}
              setVoaiStyle={setVoaiStyle}
              voaiSpeed={voaiSpeed}
              setVoaiSpeed={setVoaiSpeed}
              voaiPitch={voaiPitch}
              setVoaiPitch={setVoaiPitch}
              showVoiceTypeSelector={false}
              showTextInput={true}
              compact={true}
            />
          </div>

          {/* 生成按鈕 */}
          <div className="flex justify-center">
            <Button
              onClick={handleGenerateVideo}
              disabled={isGenerating || generateVideoMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 px-8"
              size="lg"
            >
              {isGenerating || generateVideoMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Video className="mr-2 h-5 w-5" />
                  生成 AI 影片
                </>
              )}
            </Button>
          </div>

          {/* 生成進度 */}
          {isGenerating && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-blue-700 font-medium">正在生成您的 AI 影片...</span>
                <span className="text-blue-600">{generationProgress}%</span>
              </div>
              <Progress value={generationProgress} className="h-2" />
              <div className="text-xs text-gray-500 text-center">
                預計需要 2-5 分鐘，請耐心等待
                {taskCode && (
                  <span className="block mt-1">任務代碼：{taskCode}</span>
                )}
              </div>
            </div>
          )}

          {/* 生成結果 */}
          {generatedVideoUrl && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                <Video className="h-4 w-4" />
                AI 影片生成完成
              </h4>
              <div className="space-y-4">
                <video
                  src={generatedVideoUrl}
                  controls
                  className="w-full max-w-lg mx-auto rounded-lg shadow-md"
                  poster="/video-placeholder.jpg"
                >
                  您的瀏覽器不支援影片播放
                </video>
                <div className="flex gap-2 justify-center">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const video = document.querySelector('video');
                      if (video) {
                        if (video.paused) {
                          video.play();
                        } else {
                          video.pause();
                        }
                      }
                    }}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    播放/暫停
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      if (generatedVideoUrl) {
                        const link = document.createElement('a');
                        link.href = generatedVideoUrl;
                        link.download = `ai-video-${Date.now()}.mp4`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    下載影片
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      if (navigator.share && generatedVideoUrl) {
                        navigator.share({
                          title: 'AI 生成影片',
                          url: generatedVideoUrl
                        });
                      } else if (generatedVideoUrl) {
                        navigator.clipboard.writeText(generatedVideoUrl);
                        toast({
                          title: "連結已複製",
                          description: "影片連結已複製到剪貼簿",
                        });
                      }
                    }}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    分享
                  </Button>
                </div>
                <div className="text-xs text-gray-500 text-center">
                  影片由本地 Face2Face 技術生成 • 解析度：1080p • 格式：MP4
                </div>
              </div>
            </div>
          )}

          {/* 功能說明 */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h5 className="font-medium text-gray-900 mb-2">本地 AI 影片特色</h5>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 本地運行，無需 API 金鑰，保護隱私</li>
              <li>• 支援自定義人物模型</li>
              <li>• 多種語音合成選項</li>
              <li>• 高品質影片輸出</li>
              <li>• 快速生成，通常 2-5 分鐘完成</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
