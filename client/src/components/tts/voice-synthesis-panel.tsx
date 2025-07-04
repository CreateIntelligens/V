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
import { Slider } from "@/components/ui/slider";
import { Settings, MicOff, Users, Play, Download, Loader2, Upload } from "lucide-react";
import { AudioPlayer } from "@/components/audio-player";

// 定義 props 的類型
interface VoiceSynthesisPanelProps {
  // 語音生成類型
  voiceGenerationType: "basic_tts" | "voice_model";
  setVoiceGenerationType: (type: "basic_tts" | "voice_model") => void;
  
  // 文本輸入
  inputText: string;
  setInputText: (text: string) => void;
  
  // TTS 基本設定
  selectedTTSProvider: string;
  setSelectedTTSProvider: (provider: string) => void;
  selectedTTSModel: string;
  setSelectedTTSModel: (model: string) => void;
  
  // 語音資源
  referenceAudio: File | null;
  setReferenceAudio: (file: File | null) => void;
  
  // 從父組件傳入的數據
  ttsProviders: any[];
  ttsVoices: any;
  minimaxEmotions: any[];
  voiceModels?: any[];

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

  // VoAI 狀態
  showVoAIAdvanced: boolean;
  setShowVoAIAdvanced: (show: boolean) => void;
  voaiModel: string;
  setVoaiModel: (model: string) => void;
  voaiStyle: string;
  setVoaiStyle: (style: string) => void;
  voaiSpeed: number[];
  setVoaiSpeed: (speed: number[]) => void;
  voaiPitch: number[];
  setVoaiPitch: (pitch: number[]) => void;

  // 語音生成功能
  generatingAudio?: boolean;
  audioProgress?: number;
  generatedAudio?: string | null;
  onGenerateAudio?: () => void;
  
  // 布局選項
  showVoiceTypeSelector?: boolean; // 是否顯示語音生成方式選擇器
  showTextInput?: boolean; // 是否顯示文本輸入框
  compact?: boolean; // 緊湊模式（用於影片生成頁面）
}

