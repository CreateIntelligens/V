import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Play, Download, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Model } from "@shared/schema";

export function ModelTTS() {
  const [text, setText] = useState("");
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const { toast } = useToast();

  // 獲取聲音模特列表
  const { data: modelsResponse } = useQuery({
    queryKey: ["/api/models"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/models");
      return response.json();
    },
  });

  // 過濾出已訓練完成的聲音模特
  const voiceModels = (modelsResponse?.data?.list || []).filter(
    (model: Model) => model.type === "voice" && model.status === "ready"
  );

  const generateTTSMutation = useMutation({
    mutationFn: async ({ text, modelId }: { text: string; modelId: string }) => {
      const response = await apiRequest("POST", "/api/tts/model-generate", {
        text,
        modelId: parseInt(modelId),
        format: "wav",
      });
      
      if (!response.ok) {
        throw new Error("語音生成失敗");
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    },
    onSuccess: (audioUrl) => {
      setAudioUrl(audioUrl);
      toast({
        title: "語音生成成功",
        description: "使用您的聲音模特生成語音完成",
      });
    },
    onError: () => {
      toast({
        title: "生成失敗",
        description: "請檢查模特狀態後重試",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!text.trim()) {
      toast({
        title: "請輸入文字",
        description: "請先輸入要轉換的文字內容",
        variant: "destructive",
      });
      return;
    }

    if (!selectedModelId) {
      toast({
        title: "請選擇聲音模特",
        description: "請先選擇一個已訓練的聲音模特",
        variant: "destructive",
      });
      return;
    }

    generateTTSMutation.mutate({ text, modelId: selectedModelId });
  };

  const handleDownload = () => {
    if (audioUrl) {
      const selectedModel = voiceModels.find((m: Model) => m.id.toString() === selectedModelId);
      const a = document.createElement("a");
      a.href = audioUrl;
      a.download = `tts_${selectedModel?.name || 'model'}_${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  if (voiceModels.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">尚無可用的聲音模特</h3>
          <p className="text-gray-600 mb-4">
            您需要先創建並訓練聲音模特才能使用此功能
          </p>
          <Button variant="outline" onClick={() => window.location.href = "/voice-models"}>
            前往創建聲音模特
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 模特選擇 */}
      <div className="space-y-2">
        <Label htmlFor="model">選擇聲音模特</Label>
        <Select value={selectedModelId} onValueChange={setSelectedModelId}>
          <SelectTrigger>
            <SelectValue placeholder="選擇已訓練的聲音模特" />
          </SelectTrigger>
          <SelectContent>
            {voiceModels.map((model: Model) => (
              <SelectItem key={model.id} value={model.id.toString()}>
                <div className="flex items-center space-x-2">
                  <div>
                    <div className="font-medium">{model.name}</div>
                    <div className="text-sm text-gray-500">{model.description}</div>
                  </div>
                  <Badge variant="secondary" className="ml-auto">
                    {model.language}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 文字輸入 */}
      <div className="space-y-2">
        <Label htmlFor="text">輸入文字</Label>
        <Textarea
          id="text"
          placeholder="請輸入要轉換為語音的文字..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          className="resize-none"
        />
        <div className="text-sm text-gray-500 text-right">
          {text.length} 字元
        </div>
      </div>

      {/* 生成按鈕 */}
      <Button 
        onClick={handleGenerate}
        disabled={generateTTSMutation.isPending || !text.trim() || !selectedModelId}
        className="w-full"
      >
        {generateTTSMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            生成中...
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            使用模特生成語音
          </>
        )}
      </Button>

      {/* 音頻播放器 */}
      {audioUrl && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">生成的語音</span>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  下載
                </Button>
              </div>
              <audio controls className="w-full">
                <source src={audioUrl} type="audio/wav" />
                您的瀏覽器不支援音頻播放
              </audio>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
