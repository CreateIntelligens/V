import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MicOff, Video, Download, Share, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { AudioPlayer } from "@/components/audio-player";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Model, InsertGeneratedContent } from "@shared/schema";

interface ContentGenerationProps {
  models: Model[];
}

export function ContentGeneration({ models }: ContentGenerationProps) {
  const [inputText, setInputText] = useState("");
  const [selectedVoiceModelId, setSelectedVoiceModelId] = useState<string>("");
  const [selectedCharacterModelId, setSelectedCharacterModelId] = useState<string>("");
  const [emotion, setEmotion] = useState("neutral");
  const [contentType, setContentType] = useState<"audio" | "video">("audio");
  const [voiceSource, setVoiceSource] = useState<"model" | "reference" | "default">("default");
  const [selectedProvider, setSelectedProvider] = useState<string>("edgetts");
  const [selectedTTSModel, setSelectedTTSModel] = useState<string>("");
  const [referenceAudio, setReferenceAudio] = useState<File | null>(null);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 確保 models 是陣列
  const safeModels = Array.isArray(models) ? models : [];
  const voiceModels = safeModels.filter(m => m.type === "voice" && m.status === "ready");
  const characterModels = safeModels.filter(m => m.type === "character" && m.status === "ready");

  // 分類聲音模特
  const customVoiceModels = voiceModels.filter(m => m.provider === "heygem");
  const presetVoiceModels = voiceModels.filter(m => m.provider === "edgetts" || m.provider === "minimax");

  // 預設EdgeTTS選項 - 更完整的聲音列表
  const defaultEdgeTTSOptions = [
    // 中文聲音
    { id: "edgetts-xiaoxiao", name: "曉曉 (溫柔女聲)", voice: "zh-CN-XiaoxiaoNeural", language: "zh-CN", gender: "female" },
    { id: "edgetts-yunxi", name: "雲希 (活潑男聲)", voice: "zh-CN-YunxiNeural", language: "zh-CN", gender: "male" },
    { id: "edgetts-xiaoyi", name: "曉伊 (甜美女聲)", voice: "zh-CN-XiaoyiNeural", language: "zh-CN", gender: "female" },
    { id: "edgetts-yunjian", name: "雲健 (沉穩男聲)", voice: "zh-CN-YunjianNeural", language: "zh-CN", gender: "male" },
    { id: "edgetts-xiaochen", name: "曉辰 (知性女聲)", voice: "zh-CN-XiaochenNeural", language: "zh-CN", gender: "female" },
    { id: "edgetts-yunyang", name: "雲揚 (陽光男聲)", voice: "zh-CN-YunyangNeural", language: "zh-CN", gender: "male" },

    // 英文聲音
    { id: "edgetts-jenny", name: "Jenny (美式女聲)", voice: "en-US-JennyNeural", language: "en-US", gender: "female" },
    { id: "edgetts-guy", name: "Guy (美式男聲)", voice: "en-US-GuyNeural", language: "en-US", gender: "male" },
    { id: "edgetts-aria", name: "Aria (清新女聲)", voice: "en-US-AriaNeural", language: "en-US", gender: "female" },
    { id: "edgetts-davis", name: "Davis (磁性男聲)", voice: "en-US-DavisNeural", language: "en-US", gender: "male" },

    // 日文聲音
    { id: "edgetts-nanami", name: "Nanami (日式女聲)", voice: "ja-JP-NanamiNeural", language: "ja-JP", gender: "female" },
    { id: "edgetts-keita", name: "Keita (日式男聲)", voice: "ja-JP-KeitaNeural", language: "ja-JP", gender: "male" },
  ];

  // 預設MiniMax選項
  const defaultMiniMaxOptions = [
    { id: "minimax-speech01", name: "標準語音", model: "speech-01", language: "zh-CN" },
    { id: "minimax-speech02", name: "情感語音", model: "speech-02", language: "zh-CN" },
    { id: "minimax-broadcast", name: "播音腔調", model: "broadcast-01", language: "zh-CN" },
    { id: "minimax-storytelling", name: "故事講述", model: "storytelling-01", language: "zh-CN" },
  ];

  // 預設OpenAI選項 (為未來準備)
  const defaultOpenAIOptions = [
    { id: "openai-alloy", name: "Alloy (中性聲音)", voice: "alloy", language: "en-US" },
    { id: "openai-echo", name: "Echo (男性聲音)", voice: "echo", language: "en-US" },
    { id: "openai-fable", name: "Fable (英式男聲)", voice: "fable", language: "en-US" },
    { id: "openai-onyx", name: "Onyx (深沉男聲)", voice: "onyx", language: "en-US" },
    { id: "openai-nova", name: "Nova (女性聲音)", voice: "nova", language: "en-US" },
    { id: "openai-shimmer", name: "Shimmer (溫柔女聲)", voice: "shimmer", language: "en-US" },
  ];

  // 預設模版選項
  const presetTemplates = [
    {
      id: "news",
      name: "新聞播報",
      text: "今天是{date}，歡迎收看新聞播報。以下是今天的重要新聞：",
      emotion: "professional",
      description: "適合新聞、播報類內容"
    },
    {
      id: "product",
      name: "產品介紹",
      text: "大家好！今天我要為大家介紹一款全新的產品，它具有以下特色：",
      emotion: "energetic",
      description: "適合產品展示、銷售推廣"
    },
    {
      id: "education",
      name: "教學課程",
      text: "歡迎來到今天的課程。在這堂課中，我們將學習到：",
      emotion: "gentle",
      description: "適合教學、培訓內容"
    },
    {
      id: "greeting",
      name: "歡迎致詞",
      text: "歡迎大家的到來！我是您的專屬AI助手，很高興為您服務。",
      emotion: "happy",
      description: "適合歡迎、問候場景"
    },
  ];

  const generateAudioMutation = useMutation({
    mutationFn: async (data: InsertGeneratedContent) => {
      const response = await apiRequest("POST", "/api/generate/audio", data);
      return response.json();
    },
    onSuccess: (data) => {
      console.log('音頻生成成功:', data);

      // 直接使用 API 返回的音頻 URL
      if (data.success && data.data?.audioUrl) {
        const audioUrl = data.data.audioUrl;
        console.log('設置音頻 URL:', audioUrl);
        setGeneratedAudio(audioUrl);
        setGeneratingAudio(false);
        toast({
          title: "語音生成完成",
          description: "您的語音內容已準備好",
        });
      } else {
        console.error('音頻生成失敗:', data);
        toast({
          title: "生成失敗",
          description: data.message || "未知錯誤",
          variant: "destructive",
        });
        setGeneratingAudio(false);
      }

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
    onSuccess: () => {
      setGeneratingVideo(true);
      setVideoProgress(0);

      // Simulate progress
      const interval = setInterval(() => {
        setVideoProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setGeneratingVideo(false);
            toast({
              title: "影片生成完成",
              description: "您的影片內容已準備好",
            });
            return 100;
          }
          return prev + 5;
        });
      }, 500);

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
    if (!inputText) {
      toast({
        title: "請填寫完整信息",
        description: "請輸入要生成的文本內容",
        variant: "destructive",
      });
      return;
    }

    // 音頻生成的聲音來源驗證
    if (voiceSource === "model" && !selectedTTSModel) {
      toast({
        title: "請選擇音頻來源",
        description: "已選擇使用用戶音頻，請選擇音頻檔案或上傳新檔案",
        variant: "destructive",
      });
      return;
    }

    if (voiceSource === "reference" && !referenceAudio) {
      toast({
        title: "請上傳參考音頻",
        description: "已選擇使用參考音頻，請上傳音頻文件",
        variant: "destructive",
      });
      return;
    }

    // 映射前端選擇的模型到實際的聲音 ID
    let actualTTSModel = "zh-CN-XiaoxiaoNeural"; // 默認聲音

    if (voiceSource === "model" && selectedTTSModel) {
      if (selectedProvider === "edgetts") {
        const selectedOption = defaultEdgeTTSOptions.find(opt => opt.id === selectedTTSModel);
        if (selectedOption) {
          actualTTSModel = selectedOption.voice;
        }
      } else {
        actualTTSModel = selectedTTSModel;
      }
    }

    console.log('生成音頻請求:', {
      provider: voiceSource === "model" ? selectedProvider : "edgetts",
      ttsModel: actualTTSModel,
      voiceSource,
      selectedTTSModel
    });

    // 設置生成狀態
    setGeneratingAudio(true);
    setGeneratedAudio(null);

    generateAudioMutation.mutate({
      modelId: voiceSource === "model" ? (selectedTTSModel.includes("-") ? undefined : parseInt(selectedTTSModel)) : undefined,
      inputText,
      emotion,
      type: "audio",
      voiceSource,
      provider: voiceSource === "model" ? selectedProvider : "edgetts",
      ttsModel: actualTTSModel,
      referenceAudio: voiceSource === "reference" ? referenceAudio : undefined,
    });
  };

  const handleGenerateVideo = () => {
    if (!inputText || !selectedCharacterModelId) {
      toast({
        title: "請填寫完整信息",
        description: "請輸入文本並選擇人物形象",
        variant: "destructive",
      });
      return;
    }

    // 影片生成的聲音來源驗證
    if (voiceSource === "model" && !selectedTTSModel) {
      toast({
        title: "請選擇音頻來源",
        description: "已選擇使用用戶音頻，請選擇音頻檔案或上傳新檔案",
        variant: "destructive",
      });
      return;
    }

    if (voiceSource === "reference" && !referenceAudio) {
      toast({
        title: "請上傳參考音頻",
        description: "已選擇使用參考音頻，請上傳音頻文件",
        variant: "destructive",
      });
      return;
    }

    generateVideoMutation.mutate({
      modelId: parseInt(selectedCharacterModelId), // 使用人物形象ID
      inputText,
      emotion,
      type: "video",
      voiceSource,
      provider: voiceSource === "model" ? selectedProvider : "edgetts",
      ttsModel: voiceSource === "model" ? selectedTTSModel : "edgetts-xiaoxiao",
      referenceAudio: voiceSource === "reference" ? referenceAudio : undefined,
    });
  };

  const handlePresetSelect = (preset: typeof presetTemplates[0]) => {
    setInputText(preset.text.replace("{date}", new Date().toLocaleDateString()));
    setEmotion(preset.emotion);
  };

  return (
    <section className="mb-8">
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">內容生成</h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              {/* 文本輸入 */}
              <div>
                <Label htmlFor="inputText">輸入文本</Label>
                <Textarea
                  id="inputText"
                  placeholder="輸入要轉換的文本內容..."
                  rows={6}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="resize-none mt-2"
                />
              </div>

              {/* 聲音模型選擇 - 照著 TTS 頁面的模板 */}
              <div>
                <Label className="text-base font-semibold">選擇聲音資源</Label>
                <Select value={selectedTTSModel} onValueChange={(value) => {
                  setSelectedTTSModel(value);
                  // 自動設定聲音來源
                  if (customVoiceModels.some(m => m.id.toString() === value)) {
                    setVoiceSource("model");
                    setSelectedProvider("uploaded");
                  } else {
                    setVoiceSource("default");
                    setSelectedProvider("edgetts");
                  }
                }}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="選擇已訓練的聲音資源" />
                  </SelectTrigger>
                  <SelectContent>
                    {customVoiceModels.map((model) => (
                      <SelectItem key={model.id} value={model.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <div>
                            <div className="font-medium">{model.name}</div>
                            <div className="text-sm text-gray-500">{model.description || '聲音資源'}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                    {customVoiceModels.length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        尚無可用的聲音資源，請先到聲音管理頁面上傳
                      </div>
                    )}
                  </SelectContent>
                </Select>
                
                {customVoiceModels.length === 0 && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-700">
                      <MicOff className="h-4 w-4" />
                      <span className="text-sm font-medium">尚無可用的聲音資源</span>
                    </div>
                    <div className="text-xs text-yellow-600 mt-1">
                      您需要先創建並訓練聲音資源才能使用此功能
                    </div>
                  </div>
                )}
              </div>



              {/* 人物形象選擇 */}
              <div>
                <Label className="text-base font-semibold">人物形象 (影片生成必須)</Label>
                <Select value={selectedCharacterModelId} onValueChange={setSelectedCharacterModelId}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="選擇人物形象" />
                  </SelectTrigger>
                  <SelectContent>
                    {characterModels.map((model) => (
                      <SelectItem key={model.id} value={model.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 rounded text-xs bg-orange-100 text-orange-700">
                            HEYGEM
                          </span>
                          <span>{model.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>• <strong>音頻生成</strong>：</p>
                    <p className="ml-4">- 快速生成：使用預設聲音</p>
                    <p className="ml-4">- 選擇聲音：多種平台和聲音選擇</p>
                    <p className="ml-4">- 聲音克隆：上傳參考音頻</p>
                    <p>• <strong>影片生成</strong>：必須選擇人物形象 + 聲音來源</p>
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      className="flex-1"
                      onClick={handleGenerateAudio}
                      disabled={generatingAudio || generateAudioMutation.isPending}
                    >
                      <MicOff className="mr-2 h-4 w-4" />
                      {generatingAudio ? "生成中..." : "生成音頻"}
                    </Button>
                    <Button
                      className="flex-1 bg-purple-500 hover:bg-purple-600"
                      onClick={handleGenerateVideo}
                      disabled={generatingVideo || generateVideoMutation.isPending || !selectedCharacterModelId}
                    >
                      <Video className="mr-2 h-4 w-4" />
                      {generatingVideo ? "生成中..." : "生成影片"}
                    </Button>
                  </div>
                </div>

                {generatingAudio && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      <span className="text-blue-700 text-sm font-medium">正在生成語音...</span>
                    </div>
                    <Progress value={audioProgress} className="h-2" />
                  </div>
                )}

                {generatingVideo && (
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                      <span className="text-purple-700 text-sm font-medium">正在生成影片...</span>
                    </div>
                    <Progress value={videoProgress} className="h-2" />
                  </div>
                )}

                {generatedAudio && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">語音預覽</span>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Share className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      調試信息: generatedAudio = {generatedAudio}
                    </div>
                    <AudioPlayer src={generatedAudio} />
                  </div>
                )}

                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <Video className="text-gray-400 h-8 w-8 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">影片將在此顯示</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
