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
  voiceGenerationType: "basic_tts" | "voice_model";
  setVoiceGenerationType: (type: "basic_tts" | "voice_model") => void;
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
  voiceModels?: any[]; // 新增：聲音模型列表

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
  voiceModels = [],
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <Card
            className={`cursor-pointer transition-all ${
              voiceGenerationType === "basic_tts"
                ? "ring-2 ring-primary border-primary"
                : "hover:shadow-md"
            }`}
            onClick={() => setVoiceGenerationType("basic_tts")}
          >
            <CardContent className="p-4">
              <h4 className="font-medium text-gray-900 mb-1">基礎 TTS</h4>
              <p className="text-xs text-gray-600">使用內建 EdgeTTS 聲音生成</p>
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
              <h4 className="font-medium text-gray-900 mb-1">語音資源</h4>
              <p className="text-xs text-gray-600">使用已上傳的聲音模型或上傳</p>
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

      {/* EdgeTTS 聲音選擇 (基礎TTS 模式) */}
      {voiceGenerationType === "basic_tts" && (
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">選擇聲音</Label>
            <Select value={selectedTTSModel} onValueChange={setSelectedTTSModel}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="選擇 EdgeTTS 聲音" />
              </SelectTrigger>
              <SelectContent>
                {ttsVoices.edgetts?.map((voice: any) => (
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
        </div>
      )}

      {/* 聲音資源選擇 */}
      {voiceGenerationType === "voice_model" && (
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">選擇聲音資源</Label>
            <Select value={selectedTTSModel} onValueChange={setSelectedTTSModel}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="選擇聲音來源" />
              </SelectTrigger>
              <SelectContent>
                {/* 預設選項 */}
                <SelectItem value="upload_new">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 rounded text-xs bg-orange-100 text-orange-700">
                      上傳
                    </span>
                    <span>上傳音頻檔案</span>
                  </div>
                </SelectItem>
                
                {/* 已上傳的聲音模型 */}
                {voiceModels.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-50 border-t">
                      已上傳的聲音模型
                    </div>
                    {voiceModels.map((model: any) => (
                      <SelectItem key={model.id} value={model.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">
                            聲音
                          </span>
                          <span>{model.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          
          {/* 檔案上傳區域 */}
          {selectedTTSModel === "upload_new" && (
            <div>
              <Label className="text-base font-semibold">上傳音頻檔案</Label>
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
                <p className="mt-2 text-xs text-gray-500">
                  支援 MP3, WAV, FLAC 格式，此音頻僅用於本次生成
                </p>
              </div>
            </div>
          )}
          
          {voiceModels.length === 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-700">
                <Settings className="h-4 w-4" />
                <span className="text-sm font-medium">沒有已上傳的聲音模型</span>
              </div>
              <div className="text-xs text-yellow-600 mt-1">
                您可以先到「聲音管理」上傳聲音檔案，或直接上傳
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
