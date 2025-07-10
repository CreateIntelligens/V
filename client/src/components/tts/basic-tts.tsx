import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Play, Download, Loader2, Settings, Mic, Volume2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";

const TTS_SERVICES = [
  { id: "service1", name: "EdgeTTS", description: "微軟語音服務" },
  // { id: "service2", name: "MiniMax", description: "MiniMax AI 語音" }, // 暫時移除：API 過期
  { id: "service3", name: "ATEN AIVoice", description: "ATEN 專業語音合成" },
  // { id: "service4", name: "OpenAI", description: "OpenAI TTS" }, // 暫時移除：未完成測試
  { id: "service6", name: "VoAI", description: "網際智慧中文語音" },
];

const EMOTIONS = [
  { id: "neutral", name: "中性" },
  { id: "happy", name: "開心" },
  { id: "sad", name: "悲傷" },
  { id: "angry", name: "憤怒" },
  { id: "surprised", name: "驚訝" },
  { id: "calm", name: "平靜" },
];

export function BasicTTS() {
  const [text, setText] = useState("");
  const [selectedService, setSelectedService] = useState("service1");
  const [selectedVoice, setSelectedVoice] = useState("");
  const [selectedEmotion, setSelectedEmotion] = useState("neutral");
  const [volume, setVolume] = useState([1.0]);
  const [speed, setSpeed] = useState([1.0]);
  const [pitch, setPitch] = useState([0]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const { toast } = useToast();

  // 獲取可用音色列表
  const { data: voicesData } = useQuery({
    queryKey: ["voices", selectedService],
    queryFn: async () => {
      if (selectedService === "service2") {
        const response = await fetch(`${window.location.origin}/api/tts/services/${selectedService}/info`);
        if (response.ok) {
          const data = await response.json();
          return data.voices?.zh || [];
        }
      } else if (selectedService === "service3") {
        const response = await fetch(`${window.location.origin}/api/tts/services/${selectedService}/info`);
        if (response.ok) {
          const data = await response.json();
          return data.available_models || [];
        }
      } else if (selectedService === "service6") {
        // VoAI 服務的聲音選項
        return [
          { id: "佑希-預設", name: "佑希 (預設)", speaker: "佑希", style: "預設" },
          { id: "佑希-可愛", name: "佑希 (可愛)", speaker: "佑希", style: "可愛" },
          { id: "佑希-聊天", name: "佑希 (聊天)", speaker: "佑希", style: "聊天" },
          { id: "小雅-預設", name: "小雅 (預設)", speaker: "小雅", style: "預設" },
          { id: "小雅-溫柔", name: "小雅 (溫柔)", speaker: "小雅", style: "溫柔" },
          { id: "小雅-專業", name: "小雅 (專業)", speaker: "小雅", style: "專業" },
          { id: "志明-預設", name: "志明 (預設)", speaker: "志明", style: "預設" },
          { id: "志明-沉穩", name: "志明 (沉穩)", speaker: "志明", style: "沉穩" },
          { id: "志明-活潑", name: "志明 (活潑)", speaker: "志明", style: "活潑" },
        ];
      }
      return [];
    },
    enabled: selectedService === "service3" || selectedService === "service6",
  });

  // 當服務改變時重置音色選擇
  useEffect(() => {
    if (selectedService === "service3" && voicesData && voicesData.length > 0) {
      setSelectedVoice(voicesData[0].model_id);
    } else if (selectedService === "service6" && voicesData && voicesData.length > 0) {
      setSelectedVoice(voicesData[0].id);
    } else {
      setSelectedVoice("");
    }
  }, [selectedService, voicesData]);

  const generateTTSMutation = useMutation({
    mutationFn: async ({ text, service }: { text: string; service: string }) => {
      const requestBody: any = {
        text,
        service,
        format: "wav",
        language: "zh",
      };

      // 如果是 MiniMax 服務，添加進階參數
      if (service === "service2") {
        requestBody.emotion = selectedEmotion;
        requestBody.volume = volume[0];
        requestBody.voice_config = {
          voice_id: selectedVoice,
          speed: speed[0],
          pitch: pitch[0],
        };
      }
      
      // 如果是 ATEN 服務，添加語音配置
      if (service === "service3") {
        requestBody.language = "zh-TW";
        requestBody.voice_config = {
          voice_name: selectedVoice,
          pitch: pitch[0] / 6, // 轉換為 ATEN 的 -2~+2 範圍
          rate: speed[0],
          volume: (volume[0] - 1) * 6, // 轉換為 ATEN 的 -6~+6 範圍
          silence_scale: 1.0,
        };
      }
      
      // 如果是 VoAI 服務，添加語音配置
      if (service === "service6") {
        if (selectedVoice) {
          const voiceData = voicesData?.find((v: any) => v.id === selectedVoice);
          if (voiceData) {
            requestBody.voice_config = {
              voice: voiceData.speaker,
              style: voiceData.style,
              model: "Neo",
              speed: speed[0],
              pitch_shift: pitch[0],
              style_weight: 0,
              breath_pause: 0,
            };
          }
        }
      }

      const response = await fetch("/api/tts/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error("TTS 生成失敗");
      }

      // 檢查回應是否為音頻文件
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.startsWith("audio/")) {
        // 獲取檔案名稱從回應頭
        const filename = response.headers.get("X-Filename");
        const audioPath = response.headers.get("X-Audio-Path");
        
        console.log('TTS 回應頭:', {
          filename,
          audioPath,
          contentType,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        if (filename) {
          // 直接使用服務器 URL 而不是 blob URL
          const audioUrl = `${window.location.origin}/audios/${filename}`;
          console.log('使用檔案名 URL:', audioUrl);
          return audioUrl;
        } else if (audioPath) {
          // 使用音頻路徑
          const audioUrl = audioPath.startsWith('http') ? audioPath : `${window.location.origin}${audioPath}`;
          console.log('使用音頻路徑 URL:', audioUrl);
          return audioUrl;
        } else {
          // 回退到 blob URL
          console.log('回退到 blob URL');
          const blob = await response.blob();
          return URL.createObjectURL(blob);
        }
      } else {
        // 如果不是音頻文件，可能是錯誤回應
        const text = await response.text();
        throw new Error(`TTS 生成失敗: ${text}`);
      }
    },
    onSuccess: (audioUrl) => {
      setAudioUrl(audioUrl);
      toast({
        title: "語音生成成功",
        description: "您的語音已準備就緒",
      });
    },
    onError: () => {
      toast({
        title: "生成失敗",
        description: "請檢查網路連接後重試",
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

    generateTTSMutation.mutate({ text, service: selectedService });
  };

  const handleDownload = () => {
    if (audioUrl) {
      const a = document.createElement("a");
      a.href = audioUrl;
      a.download = `tts_${selectedService}_${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-blue-600" />
            AI 語音生成
            {/* {selectedService === "service2" && (
              <Zap className="h-4 w-4 text-yellow-500" />
            )} */}
          </CardTitle>
          <p className="text-sm text-gray-600">
            {/* {selectedService === "service2" 
              ? "使用 MiniMax AI 技術生成高品質語音，支援情緒和音色控制"
              : "選擇不同的 TTS 服務來生成語音"
            } */}
            選擇不同的 TTS 服務來生成語音
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 服務選擇 */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">選擇 TTS 服務</Label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger>
                <SelectValue placeholder="選擇語音服務" />
              </SelectTrigger>
              <SelectContent>
                {TTS_SERVICES.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Mic className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">{service.name}</div>
                        <div className="text-sm text-gray-500">{service.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* MiniMax 音色選擇 - 暫時註解 */}
          {/* {selectedService === "service2" && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">選擇音色</Label>
              {voicesData && voicesData.length > 0 ? (
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇音色" />
                  </SelectTrigger>
                  <SelectContent>
                    {voicesData.map((voice: any) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Volume2 className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <div className="font-medium">{voice.name}</div>
                            <div className="text-sm text-gray-500">{voice.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    正在載入音色列表...請確認 MiniMax 服務已啟動
                  </p>
                </div>
              )}
            </div>
          )} */

          {/* ATEN 音色選擇 */}
          {selectedService === "service3" && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">選擇 ATEN 聲優</Label>
              {voicesData && voicesData.length > 0 ? (
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇聲優" />
                  </SelectTrigger>
                  <SelectContent>
                    {voicesData.map((voice: any) => (
                      <SelectItem key={voice.model_id} value={voice.model_id}>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <Volume2 className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <div className="font-medium">{voice.name || voice.model_id}</div>
                            <div className="text-sm text-gray-500">{voice.description || 'ATEN 專業聲優'}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    正在載入聲優列表...請確認 ATEN AIVoice 服務已啟動
                  </p>
                </div>
              )}
            </div>
          )}

          {/* VoAI 音色選擇 */}
          {selectedService === "service6" && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">選擇 VoAI 聲音</Label>
              {voicesData && voicesData.length > 0 ? (
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇聲音" />
                  </SelectTrigger>
                  <SelectContent>
                    {voicesData.map((voice: any) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Volume2 className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <div className="font-medium">{voice.name}</div>
                            <div className="text-sm text-gray-500">VoAI 中文語音</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    正在載入 VoAI 聲音列表...請確認 VoAI 服務已啟動
                  </p>
                </div>
              )}
            </div>
          )}

          {/* MiniMax 進階設定 - 暫時註解 */}
          {/* {selectedService === "service2" && (
            <div className="space-y-3">
              <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Settings className="mr-2 h-4 w-4" />
                    MiniMax 進階設定
                    {showAdvanced ? " (已展開)" : " (點擊展開)"}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  {/* 情緒選擇 */}
                  {/* <div className="space-y-2">
                    <Label htmlFor="emotion" className="text-sm font-medium">情緒表達</Label>
                    <Select value={selectedEmotion} onValueChange={setSelectedEmotion}>
                      <SelectTrigger>
                        <SelectValue placeholder="選擇情緒" />
                      </SelectTrigger>
                      <SelectContent>
                        {EMOTIONS.map((emotion) => (
                          <SelectItem key={emotion.id} value={emotion.id}>
                            {emotion.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div> */}

                  {/* 音量控制 */}
                  {/* <div className="space-y-2">
                    <Label className="text-sm font-medium">音量: {volume[0].toFixed(1)}</Label>
                    <Slider
                      value={volume}
                      onValueChange={setVolume}
                      max={2.0}
                      min={0.1}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>0.1 (最小)</span>
                      <span>2.0 (最大)</span>
                    </div>
                  </div> */}

                  {/* 語速控制 */}
                  {/* <div className="space-y-2">
                    <Label className="text-sm font-medium">語速: {speed[0].toFixed(1)}</Label>
                    <Slider
                      value={speed}
                      onValueChange={setSpeed}
                      max={2.0}
                      min={0.5}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>0.5 (慢)</span>
                      <span>2.0 (快)</span>
                    </div>
                  </div> */}

                  {/* 音調控制 */}
                  {/* <div className="space-y-2">
                    <Label className="text-sm font-medium">音調: {pitch[0] > 0 ? '+' : ''}{pitch[0]}</Label>
                    <Slider
                      value={pitch}
                      onValueChange={setPitch}
                      max={12}
                      min={-12}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>-12 (低)</span>
                      <span>+12 (高)</span>
                    </div>
                  </div> */}
                {/* </CollapsibleContent>
              </Collapsible>
            </div>
          )} */

          {/* 文字輸入 */}
          <div className="space-y-3">
            <Label htmlFor="text" className="text-base font-semibold">
              語音文字內容
            </Label>
            <Textarea
              id="text"
              placeholder="輸入您希望轉換為語音的文字內容...&#10;&#10;範例：&#10;大家好，歡迎來到我們的產品介紹。今天我要為您展示最新的功能特色。"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>建議長度：10-500 字</span>
              <span>{text.length} 字</span>
            </div>
          </div>

          {/* 生成按鈕 */}
          <Button 
            onClick={handleGenerate}
            disabled={generateTTSMutation.isPending || !text.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            {generateTTSMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5" />
                生成語音
              </>
            )}
          </Button>

          {/* 音頻播放器 */}
          {audioUrl && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                語音生成完成
              </h4>
              <div className="space-y-4">
                <audio controls className="w-full">
                  <source src={audioUrl} type="audio/wav" />
                  您的瀏覽器不支援音頻播放
                </audio>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    下載音頻
                  </Button>
                </div>
                <div className="text-xs text-gray-500 text-center">
                  音頻由 {TTS_SERVICES.find(s => s.id === selectedService)?.name} 生成 • 格式：WAV
                </div>
              </div>
            </div>
          )}

          {/* 功能說明 */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h5 className="font-medium text-gray-900 mb-2">
              {/* {selectedService === "service2" ? "MiniMax TTS 特色" : "TTS 服務特色"} */}
              TTS 服務特色
            </h5>
            <ul className="text-sm text-gray-600 space-y-1">
              {/* {selectedService === "service2" ? (
                <>
                  <li>• 支援多種自定義音色，聲音自然生動</li>
                  <li>• 豐富的情緒表達：開心、悲傷、憤怒等</li>
                  <li>• 精確的音量、語速、音調控制</li>
                  <li>• 高品質語音合成，適合專業用途</li>
                </>
              ) : (
                <>
                  <li>• 快速語音合成，即時生成</li>
                  <li>• 支援中文和英文語音</li>
                  <li>• 簡單易用，適合基本需求</li>
                </>
              )} */}
              <li>• 快速語音合成，即時生成</li>
              <li>• 支援中文和英文語音</li>
              <li>• 簡單易用，適合基本需求</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
