import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/file-upload";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/user-context";
import type { InsertModel } from "@shared/schema";

export function CharacterModelCreation() {
  const [characterModel, setCharacterModel] = useState({
    name: "",
  });
  const [trainingFiles, setTrainingFiles] = useState<string[]>([]);
  const [actualFiles, setActualFiles] = useState<File[]>([]); // 保存實際檔案對象

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentUser } = useUser();

  const createModelMutation = useMutation({
    mutationFn: async (modelData: InsertModel & { actualFiles?: File[] }) => {
      let uploadedFileNames: string[] = [];
      
      // 如果有實際檔案，先上傳檔案
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
      
      // 創建模特記錄，使用上傳後的檔案名稱
      const finalModelData = {
        ...modelData,
        trainingFiles: uploadedFileNames.length > 0 ? uploadedFileNames : modelData.trainingFiles,
      };
      delete finalModelData.actualFiles; // 移除臨時屬性
      
      const response = await apiRequest("POST", "/api/models", finalModelData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "人物形象創建成功",
        description: "您的AI人物形象已創建完成",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/models"] });
      // Reset form
      setCharacterModel({ name: "" });
      setTrainingFiles([]);
    },
    onError: (error) => {
      toast({
        title: "創建失敗",
        description: error.message || "請檢查輸入信息後重試",
        variant: "destructive",
      });
    },
  });

  const handleCreateModel = () => {
    const modelData = {
      name: characterModel.name,
      type: "character" as const,
      provider: "heygem" as const,
      language: "zh-TW",
      description: "人物形象",
      status: "ready" as const,
      voiceSettings: null,
      characterSettings: null,
      trainingFiles: trainingFiles,
      actualFiles: actualFiles, // 使用保存的實際檔案
      userId: currentUser?.username || "global", // 添加 userId
    };

    createModelMutation.mutate(modelData);
  };

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <UserCircle className="text-green-600 h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">創建人物形象</h3>
            <p className="text-sm text-gray-600">創建個性化的AI人物模型</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">資源配置</h4>
            <div className="space-y-4">
              <div>
                <Label htmlFor="characterName">資源名稱</Label>
                <Input
                  id="characterName"
                  placeholder="輸入人物形象名稱"
                  value={characterModel.name}
                  onChange={(e) => setCharacterModel(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="mt-6 bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                • 建議上傳清晰的正面人物影片<br/>
                • 影片長度建議 10-30 秒<br/>
                • 人物表情和動作自然
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">人物影片</h4>
            <FileUpload
              accept=".mp4,.avi,.mov"
              multiple={false}
              onFilesChange={setTrainingFiles}
              onActualFilesChange={setActualFiles}
              description="上傳人物影片，支持 MP4, AVI, MOV 格式，最大 100MB"
            />
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">創建時間: <span className="font-medium text-gray-900">立即完成</span></span>
            </div>
            <Button 
              onClick={handleCreateModel}
              disabled={!characterModel.name || trainingFiles.length === 0 || createModelMutation.isPending}
            >
              {createModelMutation.isPending ? "創建中..." : "立即創建"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
