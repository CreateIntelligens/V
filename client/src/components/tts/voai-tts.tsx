import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Play, Download, Loader2, Settings, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";

const VOAI_SPEAKERS = [
  { id: "佑希", name: "佑希", gender: "female", styles: ["預設", "可愛", "聊天"] },
  { id: "小雅", name: "小雅", gender: "female", styles: ["預設", "溫柔", "專業"] },
  { id: "志明", name: "志明", gender: "male", styles: ["預設", "沉穩", "活潑"] },
];

const VOAI_MODELS = [
  { id: "Classic", name: "Classic", description: "高效率模型，適合快速生成" },
  { id: "Neo", name: "Neo", description: "注重情感表達，適合短影音" },
];

export function VoAITTS() {
  const [text, setText] = useState("");
  const [selectedSpeaker, setSelectedSpeaker] = useState("佑希");
  const [selectedStyle, setSelectedStyle] = useState("預設");
  const [selectedModel, setSelectedModel] = useState("Neo");
  const [speed, setSpeed] = useState([1.0]);
  const [pitch, setPitch] = useState([0]);
  const [styleWeight, setStyleWeight] = useState([0]);
  const [breathPause, setBreathPause] = useState([0]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const generateTTSMutation = useMutation({
    mutationFn: async ({ text, config }: { text: string; config: any }) => {
      const response = await fetch(`${window.location.origin}/api/tts/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          service: "service6", // VoAI service
          voice_config: config,
          format: "wav",
          language: "zh",
        }),
      });

      if (!response.ok) {
        throw new Error("VoAI 語音生成失敗");
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    },
    onSuccess: (audioUrl) => {
      setAudioUrl(audioUrl);
      toast({
        title: "VoAI 語音生成成功",
        description: "高品質中文語音已準備好",
      });
    },
    onError: (error) => {
      toast({
        title: "生成失敗",
        description: error.message || "請檢查 VoAI API 設定",
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

    const config = {
      voice: selectedSpeaker,
      style: selectedStyle,
      model: selectedModel,
      speed: speed[0],
      pitch_shift: pitch[0],
      style_weight: styleWeight[0],
      breath_pause: breathPause[0],
    };

    generateTTSMutation.mutate({ text, config });
  };

  const handleDownload = () => {
    if (audioUrl) {
      const a = document.createElement("a");
      a.href = audioUrl;
      a.download = `voai_${selectedSpeaker}_${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const getCurrentSpeaker = () => VOAI_SPEAKERS.find(s => s.id === selectedSpeaker);
  const availableStyles = getCurrentSpeaker()?.styles || ["預設"];

  return (
    <div className="space-y-6">
      {/* 發音人選擇 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="speaker">發音人</Label>
          <Select value={selectedSpeaker} onValueChange={(value) => {
            setSelectedSpeaker(value);
            // 重置風格為第一個可用選項
            const speaker = VOAI_SPEAKERS.find(s => s.id === value);
            if (speaker && speaker.styles.length > 0) {
              setSelectedStyle(speaker.styles[0]);
            }
          }}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="選擇發音人" />
            </SelectTrigger>
            <SelectContent>
              {VOAI_SPEAKERS.map((speaker) => (
                <SelectItem key={speaker.id} value={speaker.id}>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      speaker.gender === 'female' 
                        ? 'bg-pink-100 text-pink-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {speaker.gender === 'female' ? '女聲' : '男聲'}
                    </span>
                    <span>{speaker.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="style">語音風格</Label>
          <Select value={selectedStyle} onValueChange={setSelectedStyle}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="選擇風格" />
            </SelectTrigger>
            <SelectContent>
              {availableStyles.map((style) => (
                <SelectItem key={style} value={style}>
                  {style}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="model">AI 模型</Label>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="選擇模型" />
            </SelectTrigger>
            <SelectContent>
              {VOAI_MODELS.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{model.name}</span>
                    <span className="text-xs text-gray-500">{model.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 文字輸入 */}
      <div className="space-y-2">
        <Label htmlFor="text">輸入文字</Label>
        <Textarea
          id="text"
          placeholder="請輸入要轉換為語音的文字...\n\n💡 支援停頓標記：[:2] 表示停頓2秒"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          className="resize-none"
        />
        <div className="text-sm text-gray-500 text-right">
          {text.length} 字元 {text.length > 200 && "（將使用進階 API）"}
        </div>
      </div>

      {/* 進階設定 */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full">
            <Settings className="mr-2 h-4 w-4" />
            <Zap className="mr-2 h-4 w-4 text-green-500" />
            VoAI 進階設定
            {showAdvanced ? " (已展開)" : " (點擊展開)"}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">語速: {speed[0].toFixed(1)}x</Label>
              <Slider value={speed} onValueChange={setSpeed} max={1.5} min={0.5} step={0.1} />
              <div className="text-xs text-gray-500">調整說話速度 (0.5x ~ 1.5x)</div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">音調: {pitch[0] > 0 ? '+' : ''}{pitch[0]}</Label>
              <Slider value={pitch} onValueChange={setPitch} max={5} min={-5} step={1} />
              <div className="text-xs text-gray-500">調整音調高低 (-5 ~ +5)</div>
            </div>

            {selectedModel === "Classic" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">風格權重: {styleWeight[0].toFixed(1)}</Label>
                <Slider value={styleWeight} onValueChange={setStyleWeight} max={1} min={0} step={0.1} />
                <div className="text-xs text-gray-500">調整語音風格強度 (僅 Classic 模型)</div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium">句間停頓: {breathPause[0].toFixed(1)}s</Label>
              <Slider value={breathPause} onValueChange={setBreathPause} max={10} min={0} step={0.5} />
              <div className="text-xs text-gray-500">調整句間停頓時間 (0 ~ 10秒)</div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 生成按鈕 */}
      <Button 
        onClick={handleGenerate}
        disabled={generateTTSMutation.isPending || !text.trim()}
        className="w-full bg-green-600 hover:bg-green-700"
      >
        {generateTTSMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            VoAI 生成中...
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            使用 VoAI 生成語音
          </>
        )}
      </Button>

      {/* 音頻播放器 */}
      {audioUrl && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">VoAI 生成的語音</span>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  下載
                </Button>
              </div>
              <audio controls className="w-full">
                <source src={audioUrl} type="audio/wav" />
                您的瀏覽器不支援音頻播放
              </audio>
              <div className="text-xs text-gray-500">
                發音人: {selectedSpeaker} | 風格: {selectedStyle} | 模型: {selectedModel}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}