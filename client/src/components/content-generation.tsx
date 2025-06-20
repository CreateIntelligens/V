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
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [emotion, setEmotion] = useState("neutral");
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const voiceModels = models.filter(m => m.type === "voice" && m.status === "ready");

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
    if (!inputText || !selectedModelId) {
      toast({
        title: "請填寫完整信息",
        description: "請輸入文本並選擇模特",
        variant: "destructive",
      });
      return;
    }

    generateAudioMutation.mutate({
      modelId: parseInt(selectedModelId),
      inputText,
      emotion,
      type: "audio",
    });
  };

  const handleGenerateVideo = () => {
    if (!inputText || !selectedModelId) {
      toast({
        title: "請填寫完整信息",
        description: "請輸入文本並選擇模特",
        variant: "destructive",
      });
      return;
    }

    generateVideoMutation.mutate({
      modelId: parseInt(selectedModelId),
      inputText,
      emotion,
      type: "video",
    });
  };

  return (
    <section className="mb-8">
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">內容生成</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="inputText">輸入文本</Label>
                  <Textarea
                    id="inputText"
                    placeholder="輸入要轉換的文本內容..."
                    rows={6}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="resize-none"
                  />
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm text-gray-600">選擇模特:</Label>
                    <Select value={selectedModelId} onValueChange={setSelectedModelId}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="選擇模特" />
                      </SelectTrigger>
                      <SelectContent>
                        {voiceModels.map((model) => (
                          <SelectItem key={model.id} value={model.id.toString()}>
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm text-gray-600">情感:</Label>
                    <Select value={emotion} onValueChange={setEmotion}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="neutral">中性</SelectItem>
                        <SelectItem value="happy">開心</SelectItem>
                        <SelectItem value="sad">悲傷</SelectItem>
                        <SelectItem value="excited">興奮</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="space-y-4">
                <div className="flex space-x-3">
                  <Button 
                    className="flex-1" 
                    onClick={handleGenerateAudio}
                    disabled={generatingAudio || generateAudioMutation.isPending}
                  >
                    <MicOff className="mr-2 h-4 w-4" />
                    {generatingAudio ? "生成中..." : "生成語音"}
                  </Button>
                  <Button 
                    className="flex-1 bg-purple-500 hover:bg-purple-600" 
                    onClick={handleGenerateVideo}
                    disabled={generatingVideo || generateVideoMutation.isPending}
                  >
                    <Video className="mr-2 h-4 w-4" />
                    {generatingVideo ? "生成中..." : "生成影片"}
                  </Button>
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
