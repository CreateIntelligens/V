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
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedProvider, setSelectedProvider] = useState<string>("edgetts");
  const [selectedVoice, setSelectedVoice] = useState<string>("zh-CN-XiaoxiaoNeural");
  const [textInput, setTextInput] = useState("");
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [taskCode, setTaskCode] = useState<string>("");

  // 獲取可用的人物模型
  const { data: modelsData } = useQuery({
    queryKey: ["/api/models"],
    select: (data: any) => data?.data?.list || [],
  });

  // 本地影片生成
  const generateVideoMutation = useMutation({
    mutationFn: async (data: { text: string; modelId: string; provider: string; ttsModel: string }) => {
      const response = await apiRequest("POST", "/api/generate/video", {
        inputText: data.text,
        modelId: data.modelId,
        provider: data.provider,
        ttsModel: data.ttsModel,
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
              setGeneratedVideoUrl(result.data.video_url);
              toast({
                title: "影片生成完成",
                description: "您的 AI 影片已準備好",
              });
              if (onVideoGenerated) {
                onVideoGenerated(result.data.video_url);
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
      provider: selectedProvider,
      ttsModel: selectedVoice,
    });
  };

  const selectedModelData = modelsData?.find((m: any) => m.id.toString() === selectedModel);
  const selectedProviderData = TTS_PROVIDERS.find(p => p.id === selectedProvider);
  const selectedVoiceData = EDGETTS_VOICES.find(v => v.id === selectedVoice);

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
            <Label className="text-base font-semibold">選擇人物模型</Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger>
                <SelectValue placeholder="選擇一個人物模型" />
              </SelectTrigger>
              <SelectContent>
                {modelsData?.map((model: any) => (
                  <SelectItem key={model.id} value={model.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <span>{model.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedModelData && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  已選擇：{selectedModelData.name}
                </p>
              </div>
            )}
          </div>

          {/* TTS 提供商選擇 */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">語音合成提供商</Label>
            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger>
                <SelectValue placeholder="選擇語音合成服務" />
              </SelectTrigger>
              <SelectContent>
                {TTS_PROVIDERS.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Mic className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm">{provider.name}</span>
                        <span className="text-xs text-gray-500">{provider.description}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProviderData && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  已選擇：{selectedProviderData.name}
                </p>
                <p className="text-xs text-green-600">
                  {selectedProviderData.description}
                </p>
              </div>
            )}
          </div>

          {/* 聲音選擇 */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">選擇聲音</Label>
            <Select value={selectedVoice} onValueChange={setSelectedVoice}>
              <SelectTrigger>
                <SelectValue placeholder="選擇一個聲音" />
              </SelectTrigger>
              <SelectContent>
                {EDGETTS_VOICES.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Play className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm">{voice.name}</span>
                        <span className="text-xs text-gray-500">{voice.language}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedVoiceData && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-700">
                  已選擇：{selectedVoiceData.name} ({selectedVoiceData.language})
                </p>
              </div>
            )}
          </div>

          {/* 文字內容 */}
          <div className="space-y-3">
            <Label htmlFor="textContent" className="text-base font-semibold">
              影片文字內容
            </Label>
            <Textarea
              id="textContent"
              placeholder="輸入您希望 AI 頭像說的內容...&#10;&#10;範例：&#10;大家好，我是您的 AI 助手。今天我要為您介紹我們最新的產品功能。這個功能可以幫助您提高工作效率，節省寶貴的時間。"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>建議長度：50-500 字</span>
              <span>{textInput.length} 字</span>
            </div>
          </div>

          {/* 生成按鈕 */}
          <Button
            onClick={handleGenerateVideo}
            disabled={isGenerating || generateVideoMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700"
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
                  <Button variant="outline" size="sm">
                    <Play className="mr-2 h-4 w-4" />
                    播放
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    下載影片
                  </Button>
                  <Button variant="outline" size="sm">
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