export function VoiceSynthesisPanel({
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
  showVoAIAdvanced,
  setShowVoAIAdvanced,
  voaiModel,
  setVoaiModel,
  voaiStyle,
  setVoaiStyle,
  voaiSpeed,
  setVoaiSpeed,
  voaiPitch,
  setVoaiPitch,
  generatingAudio = false,
  audioProgress = 0,
  generatedAudio = null,
  onGenerateAudio,
  showVoiceTypeSelector = true,
  showTextInput = true,
  compact = false,
}: VoiceSynthesisPanelProps) {
  
  return (
    <div className="space-y-6">
      {/* 語音生成模式 */}
      {voiceGenerationType === "basic_tts" && (
        <div className="space-y-6">
          {/* 步驟 1: 文字輸入 */}
          {showTextInput && (
            <Card className="shadow-sm border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">1</span>
                  </div>
                  <Label className="text-lg font-semibold text-gray-900">輸入文字內容</Label>
                </div>
                <Textarea
                  placeholder="請輸入要轉換成語音的文字內容..."
                  rows={4}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="text-base resize-none"
                />
              </CardContent>
            </Card>
          )}

          {/* 步驟 2: TTS 設定 */}
          <Card className="shadow-sm border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold text-sm">2</span>
                </div>
                <Label className="text-lg font-semibold text-gray-900">選擇語音設定</Label>
              </div>

              {/* TTS 提供商和語音角色選擇 */}
              <div className="space-y-6">
                <div className={`grid grid-cols-1 gap-4 ${compact ? "md:grid-cols-1" : "md:grid-cols-2"}`}>
                  {/* TTS 提供商選擇 */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">TTS 服務商</Label>
                    <Select
                      value={selectedTTSProvider}
                      onValueChange={(value) => {
                        setSelectedTTSProvider(value);
                        const defaultVoice = ttsVoices[value as keyof typeof ttsVoices]?.[0]?.id || "";
                        setSelectedTTSModel(defaultVoice);
                      }}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="選擇 TTS 提供商" />
                      </SelectTrigger>
                      <SelectContent>
                        {ttsProviders.map((provider: any) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            <div className="flex items-center gap-3 w-full">
                              <div className={`w-3 h-3 rounded-full ${(() => {
                                const colors: { [key: string]: string } = {
                                  'edgetts': 'bg-blue-500',
                                  'minimax': 'bg-purple-500', 
                                  'aten': 'bg-orange-500',
                                  'voai': 'bg-green-500',
                                  'fishtts': 'bg-red-500'
                                };
                                return colors[provider.id] || 'bg-gray-500';
                              })()}`}></div>
                              <div className="flex flex-col items-start flex-1">
                                <span className="font-medium text-left">{provider.name}</span>
                                <span className="text-xs text-gray-500 text-left">{provider.description}</span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 語音角色選擇 */}
                  {selectedTTSProvider && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-gray-700">語音角色</Label>
                      <Select 
                        value={selectedTTSModel || (ttsVoices[selectedTTSProvider as keyof typeof ttsVoices]?.[0]?.id || "")} 
                        onValueChange={setSelectedTTSModel}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="選擇語音角色" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {ttsVoices[selectedTTSProvider as keyof typeof ttsVoices]?.map((voice: any) => (
                            <SelectItem key={voice.id} value={voice.id}>
                              <div className="flex items-center gap-2 w-full py-1">
                                {/* 性別標籤 */}
                                {voice.gender && (
                                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                                    voice.gender === 'Female' || voice.gender === '女聲' 
                                      ? 'bg-pink-100 text-pink-700' 
                                      : voice.gender === 'Male' || voice.gender === '男聲'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}>
                                  {voice.gender === 'Female' || voice.gender === '女聲' ? '女' : 
                                   voice.gender === 'Male' || voice.gender === '男聲' ? '男' : '?'}
                                  </span>
                                )}
                                
                                {/* 語言/地區標籤 */}
                                <span className={`px-2 py-0.5 rounded text-xs flex-shrink-0 ${
                                  selectedTTSProvider === 'voai' 
                                    ? 'bg-green-100 text-green-700' 
                                    : selectedTTSProvider === 'edgetts'
                                    ? 'bg-blue-100 text-blue-700'
                                    : selectedTTSProvider === 'minimax'
                                    ? 'bg-purple-100 text-purple-700'
                                    : selectedTTSProvider === 'aten'
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {voice.language || voice.speaker || voice.style}
                                </span>
                                
                                {/* 語音名稱 */}
                                <span className="font-medium flex-1 truncate">{voice.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* 進階設定按鈕 */}
                {selectedTTSProvider && (selectedTTSProvider === "voai" || selectedTTSProvider === "minimax" || selectedTTSProvider === "aten") && (
                  <div className="flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        if (selectedTTSProvider === "voai") setShowVoAIAdvanced(!showVoAIAdvanced);
                        if (selectedTTSProvider === "minimax") setShowMinimaxAdvanced(!showMinimaxAdvanced);
                        if (selectedTTSProvider === "aten") setShowATENAdvanced(!showATENAdvanced);
                      }}
                      className="h-8 px-3 text-xs"
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      {(selectedTTSProvider === "voai" && showVoAIAdvanced) ||
                       (selectedTTSProvider === "minimax" && showMinimaxAdvanced) ||
                       (selectedTTSProvider === "aten" && showATENAdvanced) ? "隱藏" : "顯示"}進階設定
                    </Button>
                  </div>
                )}
              </div>

              {/* 進階設定面板 */}
              {selectedTTSProvider && renderAdvancedSettings()}

              {/* 步驟 3: 生成語音按鈕 */}
              {onGenerateAudio && (
                <div className="pt-6 border-t">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 font-semibold text-sm">3</span>
                    </div>
                    <Label className="text-lg font-semibold text-gray-900">生成語音</Label>
                  </div>
                  
                  <Button 
                    onClick={onGenerateAudio}
                    disabled={generatingAudio || !inputText.trim()}
                    size="lg"
                    className="w-full h-12 text-base"
                  >
                    {generatingAudio ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5 mr-2" />
                        🎤 開始生成語音
                      </>
                    )}
                  </Button>
                  
                  {generatingAudio && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>生成進度</span>
                        <span>{audioProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${audioProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 步驟 4: 預覽和下載 */}
          {generatedAudio && (
            <Card className="shadow-sm border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-blue-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-semibold text-sm">4</span>
                  </div>
                  <Label className="text-lg font-semibold text-gray-900">🎧 預覽與下載</Label>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <AudioPlayer src={generatedAudio} />
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={generatedAudio} download>
                      <Download className="h-4 w-4 mr-2" />
                      下載音頻
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* 語音資源模式 */}
      {voiceGenerationType === "voice_model" && renderVoiceResourceContent()}
    </div>
  );

  function renderVoiceResourceContent() {
    return (
      <Card className="shadow-sm border-l-4 border-l-indigo-500">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
              <Users className="h-4 w-4 text-indigo-600" />
            </div>
            <Label className="text-lg font-semibold text-gray-900">語音資源管理</Label>
          </div>
          
          <Select 
            value={selectedTTSModel || (voiceModels && voiceModels.length > 0 ? voiceModels[0].id.toString() : "upload_new")} 
            onValueChange={setSelectedTTSModel}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="選擇聲音來源" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {/* 已上傳的聲音模型 - 優先顯示 */}
              {voiceModels && voiceModels.length > 0 && (
                <>
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 sticky top-0">
                    🎤 已上傳的聲音模型
                  </div>
                  {voiceModels.map((model: any) => (
                    <SelectItem key={model.id} value={model.id.toString()}>
                      <div className="flex items-center space-x-3 w-full py-1">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 text-xs font-medium">聲</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{model.name}</div>
                          <div className="text-xs text-gray-500">
                            {model.language || '自定義聲音'} • {model.provider || '已上傳'}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                  <div className="border-t my-1"></div>
                </>
              )}
              
              {/* 上傳新檔案選項 */}
              <SelectItem value="upload_new">
                <div className="flex items-center space-x-3 w-full py-1">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-600 text-xs font-medium">+</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">上傳新的音頻檔案</div>
                    <div className="text-xs text-gray-500">支援 MP3, WAV, FLAC</div>
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          {/* 檔案上傳區域 */}
          {selectedTTSModel === "upload_new" && (
            <div className="mt-6 p-6 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg">
              <Label className="text-sm font-medium mb-3 block text-orange-800">📁 上傳音頻檔案</Label>
              <div className="border-2 border-dashed border-orange-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setReferenceAudio(e.target.files?.[0] || null)}
                  className="hidden"
                  id="audio-upload"
                />
                <label 
                  htmlFor="audio-upload" 
                  className="cursor-pointer block"
                >
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Upload className="h-6 w-6 text-orange-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-1">點擊上傳音頻檔案</p>
                  <p className="text-xs text-gray-500">或拖拽檔案到此處</p>
                </label>
              </div>
              
              {referenceAudio && (
                <div className="mt-4 p-3 bg-white border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-xs">✓</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800">已選擇檔案</p>
                      <p className="text-xs text-green-600">{referenceAudio.name}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-4 text-xs text-gray-600 space-y-1">
                <p>• 支援格式：MP3, WAV, FLAC, M4A</p>
                <p>• 檔案大小：建議不超過 50MB</p>
                <p>• 音質建議：44.1kHz, 16bit 或更高</p>
              </div>
            </div>
          )}
          
          {voiceModels.length === 0 && selectedTTSModel !== "upload_new" && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mt-6">
              <div className="flex items-center gap-2 text-yellow-700">
                <Settings className="h-4 w-4" />
                <span className="text-sm font-medium">沒有已上傳的聲音模型</span>
              </div>
              <div className="text-xs text-yellow-600 mt-1">
                您可以先到「聲音管理」頁面上傳聲音檔案，或選擇「上傳音頻檔案」選項
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  function renderMainContent() {
    // 此函數保留用於向後兼容，但新設計不再使用
    return null;
  }

  function renderAdvancedSettings() {
    return (
      <div className="space-y-4">
        {/* VoAI 進階設定 */}
        {selectedTTSProvider === "voai" && showVoAIAdvanced && (
          <Card className="p-4 bg-green-50 border-green-200">
            <Label className="text-sm font-semibold mb-3 block text-green-800">VoAI 進階設定</Label>
            <div className={`grid grid-cols-1 gap-4 ${compact ? "md:grid-cols-1" : "md:grid-cols-2"}`}>
              {/* 語音模型 */}
              <div>
                <Label className="text-xs font-medium mb-2 block">語音模型</Label>
                <Select value={voaiModel} onValueChange={setVoaiModel}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="選擇模型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Neo">
                      <div className="flex flex-col items-start">
                        <span className="font-medium text-xs">Neo</span>
                        <span className="text-xs text-gray-500">注重情感表達，適合短影音</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Classic">
                      <div className="flex flex-col items-start">
                        <span className="font-medium text-xs">Classic</span>
                        <span className="text-xs text-gray-500">高效率模型，快速生成</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 語音風格 */}
              <div>
                <Label className="text-xs font-medium mb-2 block">語音風格</Label>
                <Select value={voaiStyle} onValueChange={setVoaiStyle}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="選擇風格" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="預設">預設</SelectItem>
                    {selectedTTSModel === "佑希" && (
                      <>
                        <SelectItem value="聊天">聊天</SelectItem>
                        <SelectItem value="平靜">平靜</SelectItem>
                        <SelectItem value="哭腔">哭腔</SelectItem>
                        <SelectItem value="生氣">生氣</SelectItem>
                        <SelectItem value="激動">激動</SelectItem>
                        <SelectItem value="嚴肅">嚴肅</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* 語速 */}
              <div>
                <Label className="text-xs font-medium mb-2 block">語速: {voaiSpeed[0]}x</Label>
                <Slider
                  value={voaiSpeed}
                  onValueChange={setVoaiSpeed}
                  max={1.5}
                  min={0.5}
                  step={0.1}
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0.5x</span>
                  <span>1.5x</span>
                </div>
              </div>

              {/* 音調 */}
              <div>
                <Label className="text-xs font-medium mb-2 block">音調: {voaiPitch[0]}</Label>
                <Slider
                  value={voaiPitch}
                  onValueChange={setVoaiPitch}
                  max={5}
                  min={-5}
                  step={1}
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>-5</span>
                  <span>+5</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* MiniMax 進階設定 */}
        {selectedTTSProvider === "minimax" && showMinimaxAdvanced && (
          <Card className="p-4 bg-purple-50 border-purple-200">
            <Label className="text-sm font-semibold mb-3 block text-purple-800">MiniMax 進階設定</Label>
            <div className={`grid grid-cols-1 gap-4 ${compact ? "md:grid-cols-1" : "md:grid-cols-2"}`}>
              <div>
                <Label className="text-xs font-medium mb-2 block">情緒風格</Label>
                <Select value={minimaxEmotion} onValueChange={setMinimaxEmotion}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="選擇情緒" />
                  </SelectTrigger>
                  <SelectContent>
                    {minimaxEmotions.map((emotion: any) => (
                      <SelectItem key={emotion.id} value={emotion.id}>
                        {emotion.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium mb-2 block">音量: {minimaxVolume[0]}</Label>
                <Slider
                  value={minimaxVolume}
                  onValueChange={setMinimaxVolume}
                  max={2.0}
                  min={0.1}
                  step={0.1}
                  className="h-2"
                />
              </div>
              <div>
                <Label className="text-xs font-medium mb-2 block">語速: {minimaxSpeed[0]}x</Label>
                <Slider
                  value={minimaxSpeed}
                  onValueChange={setMinimaxSpeed}
                  max={2.0}
                  min={0.5}
                  step={0.1}
                  className="h-2"
                />
              </div>
              <div>
                <Label className="text-xs font-medium mb-2 block">音調: {minimaxPitch[0]}</Label>
                <Slider
                  value={minimaxPitch}
                  onValueChange={setMinimaxPitch}
                  max={2}
                  min={-2}
                  step={0.1}
                  className="h-2"
                />
              </div>
            </div>
          </Card>
        )}

        {/* ATEN 進階設定 */}
        {selectedTTSProvider === "aten" && showATENAdvanced && (
          <Card className="p-4 bg-orange-50 border-orange-200">
            <Label className="text-sm font-semibold mb-3 block text-orange-800">ATEN 進階設定</Label>
            <div className={`grid grid-cols-1 gap-4 ${compact ? "md:grid-cols-1" : "md:grid-cols-2"}`}>
              <div>
                <Label className="text-xs font-medium mb-2 block">音調: {atenPitch[0]}</Label>
                <Slider
                  value={atenPitch}
                  onValueChange={setAtenPitch}
                  max={20}
                  min={-20}
                  step={1}
                  className="h-2"
                />
              </div>
              <div>
                <Label className="text-xs font-medium mb-2 block">語速: {atenRate[0]}x</Label>
                <Slider
                  value={atenRate}
                  onValueChange={setAtenRate}
                  max={2.0}
                  min={0.5}
                  step={0.1}
                  className="h-2"
                />
              </div>
              <div>
                <Label className="text-xs font-medium mb-2 block">音量: {atenVolume[0]}</Label>
                <Slider
                  value={atenVolume}
                  onValueChange={setAtenVolume}
                  max={20}
                  min={-20}
                  step={1}
                  className="h-2"
                />
              </div>
              <div>
                <Label className="text-xs font-medium mb-2 block">停頓倍率: {atenSilenceScale[0]}x</Label>
                <Slider
                  value={atenSilenceScale}
                  onValueChange={setAtenSilenceScale}
                  max={2.0}
                  min={0.1}
                  step={0.1}
                  className="h-2"
                />
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  }
}