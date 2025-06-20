import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MicOff, Video, Download, Share, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const voiceModels = models.filter(m => m.type === "voice" && m.status === "ready");
  const characterModels = models.filter(m => m.type === "character" && m.status === "ready");
  
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
      setGeneratingAudio(true);
      setAudioProgress(0);
      
      // Simulate progress
      const interval = setInterval(() => {
        setAudioProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setGeneratingAudio(false);
            setGeneratedAudio(`audio_${data.id}.mp3`);
            toast({
              title: "語音生成完成",
              description: "您的語音內容已準備好",
            });
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
    if (!inputText || !selectedVoiceModelId) {
      toast({
        title: "請填寫完整信息",
        description: "請輸入文本並選擇聲音模特",
        variant: "destructive",
      });
      return;
    }

    generateAudioMutation.mutate({
      modelId: parseInt(selectedVoiceModelId),
      inputText,
      emotion,
      type: "audio",
    });
  };

  const handleGenerateVideo = () => {
    if (!inputText || !selectedVoiceModelId || !selectedCharacterModelId) {
      toast({
        title: "請填寫完整信息",
        description: "請輸入文本並選擇聲音模特和人物模特",
        variant: "destructive",
      });
      return;
    }

    generateVideoMutation.mutate({
      modelId: parseInt(selectedCharacterModelId), // 使用人物模特ID
      inputText,
      emotion,
      type: "video",
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
              {/* 預設模版 */}
              <div>
                <Label className="text-base font-semibold">快速模版</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  {presetTemplates.map((preset) => (
                    <Card
                      key={preset.id}
                      className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/50"
                      onClick={() => handlePresetSelect(preset)}
                    >
                      <CardContent className="p-4">
                        <h4 className="font-medium text-gray-900 mb-1">{preset.name}</h4>
                        <p className="text-xs text-gray-600">{preset.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* 文本輸入 */}
              <div>
                <Label htmlFor="inputText">輸入文本</Label>
                <Textarea
                  id="inputText"
                  placeholder="輸入要轉換的文本內容，或點擊上方模版快速填入..."
                  rows={6}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="resize-none mt-2"
                />
              </div>
              
              {/* 聲音模特選擇 */}
              <div>
                <Label className="text-base font-semibold">聲音模特</Label>
                <Select value={selectedVoiceModelId} onValueChange={setSelectedVoiceModelId}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="選擇聲音模特" />
                  </SelectTrigger>
                  <SelectContent>
                    {voiceModels.map((model) => (
                      <SelectItem key={model.id} value={model.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            model.provider === "heygem" 
                              ? "bg-blue-100 text-blue-700"
                              : model.provider === "edgetts"
                              ? "bg-green-100 text-green-700"
                              : "bg-purple-100 text-purple-700"
                          }`}>
                            {(model.provider || "heygem").toUpperCase()}
                          </span>
                          <span>{model.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 人物模特選擇（僅視頻需要） */}
              <div>
                <Label className="text-base font-semibold">人物模特 (視頻生成用)</Label>
                <Select value={selectedCharacterModelId} onValueChange={setSelectedCharacterModelId}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="選擇人物模特" />
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

              {/* 情感設置 */}
              <div>
                <Label className="text-base font-semibold">情感表達</Label>
                <Select value={emotion} onValueChange={setEmotion}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="neutral">中性</SelectItem>
                    <SelectItem value="happy">開心</SelectItem>
                    <SelectItem value="professional">專業</SelectItem>
                    <SelectItem value="gentle">溫和</SelectItem>
                    <SelectItem value="energetic">活力</SelectItem>
                    <SelectItem value="excited">興奮</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <p>• 音頻生成：僅需選擇聲音模特</p>
                    <p>• 視頻生成：需要選擇聲音模特和人物模特</p>
                  </div>
                  <div className="flex space-x-3">
                    <Button 
                      className="flex-1" 
                      onClick={handleGenerateAudio}
                      disabled={generatingAudio || generateAudioMutation.isPending || !selectedVoiceModelId}
                    >
                      <MicOff className="mr-2 h-4 w-4" />
                      {generatingAudio ? "生成中..." : "生成音頻"}
                    </Button>
                    <Button 
                      className="flex-1 bg-purple-500 hover:bg-purple-600" 
                      onClick={handleGenerateVideo}
                      disabled={generatingVideo || generateVideoMutation.isPending || !selectedVoiceModelId || !selectedCharacterModelId}
                    >
                      <Video className="mr-2 h-4 w-4" />
                      {generatingVideo ? "生成中..." : "生成視頻"}
                    </Button>
                  </div>
                </div>

                {generatingAudio && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      <span className="text-blue-700 text-sm font-medium">正在生成語音... (預計30秒)</span>
                    </div>
                    <Progress value={audioProgress} className="h-2" />
                  </div>
                )}

                {generatingVideo && (
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                      <span className="text-purple-700 text-sm font-medium">正在生成影片... (預計2分鐘)</span>
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
