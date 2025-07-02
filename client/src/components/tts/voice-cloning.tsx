import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Play, Download, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FileUpload } from "@/components/file-upload";
import { useToast } from "@/hooks/use-toast";

export function VoiceCloning() {
  const [text, setText] = useState("");
  const [referenceAudio, setReferenceAudio] = useState<string[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const { toast } = useToast();

  // 禁用功能提示
  const showDisabledMessage = () => {
    toast({
      title: "功能暫未開放",
      description: "聲音克隆功能正在開發中，敬請期待",
      variant: "default",
    });
  };

  const generateCloningMutation = useMutation({
    mutationFn: async ({ text, referenceAudio }: { text: string; referenceAudio: string[] }) => {
      const formData = new FormData();
      formData.append("text", text);
      formData.append("format", "wav");
      
      // 添加參考音頻檔案
      if (referenceAudio.length > 0) {
        formData.append("referenceAudio", referenceAudio[0]);
      }

      const response = await fetch("/api/tts/voice-clone", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("聲音克隆失敗");
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    },
    onSuccess: (audioUrl) => {
      setAudioUrl(audioUrl);
      toast({
        title: "聲音克隆成功",
        description: "已成功克隆參考音頻的聲音特徵",
      });
    },
    onError: () => {
      toast({
        title: "克隆失敗",
        description: "請檢查參考音頻格式後重試",
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

    if (referenceAudio.length === 0) {
      toast({
        title: "請上傳參考音頻",
        description: "請先上傳要克隆的參考音頻檔案",
        variant: "destructive",
      });
      return;
    }

    generateCloningMutation.mutate({ text, referenceAudio });
  };

  const handleDownload = () => {
    if (audioUrl) {
      const a = document.createElement("a");
      a.href = audioUrl;
      a.download = `voice_clone_${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* 禁用遮罩 */}
      <div className="absolute inset-0 bg-gray-50 bg-opacity-75 z-10 flex items-center justify-center rounded-lg">
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">功能開發中</h3>
            <p className="text-gray-600 mb-4">聲音克隆功能正在開發中，敬請期待！</p>
            <p className="text-sm text-gray-500">目前您可以使用「用戶音頻」功能上傳音頻檔案進行影片生成</p>
          </CardContent>
        </Card>
      </div>
      
      {/* 原有內容（禁用狀態） */}
      <div className="space-y-6 opacity-50 pointer-events-none">
        {/* 參考音頻上傳 */}
        <div className="space-y-2">
          <Label>上傳參考音頻</Label>
          <FileUpload
            accept=".mp3,.wav,.flac,.m4a"
            multiple={false}
            onFilesChange={setReferenceAudio}
            description="支持 MP3, WAV, FLAC, M4A 格式，建議 10-60 秒清晰語音"
          />
          {referenceAudio.length > 0 && (
          <div className="text-sm text-green-600">
            ✓ 已上傳參考音頻檔案
          </div>
        )}
      </div>

      {/* 文字輸入 */}
      <div className="space-y-2">
        <Label htmlFor="text">輸入文字</Label>
        <Textarea
          id="text"
          placeholder="請輸入要使用克隆聲音朗讀的文字..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          className="resize-none"
        />
        <div className="text-sm text-gray-500 text-right">
          {text.length} 字元
        </div>
      </div>

      {/* 使用說明 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">使用提示</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 參考音頻建議長度 10-60 秒，內容清晰無雜音</li>
            <li>• 音頻中應包含豐富的語音特徵，避免單調朗讀</li>
            <li>• 克隆效果取決於參考音頻的品質</li>
            <li>• 首次克隆可能需要較長處理時間</li>
          </ul>
        </CardContent>
      </Card>

      {/* 生成按鈕 */}
      <Button 
        onClick={handleGenerate}
        disabled={generateCloningMutation.isPending || !text.trim() || referenceAudio.length === 0}
        className="w-full"
      >
        {generateCloningMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            克隆中...
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            開始聲音克隆
          </>
        )}
      </Button>

      {/* 音頻播放器 */}
      {audioUrl && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">克隆的語音</span>
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
    </div>
  );
}
