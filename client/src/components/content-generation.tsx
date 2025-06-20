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
  const [voiceSource, setVoiceSource] = useState<"model" | "reference" | "default">("default");
  const [referenceAudio, setReferenceAudio] = useState<File | null>(null);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const voiceModels = models.filter(m => m.type === "voice" && m.status === "ready");
  const characterModels = models.filter(m => m.type === "character" && m.status === "ready");
  
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
    if (!inputText) {
      toast({
        title: "請填寫完整信息",
        description: "請輸入要生成的文本內容",
        variant: "destructive",
      });
      return;
    }

    // 音頻生成的聲音來源驗證
    if (voiceSource === "model" && !selectedVoiceModelId) {
      toast({
        title: "請選擇聲音模特",
        description: "已選擇使用聲音模特，請選擇一個模特",
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

    generateAudioMutation.mutate({
      modelId: voiceSource === "model" ? parseInt(selectedVoiceModelId) : undefined,
      inputText,
      emotion,
      type: "audio",
      voiceSource,
      voiceModelId: voiceSource === "model" ? parseInt(selectedVoiceModelId) : undefined,
      referenceAudio: voiceSource === "reference" ? referenceAudio : undefined,
    });
  };

  const handleGenerateVideo = () => {
    if (!inputText || !selectedCharacterModelId) {
      toast({
        title: "請填寫完整信息",
        description: "請輸入文本並選擇人物模特",
        variant: "destructive",
      });
      return;
    }

    // 視頻生成的聲音來源驗證
    if (voiceSource === "model" && !selectedVoiceModelId) {
      toast({
        title: "請選擇聲音模特",
        description: "已選擇使用聲音模特，請選擇一個模特",
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
      modelId: parseInt(selectedCharacterModelId), // 使用人物模特ID
      inputText,
      emotion,
      type: "video",
      voiceSource,
      voiceModelId: voiceSource === "model" ? parseInt(selectedVoiceModelId) : undefined,
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
              
              {/* 聲音來源選擇 */}
              <div>
                <Label className="text-base font-semibold">聲音來源</Label>
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Card
                      className={`cursor-pointer transition-all ${
                        voiceSource === "default" 
                          ? 'ring-2 ring-primary border-primary' 
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setVoiceSource("default")}
                    >
                      <CardContent className="p-4 text-center">
                        <h4 className="font-medium text-gray-900 mb-1">快速生成</h4>
                        <p className="text-xs text-gray-600">EdgeTTS 曉曉女聲</p>
                      </CardContent>
                    </Card>
                    
                    <Card
                      className={`cursor-pointer transition-all ${
                        voiceSource === "model" 
                          ? 'ring-2 ring-primary border-primary' 
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setVoiceSource("model")}
                    >
                      <CardContent className="p-4 text-center">
                        <h4 className="font-medium text-gray-900 mb-1">選擇聲音</h4>
                        <p className="text-xs text-gray-600">多種聲音和模特</p>
                      </CardContent>
                    </Card>
                    
                    <Card
                      className={`cursor-pointer transition-all ${
                        voiceSource === "reference" 
                          ? 'ring-2 ring-primary border-primary' 
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setVoiceSource("reference")}
                    >
                      <CardContent className="p-4 text-center">
                        <h4 className="font-medium text-gray-900 mb-1">聲音克隆</h4>
                        <p className="text-xs text-gray-600">上傳參考音頻</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>

              {/* 聲音模特選擇（當選擇聲音模特時顯示） */}
              {voiceSource === "model" && (
                <div>
                  <Label className="text-base font-semibold">選擇聲音模特</Label>
                  <Tabs defaultValue="edgetts" className="mt-3">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="edgetts">EdgeTTS</TabsTrigger>
                      <TabsTrigger value="custom">自訓練</TabsTrigger>
                      <TabsTrigger value="minimax">MiniMax</TabsTrigger>
                      <TabsTrigger value="openai">OpenAI</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="edgetts" className="mt-3">
                      <div className="space-y-3">
                        <Select value={selectedVoiceModelId} onValueChange={setSelectedVoiceModelId}>
                          <SelectTrigger>
                            <SelectValue placeholder="選擇EdgeTTS聲音" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            <div className="px-2 py-1 text-xs font-medium text-gray-500 border-b">中文聲音</div>
                            {defaultEdgeTTSOptions.filter(option => option.language.startsWith("zh")).map((option) => (
                              <SelectItem key={option.id} value={option.id}>
                                <div className="flex items-center space-x-2">
                                  <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700">
                                    {option.gender === "female" ? "女聲" : "男聲"}
                                  </span>
                                  <span>{option.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                            <div className="px-2 py-1 text-xs font-medium text-gray-500 border-b border-t">英文聲音</div>
                            {defaultEdgeTTSOptions.filter(option => option.language.startsWith("en")).map((option) => (
                              <SelectItem key={option.id} value={option.id}>
                                <div className="flex items-center space-x-2">
                                  <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700">
                                    {option.gender === "female" ? "女聲" : "男聲"}
                                  </span>
                                  <span>{option.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                            <div className="px-2 py-1 text-xs font-medium text-gray-500 border-b border-t">日文聲音</div>
                            {defaultEdgeTTSOptions.filter(option => option.language.startsWith("ja")).map((option) => (
                              <SelectItem key={option.id} value={option.id}>
                                <div className="flex items-center space-x-2">
                                  <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700">
                                    {option.gender === "female" ? "女聲" : "男聲"}
                                  </span>
                                  <span>{option.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                            {presetVoiceModels.filter(m => m.provider === "edgetts").length > 0 && (
                              <div className="px-2 py-1 text-xs font-medium text-gray-500 border-b border-t">自定義 EdgeTTS</div>
                            )}
                            {presetVoiceModels.filter(m => m.provider === "edgetts").map((model) => (
                              <SelectItem key={model.id} value={model.id.toString()}>
                                <div className="flex items-center space-x-2">
                                  <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700">
                                    自定義
                                  </span>
                                  <span>{model.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="custom" className="mt-3">
                      <Select value={selectedVoiceModelId} onValueChange={setSelectedVoiceModelId}>
                        <SelectTrigger>
                          <SelectValue placeholder="選擇自訓練模特" />
                        </SelectTrigger>
                        <SelectContent>
                          {customVoiceModels.map((model) => (
                            <SelectItem key={model.id} value={model.id.toString()}>
                              <div className="flex items-center space-x-2">
                                <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">
                                  HEYGEM
                                </span>
                                <span>{model.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                          {customVoiceModels.length === 0 && (
                            <div className="px-3 py-2 text-sm text-gray-500">
                              暫無自訓練模特，請先到模特管理頁面創建
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </TabsContent>
                    
                    <TabsContent value="minimax" className="mt-3">
                      <Select value={selectedVoiceModelId} onValueChange={setSelectedVoiceModelId}>
                        <SelectTrigger>
                          <SelectValue placeholder="選擇MiniMax聲音" />
                        </SelectTrigger>
                        <SelectContent>
                          <div className="px-2 py-1 text-xs font-medium text-gray-500 border-b">預設聲音</div>
                          {defaultMiniMaxOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              <div className="flex items-center space-x-2">
                                <span className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-700">
                                  預設
                                </span>
                                <span>{option.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                          {presetVoiceModels.filter(m => m.provider === "minimax").length > 0 && (
                            <div className="px-2 py-1 text-xs font-medium text-gray-500 border-b border-t">自訓練聲音</div>
                          )}
                          {presetVoiceModels.filter(m => m.provider === "minimax").map((model) => (
                            <SelectItem key={model.id} value={model.id.toString()}>
                              <div className="flex items-center space-x-2">
                                <span className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-700">
                                  自訓練
                                </span>
                                <span>{model.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TabsContent>
                    
                    <TabsContent value="openai" className="mt-3">
                      <Select value={selectedVoiceModelId} onValueChange={setSelectedVoiceModelId}>
                        <SelectTrigger>
                          <SelectValue placeholder="選擇OpenAI聲音" />
                        </SelectTrigger>
                        <SelectContent>
                          <div className="px-2 py-1 text-xs font-medium text-gray-500 border-b">OpenAI TTS 聲音</div>
                          {defaultOpenAIOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              <div className="flex items-center space-x-2">
                                <span className="px-2 py-1 rounded text-xs bg-teal-100 text-teal-700">
                                  OPENAI
                                </span>
                                <span>{option.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                          <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50">
                            需要配置 OpenAI API Key
                          </div>
                        </SelectContent>
                      </Select>
                    </TabsContent>
                  </Tabs>
                </div>
              )}

              {/* 參考音頻上傳（當選擇參考音頻時顯示） */}
              {voiceSource === "reference" && (
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

              {/* 人物模特選擇 */}
              <div>
                <Label className="text-base font-semibold">人物模特 (視頻生成必須)</Label>
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
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>• <strong>音頻生成</strong>：</p>
                    <p className="ml-4">- 快速生成：使用預設聲音</p>
                    <p className="ml-4">- 選擇聲音：多種平台和聲音選擇</p>
                    <p className="ml-4">- 聲音克隆：上傳參考音頻</p>
                    <p>• <strong>視頻生成</strong>：必須選擇人物模特 + 聲音來源</p>
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
