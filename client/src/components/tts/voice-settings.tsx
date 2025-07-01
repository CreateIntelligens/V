import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Slider } from "@/components/ui/slider";
import { Settings, Zap } from "lucide-react";

// 定義 props 的類型
interface VoiceSettingsProps {
  voiceGenerationType: "basic_tts" | "voice_model" | "voice_clone";
  setVoiceGenerationType: (type: "basic_tts" | "voice_model" | "voice_clone") => void;
  inputText: string;
  setInputText: (text: string) => void;
  selectedTTSProvider: string;
  setSelectedTTSProvider: (provider: string) => void;
  selectedTTSModel: string;
  setSelectedTTSModel: (model: string) => void;
  referenceAudio: File | null;
  setReferenceAudio: (file: File | null) => void;
  
  // 從父組件傳入的數據
  ttsProviders: any[];
  ttsVoices: any;
  minimaxEmotions: any[];

  // MiniMax 狀態
  showMinimaxAdvanced: boolean;
  setShowMinimaxAdvanced: (show: boolean) => void;
  minimaxEmotion: string;
  setMinimaxEmotion: (emotion: string) => void;
  minimaxVolume: number[];
  setMinimaxVolume: (volume: number[]) => void;
  minimaxSpeed: number[];
  setMinimaxSpeed: (speed: number[]) => void;
  minimaxPitch: number[];
  setMinimaxPitch: (pitch: number[]) => void;

  // ATEN 狀態
  showATENAdvanced: boolean;
  setShowATENAdvanced: (show: boolean) => void;
  atenPitch: number[];
  setAtenPitch: (pitch: number[]) => void;
  atenRate: number[];
  setAtenRate: (rate: number[]) => void;
  atenVolume: number[];
  setAtenVolume: (volume: number[]) => void;
  atenSilenceScale: number[];
  setAtenSilenceScale: (scale: number[]) => void;
}

