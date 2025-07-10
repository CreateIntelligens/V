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
import { useUser } from "@/contexts/user-context";
import type { InsertModel } from "@shared/schema";

export function VoiceModelCreation() {
  const [audioModel, setAudioModel] = useState({
    name: "",
    pitch: 50,
    speed: 60,
  });
  const [trainingFiles, setTrainingFiles] = useState<string[]>([]);
  const [actualFiles, setActualFiles] = useState<File[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentUser } = useUser();

  const createModelMutation = useMutation({
    mutationFn: async (modelData: InsertModel & { actualFiles?: File[] }) => {
      let uploadedFileNames: string[] = [];
      
      // 先上傳檔案
      if (modelData.actualFiles && modelData.actualFiles.length > 0) {
        const formData = new FormData();
        modelData.actualFiles.forEach(file => {
          formData.append('files', file);
        });
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error('檔案上傳失敗');
        }
        
        const uploadResult = await uploadResponse.json();
        uploadedFileNames = uploadResult.files.map((f: any) => f.filename);
      }
      
      // 創建模型記錄，使用實際上傳的檔案名稱
      const finalModelData = {
        ...modelData,
        trainingFiles: uploadedFileNames.length > 0 ? uploadedFileNames : modelData.trainingFiles,
      };
      delete finalModelData.actualFiles;
      
      const response = await apiRequest("POST", "/api/models", finalModelData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "參考音頻上傳成功",
        description: "參考音頻已上傳完成",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/models"] });
      // Reset form
      setAudioModel({ name: "", pitch: 50, speed: 60 });
      setTrainingFiles([]);
      setActualFiles([]);
    },
    onError: () => {
      toast({
        title: "上傳失敗",
        description: "請檢查檔案格式後重試",
        variant: "destructive",
      });
    },
  });

  const handleCreateModel = () => {
    const modelData: InsertModel & { actualFiles?: File[] } = {
      name: audioModel.name,
      type: "voice",
      provider: "heygem",
      language: "zh-TW",
      description: "語音資源",
      status: "ready",
      voiceSettings: JSON.stringify({
        pitch: audioModel.pitch,
        speed: audioModel.speed,
      }),
      characterSettings: null,
      trainingFiles: trainingFiles,
      userId: currentUser?.username || "global",
      actualFiles: actualFiles, // 添加實際檔案
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
            <h3 className="text-lg font-semibold text-gray-900">上傳參考音頻</h3>
            <p className="text-sm text-gray-600">上傳您的參考音頻，用於影片生成</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">資源配置</h4>
            <div className="space-y-4">
              <div>
                <Label htmlFor="audioName">資源名稱</Label>
                <Input
                  id="audioName"
                  placeholder="輸入語音資源名稱"
                  value={audioModel.name}
                  onChange={(e) => setAudioModel(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">參考音頻</h4>
            <FileUpload
              accept=".mp3,.wav"
              multiple
              onFilesChange={setTrainingFiles}
              onActualFilesChange={setActualFiles}
              description="支持 MP3, WAV 格式，最大 100MB"
            />
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">用於影片生成時的語音來源</span>
            </div>
            <Button 
              onClick={handleCreateModel}
              disabled={!audioModel.name || actualFiles.length === 0 || createModelMutation.isPending}
            >
              {createModelMutation.isPending ? "上傳中..." : "上傳音頻"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
