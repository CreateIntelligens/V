import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, MicOff, UserCircle, Video, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { FileUpload } from "@/components/file-upload";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InsertModel } from "@shared/schema";

export function ModelCreation() {
  const [activeTab, setActiveTab] = useState("audio");
  const [audioModel, setAudioModel] = useState({
    name: "",
    provider: "heygem",
    language: "zh-TW",
    pitch: 50,
    speed: 60,
  });
  const [characterModel, setCharacterModel] = useState({
    name: "",
    provider: "heygem", // 人物模特目前只支持 heygem
    language: "zh-TW",
    age: "young",
    gender: "female",
    style: "energetic",
  });
  const [trainingFiles, setTrainingFiles] = useState<string[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createModelMutation = useMutation({
    mutationFn: async (modelData: InsertModel) => {
      const response = await apiRequest("POST", "/api/models", modelData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "模特創建成功",
        description: "您的AI模特已開始訓練",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/models"] });
      // Reset form
      setAudioModel({ name: "", provider: "heygem", language: "zh-TW", pitch: 50, speed: 60 });
      setCharacterModel({ name: "", provider: "heygem", language: "zh-TW", age: "young", gender: "female", style: "energetic" });
      setTrainingFiles([]);
    },
    onError: () => {
      toast({
        title: "創建失敗",
        description: "請檢查輸入信息後重試",
        variant: "destructive",
      });
    },
  });

  const handleCreateModel = () => {
    const isAudio = activeTab === "audio";
    const modelData: InsertModel = {
      name: isAudio ? audioModel.name : characterModel.name,
      type: isAudio ? "voice" : "character",
      provider: isAudio ? audioModel.provider : characterModel.provider,
      language: isAudio ? audioModel.language : characterModel.language,
      description: `${isAudio ? '聲音' : '人物'}模特`,
      status: "training",
      voiceSettings: isAudio ? JSON.stringify({
        pitch: audioModel.pitch,
        speed: audioModel.speed,
      }) : null,
      characterSettings: !isAudio ? JSON.stringify({
        age: characterModel.age,
        gender: characterModel.gender,
        style: characterModel.style,
      }) : null,
      trainingFiles,
    };

    createModelMutation.mutate(modelData);
  };

  return (
    <section className="mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">快速開始</h2>
          <p className="text-gray-600 mt-1">創建您的第一個AI模特或生成內容</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-material-lg transition-shadow cursor-pointer" onClick={() => setActiveTab("audio")}>
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <MicOff className="text-blue-600 h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">聲音模特</h3>
            <p className="text-gray-600 text-sm mb-4">創建具有獨特聲音特徵的AI語音模型，支持多種語言和情感表達</p>
            <div className="flex items-center text-primary text-sm font-medium">
              開始創建 <ArrowRight className="ml-2 h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-material-lg transition-shadow cursor-pointer" onClick={() => setActiveTab("character")}>
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <UserCircle className="text-green-600 h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">人物模特</h3>
            <p className="text-gray-600 text-sm mb-4">訓練個性化角色模型，包含外觀特徵和動作表情</p>
            <div className="flex items-center text-primary text-sm font-medium">
              開始創建 <ArrowRight className="ml-2 h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-material-lg transition-shadow cursor-pointer" onClick={() => setActiveTab("generation")}>
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Video className="text-purple-600 h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">影片生成</h3>
            <p className="text-gray-600 text-sm mb-4">結合聲音和人物模特，創造動態影片內容</p>
            <div className="flex items-center text-primary text-sm font-medium">
              開始生成 <ArrowRight className="ml-2 h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-gray-200">
              <TabsList className="flex space-x-8 px-6 bg-transparent">
                <TabsTrigger value="audio" className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary py-4 px-1 text-sm font-medium">
                  聲音模特
                </TabsTrigger>
                <TabsTrigger value="character" className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary py-4 px-1 text-sm font-medium">
                  人物模特
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="audio" className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">模特配置</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="audioName">模特名稱</Label>
                      <Input
                        id="audioName"
                        placeholder="輸入模特名稱"
                        value={audioModel.name}
                        onChange={(e) => setAudioModel(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>模型供應商</Label>
                      <Select value={audioModel.provider} onValueChange={(value) => setAudioModel(prev => ({ ...prev, provider: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="heygem">HeyGem (自訓練)</SelectItem>
                          <SelectItem value="edgetts">EdgeTTS (微軟)</SelectItem>
                          <SelectItem value="minimax">MiniMax</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>語言設定</Label>
                      <Select value={audioModel.language} onValueChange={(value) => setAudioModel(prev => ({ ...prev, language: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="zh-TW">繁體中文</SelectItem>
                          <SelectItem value="zh-CN">簡體中文</SelectItem>
                          <SelectItem value="en-US">English (US)</SelectItem>
                          <SelectItem value="ja-JP">日本語</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>聲音特性</Label>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                          <Label className="text-xs text-gray-600">音調</Label>
                          <Slider
                            value={[audioModel.pitch]}
                            onValueChange={(value) => setAudioModel(prev => ({ ...prev, pitch: value[0] }))}
                            max={100}
                            step={1}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">語速</Label>
                          <Slider
                            value={[audioModel.speed]}
                            onValueChange={(value) => setAudioModel(prev => ({ ...prev, speed: value[0] }))}
                            max={100}
                            step={1}
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">訓練素材</h3>
                  <FileUpload
                    accept=".mp3,.wav,.flac"
                    multiple
                    onFilesChange={setTrainingFiles}
                    description="支持 MP3, WAV, FLAC 格式，最大 100MB"
                  />
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">預計訓練時間: <span className="font-medium text-gray-900">15-20分鐘</span></span>
                  </div>
                  <div className="flex space-x-3">
                    <Button variant="outline">預覽測試</Button>
                    <Button 
                      onClick={handleCreateModel}
                      disabled={!audioModel.name || trainingFiles.length === 0 || createModelMutation.isPending}
                    >
                      {createModelMutation.isPending ? "創建中..." : "開始訓練"}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="character" className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">角色配置</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="characterName">模特名稱</Label>
                      <Input
                        id="characterName"
                        placeholder="輸入角色名稱"
                        value={characterModel.name}
                        onChange={(e) => setCharacterModel(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>模型供應商</Label>
                      <Select value={characterModel.provider} onValueChange={(value) => setCharacterModel(prev => ({ ...prev, provider: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="heygem">HeyGem (目前唯一支持)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>語言設定</Label>
                      <Select value={characterModel.language} onValueChange={(value) => setCharacterModel(prev => ({ ...prev, language: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="zh-TW">繁體中文</SelectItem>
                          <SelectItem value="zh-CN">簡體中文</SelectItem>
                          <SelectItem value="en-US">English (US)</SelectItem>
                          <SelectItem value="ja-JP">日本語</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>年齡</Label>
                        <Select value={characterModel.age} onValueChange={(value) => setCharacterModel(prev => ({ ...prev, age: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="young">年輕</SelectItem>
                            <SelectItem value="middle">中年</SelectItem>
                            <SelectItem value="senior">年長</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>性別</Label>
                        <Select value={characterModel.gender} onValueChange={(value) => setCharacterModel(prev => ({ ...prev, gender: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="female">女性</SelectItem>
                            <SelectItem value="male">男性</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>風格</Label>
                      <Select value={characterModel.style} onValueChange={(value) => setCharacterModel(prev => ({ ...prev, style: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="energetic">活潑</SelectItem>
                          <SelectItem value="gentle">溫和</SelectItem>
                          <SelectItem value="professional">專業</SelectItem>
                          <SelectItem value="casual">輕鬆</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">訓練素材</h3>
                  <FileUpload
                    accept=".zip,.png,.jpg,.jpeg"
                    multiple
                    onFilesChange={setTrainingFiles}
                    description="支持圖片或壓縮包格式，最大 100MB"
                  />
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">預計訓練時間: <span className="font-medium text-gray-900">30-45分鐘</span></span>
                  </div>
                  <div className="flex space-x-3">
                    <Button variant="outline">預覽測試</Button>
                    <Button 
                      onClick={handleCreateModel}
                      disabled={!characterModel.name || trainingFiles.length === 0 || createModelMutation.isPending}
                    >
                      {createModelMutation.isPending ? "創建中..." : "開始訓練"}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </section>
  );
}
