import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { FileUpload } from "@/components/file-upload";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InsertModel } from "@shared/schema";

export function VoiceModelCreation() {
  const [audioModel, setAudioModel] = useState({
    name: "",
    pitch: 50,
    speed: 60,
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
        title: "聲音模特創建成功",
        description: "您的AI聲音模特已開始訓練",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/models"] });
      // Reset form
      setAudioModel({ name: "", pitch: 50, speed: 60 });
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
    const modelData: InsertModel = {
      name: audioModel.name,
      type: "voice",
      provider: "heygem",
      language: "zh-TW",
      description: "聲音模特",
      status: "training",
      voiceSettings: JSON.stringify({
        pitch: audioModel.pitch,
        speed: audioModel.speed,
      }),
      characterSettings: null,
      trainingFiles: trainingFiles,
    };

    createModelMutation.mutate(modelData);
  };

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <MicOff className="text-blue-600 h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">創建聲音模特</h3>
            <p className="text-sm text-gray-600">創建具有獨特聲音特徵的AI語音模型</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">模特配置</h4>
            <div className="space-y-4">
              <div>
                <Label htmlFor="audioName">模特名稱</Label>
                <Input
                  id="audioName"
                  placeholder="輸入聲音模特名稱"
                  value={audioModel.name}
                  onChange={(e) => setAudioModel(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">訓練素材</h4>
            <FileUpload
              accept=".mp3,.wav,.flac"
              multiple
              onFilesChange={setTrainingFiles}
              description="支持 MP3, WAV, FLAC 格式，最大 100MB"
            />
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">預計訓練時間: <span className="font-medium text-gray-900">15-20分鐘</span></span>
            </div>
            <Button 
              onClick={handleCreateModel}
              disabled={!audioModel.name || trainingFiles.length === 0 || createModelMutation.isPending}
            >
              {createModelMutation.isPending ? "創建中..." : "開始訓練"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