export function VoiceSettings({
  voiceGenerationType,
  setVoiceGenerationType,
  inputText,
  setInputText,
  selectedTTSProvider,
  setSelectedTTSProvider,
  selectedTTSModel,
  setSelectedTTSModel,
  referenceAudio,
  setReferenceAudio,
  ttsProviders,
  ttsVoices,
  minimaxEmotions,
  showMinimaxAdvanced,
  setShowMinimaxAdvanced,
  minimaxEmotion,
  setMinimaxEmotion,
  minimaxVolume,
  setMinimaxVolume,
  minimaxSpeed,
  setMinimaxSpeed,
  minimaxPitch,
  setMinimaxPitch,
  showATENAdvanced,
  setShowATENAdvanced,
  atenPitch,
  setAtenPitch,
  atenRate,
  setAtenRate,
  atenVolume,
  setAtenVolume,
  atenSilenceScale,
  setAtenSilenceScale,
}: VoiceSettingsProps) {
  return (
    <div className="space-y-6">
      {/* 語音生成方式選擇 */}
      <div>
        <Label className="text-base font-semibold">語音生成方式</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
          <Card
            className={`cursor-pointer transition-all ${
              voiceGenerationType === "basic_tts"
                ? "ring-2 ring-primary border-primary"
                : "hover:shadow-md"
            }`}
            onClick={() => setVoiceGenerationType("basic_tts")}
          >
            <CardContent className="p-4">
              <h4 className="font-medium text-gray-900 mb-1">基礎TTS</h4>
              <p className="text-xs text-gray-600">使用預設聲音快速轉換文字為語音</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${
              voiceGenerationType === "voice_model"
                ? "ring-2 ring-primary border-primary"
                : "hover:shadow-md"
            }`}
            onClick={() => setVoiceGenerationType("voice_model")}
          >
            <CardContent className="p-4">
              <h4 className="font-medium text-gray-900 mb-1">聲音模特</h4>
              <p className="text-xs text-gray-600">使用已訓練的聲音模特生成語音</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${
              voiceGenerationType === "voice_clone"
                ? "ring-2 ring-primary border-primary"
                : "hover:shadow-md"
            }`}
            onClick={() => setVoiceGenerationType("voice_clone")}
          >
            <CardContent className="p-4">
              <h4 className="font-medium text-gray-900 mb-1">聲音克隆</h4>
              <p className="text-xs text-gray-600">上傳參考音頻即時克隆聲音特徵</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 文本輸入 (基礎TTS 模式) */}
      {voiceGenerationType === "basic_tts" && (
        <div>
          <Label htmlFor="inputText">輸入文本</Label>
          <Textarea
            id="inputText"
            placeholder="輸入要轉換的文本內容..."
            rows={4}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="resize-none mt-2"
          />
        </div>
      )}

      {/* TTS 提供商選擇 (基礎TTS 模式) */}
      {voiceGenerationType === "basic_tts" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-base font-semibold">選擇 TTS 提供商</Label>
              <Select
                value={selectedTTSProvider}
                onValueChange={(value) => {
                  setSelectedTTSProvider(value);
                  const defaultVoice = ttsVoices[value as keyof typeof ttsVoices]?.[0]?.id || "";
                  setSelectedTTSModel(defaultVoice);
                }}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="選擇 TTS 提供商" />
                </SelectTrigger>
                <SelectContent>
                  {ttsProviders.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      <div className="flex flex-col items-start w-full">
                        <span className="font-medium text-left">{provider.name}</span>
                        <span className="text-xs text-gray-500 text-left">{provider.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTTSProvider && (
              <div>
                <Label className="text-base font-semibold">選擇聲音</Label>
                <Select value={selectedTTSModel} onValueChange={setSelectedTTSModel}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="選擇聲音" />
                  </SelectTrigger>
                  <SelectContent>
                    {ttsVoices[selectedTTSProvider as keyof typeof ttsVoices]?.map((voice: any) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">
                            {voice.language}
                          </span>
                          <span>{voice.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* MiniMax 進階設定 */}
          {selectedTTSProvider === "minimax" && (
            <div className="space-y-3">
              <Collapsible open={showMinimaxAdvanced} onOpenChange={setShowMinimaxAdvanced}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Settings className="mr-2 h-4 w-4" />
                    <Zap className="mr-2 h-4 w-4 text-yellow-500" />
                    MiniMax 進階設定
                    {showMinimaxAdvanced ? " (已展開)" : " (點擊展開)"}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">情緒表達</Label>
                    <Select value={minimaxEmotion} onValueChange={setMinimaxEmotion}>
                      <SelectTrigger>
                        <SelectValue placeholder="選擇情緒" />
                      </SelectTrigger>
                      <SelectContent>
                        {minimaxEmotions.map((emotion) => (
                          <SelectItem key={emotion.id} value={emotion.id}>
                            {emotion.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">音量: {minimaxVolume[0].toFixed(1)}</Label>
                    <Slider value={minimaxVolume} onValueChange={setMinimaxVolume} max={2.0} min={0.1} step={0.1} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">語速: {minimaxSpeed[0].toFixed(1)}</Label>
                    <Slider value={minimaxSpeed} onValueChange={setMinimaxSpeed} max={2.0} min={0.5} step={0.1} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">音調: {minimaxPitch[0] > 0 ? '+' : ''}{minimaxPitch[0]}</Label>
                    <Slider value={minimaxPitch} onValueChange={setMinimaxPitch} max={12} min={-12} step={1} />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}

          {/* ATEN 進階設定 */}
          {selectedTTSProvider === "aten" && (
            <div className="space-y-3">
              <Collapsible open={showATENAdvanced} onOpenChange={setShowATENAdvanced}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Settings className="mr-2 h-4 w-4" />
                    ATEN 進階語音設定
                    {showATENAdvanced ? " (已展開)" : " (點擊展開)"}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">精細語音參數調整</Label>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* 音調 */}
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label className="text-sm font-medium">音調 (Pitch)</Label>
                          <span className="text-sm text-muted-foreground">
                            {atenPitch[0] > 0 ? '+' : ''}{atenPitch[0].toFixed(1)}st
                          </span>
                        </div>
                        <Slider
                          value={atenPitch}
                          onValueChange={setAtenPitch}
                          min={-2}
                          max={2}
                          step={0.1}
                          className="w-full"
                        />
                        <div className="text-xs text-muted-foreground">
                          調整聲音的基頻高低 (-2st ~ +2st)
                        </div>
                      </div>

                      {/* 語速 */}
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label className="text-sm font-medium">語速 (Rate)</Label>
                          <span className="text-sm text-muted-foreground">
                            {atenRate[0].toFixed(1)}x
                          </span>
                        </div>
                        <Slider
                          value={atenRate}
                          onValueChange={setAtenRate}
                          min={0.8}
                          max={1.2}
                          step={0.1}
                          className="w-full"
                        />
                        <div className="text-xs text-muted-foreground">
                          調整說話速度 (0.8x ~ 1.2x)
                        </div>
                      </div>

                      {/* 音量 */}
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label className="text-sm font-medium">音量 (Volume)</Label>
                          <span className="text-sm text-muted-foreground">
                            {atenVolume[0] > 0 ? '+' : ''}{atenVolume[0].toFixed(1)}dB
                          </span>
                        </div>
                        <Slider
                          value={atenVolume}
                          onValueChange={setAtenVolume}
                          min={-6}
                          max={6}
                          step={0.5}
                          className="w-full"
                        />
                        <div className="text-xs text-muted-foreground">
                          調整音量大小 (-6dB ~ +6dB)
                        </div>
                      </div>

                      {/* 停頓時間 */}
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label className="text-sm font-medium">停頓時間 (Silence Scale)</Label>
                          <span className="text-sm text-muted-foreground">
                            {atenSilenceScale[0].toFixed(1)}x
                          </span>
                        </div>
                        <Slider
                          value={atenSilenceScale}
                          onValueChange={setAtenSilenceScale}
                          min={0.5}
                          max={3.0}
                          step={0.1}
                          className="w-full"
                        />
                        <div className="text-xs text-muted-foreground">
                          調整注音符號停頓時間 (0.5x ~ 3.0x)
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}
        </div>
      )}

      {/* 參考音頻上傳 */}
      {voiceGenerationType === "voice_clone" && (
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
    </div>
  );
}
