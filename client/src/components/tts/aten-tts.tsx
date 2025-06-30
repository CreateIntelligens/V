import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, Play, Download, Volume2, Settings, Headphones } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Voice {
  model_id: string;
  name: string;
  description: string;
  sample_audio_path?: string;
  gender?: string;
  languages?: string[];
}

interface VoiceConfig {
  voice_name?: string;
  pitch: number;
  rate: number;
  volume: number;
  silence_scale: number;
  use_custom_poly: boolean;
}

export function ATENTTS() {
  const [text, setText] = useState('你好，這是 ATEN AIVoice 語音合成測試。歡迎使用專業級語音合成服務！');
  const [language, setLanguage] = useState('zh-TW');
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>({
    pitch: 0,
    rate: 1.0,
    volume: 0,
    silence_scale: 1.0,
    use_custom_poly: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioInfo, setAudioInfo] = useState<any>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const previewAudioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  // 載入可用聲優
  const loadVoices = async () => {
    setIsLoadingVoices(true);
    try {
      const response = await fetch('/api/tts/services/service3/info');
      if (response.ok) {
        const data = await response.json();
        const availableVoices = data.available_models || [];
        setVoices(availableVoices);
        
        if (availableVoices.length > 0 && !selectedVoice) {
          setSelectedVoice(availableVoices[0].model_id);
        }
        
        toast({
          title: "聲優載入成功",
          description: `載入了 ${availableVoices.length} 個 ATEN 聲優模型`,
        });
      } else {
        throw new Error('載入聲優失敗');
      }
    } catch (error) {
      console.error('載入聲優失敗:', error);
      toast({
        title: "載入聲優失敗",
        description: "請檢查 ATEN AIVoice 服務是否正常運行",
        variant: "destructive",
      });
    } finally {
      setIsLoadingVoices(false);
    }
  };

  // 生成語音
  const generateSpeech = async () => {
    if (!text.trim()) {
      toast({
        title: "請輸入文本",
        description: "請輸入要合成的文本內容",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setAudioUrl(null);
    setAudioInfo(null);

    try {
      const requestData = {
        text: text.trim(),
        service: 'service3',
        voice_config: {
          ...voiceConfig,
          voice_name: selectedVoice || undefined
        },
        format: 'wav',
        language: language
      };

      console.log('發送 ATEN TTS 請求:', requestData);

      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // 獲取響應頭信息
        const headers = response.headers;
        setAudioInfo({
          service: headers.get('X-Service'),
          duration: headers.get('X-Duration'),
          filename: headers.get('X-Filename'),
          audioPath: headers.get('X-Audio-Path')
        });

        toast({
          title: "語音合成成功",
          description: `使用 ATEN ${selectedVoice || '默認聲優'} 合成完成`,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || '語音合成失敗');
      }
    } catch (error) {
      console.error('ATEN TTS 語音合成失敗:', error);
      toast({
        title: "語音合成失敗",
        description: error instanceof Error ? error.message : '未知錯誤',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 播放音頻
  const playAudio = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play();
    }
  };

  // 下載音頻
  const downloadAudio = () => {
    if (audioUrl && audioInfo?.filename) {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = audioInfo.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // 更新語音配置 - 保留給 checkbox 使用
  const updateVoiceConfig = (key: keyof VoiceConfig, value: any) => {
    setVoiceConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 獨立的滑桿處理函數
  const handlePitchChange = React.useCallback(([value]: number[]) => {
    setVoiceConfig(prev => ({ ...prev, pitch: value }));
  }, []);

  const handleRateChange = React.useCallback(([value]: number[]) => {
    setVoiceConfig(prev => ({ ...prev, rate: value }));
  }, []);

  const handleVolumeChange = React.useCallback(([value]: number[]) => {
    setVoiceConfig(prev => ({ ...prev, volume: value }));
  }, []);

  const handleSilenceScaleChange = React.useCallback(([value]: number[]) => {
    setVoiceConfig(prev => ({ ...prev, silence_scale: value }));
  }, []);

  // 聲音試聽功能 - 優先使用 ATEN 提供的預設試聽音頻（不消耗 token）
  const previewVoice = async () => {
    if (!selectedVoice) {
      toast({
        title: "請選擇聲優",
        description: "請先選擇要試聽的聲優",
        variant: "destructive",
      });
      return;
    }

    setIsPreviewLoading(true);
    setPreviewAudioUrl(null);

    try {
      // 找到選中聲優的資料
      const selectedVoiceData = voices.find(voice => voice.model_id === selectedVoice);
      
      if (selectedVoiceData?.sample_audio_path) {
        // 使用 ATEN 提供的預設試聽音頻（免費，不消耗 API token）
        setPreviewAudioUrl(selectedVoiceData.sample_audio_path);
        
        toast({
          title: "試聽準備完成",
          description: `${selectedVoiceData.name} 官方試聽音頻已載入（免費）`,
        });

        // 自動播放試聽
        setTimeout(() => {
          if (previewAudioRef.current) {
            previewAudioRef.current.play();
          }
        }, 100);
      } else {
        // 如果沒有預設試聽音頻，提示用戶可以生成自定義試聽
        toast({
          title: "無預設試聽音頻",
          description: "此聲優沒有預設試聽音頻，您可以輸入文本後直接生成語音來試聽",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('ATEN 聲音試聽失敗:', error);
      toast({
        title: "試聽失敗",
        description: error instanceof Error ? error.message : '未知錯誤',
        variant: "destructive",
      });
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // 播放試聽音頻
  const playPreview = () => {
    if (previewAudioRef.current && previewAudioUrl) {
      previewAudioRef.current.play();
    }
  };

  React.useEffect(() => {
    loadVoices();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            ATEN AIVoice TTS
          </CardTitle>
          <CardDescription>
            專業級語音合成服務，支援中文、英文、台語，提供多種聲優和精細語音參數調整
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 文本輸入 */}
          <div className="space-y-2">
            <Label htmlFor="text">合成文本</Label>
            <Textarea
              id="text"
              placeholder="請輸入要合成的文本..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <div className="text-sm text-muted-foreground">
              字數: {text.length} | 支援 SSML 標籤
            </div>
          </div>

          {/* 語言和聲優選擇 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>語言</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zh-TW">中文 (繁體)</SelectItem>
                  <SelectItem value="en">英文</SelectItem>
                  <SelectItem value="TL">台語 (中文轉台語)</SelectItem>
                  <SelectItem value="TB">台語</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>ATEN 聲優</Label>
              <div className="flex gap-2">
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="選擇聲優" />
                  </SelectTrigger>
                  <SelectContent>
                    {voices.map((voice) => (
                      <SelectItem key={voice.model_id} value={voice.model_id}>
                        {voice.name || voice.model_id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadVoices}
                  disabled={isLoadingVoices}
                >
                  {isLoadingVoices ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "重新載入"
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={previewVoice}
                  disabled={isPreviewLoading || !selectedVoice}
                  title="試聽聲優"
                >
                  {isPreviewLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Headphones className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                可用聲優: {voices.length} 個 | 點擊耳機圖標免費試聽官方音頻
              </div>
              
              {/* 顯示選中聲優的詳細資訊 */}
              {selectedVoice && voices.length > 0 && (
                <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                  {(() => {
                    const selectedVoiceData = voices.find(voice => voice.model_id === selectedVoice);
                    return selectedVoiceData ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">
                            {selectedVoiceData.name}
                          </span>
                          <div className="flex gap-2 text-xs">
                            {selectedVoiceData.gender && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                {selectedVoiceData.gender}
                              </span>
                            )}
                            {selectedVoiceData.languages && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                                {selectedVoiceData.languages.join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-600">
                          {selectedVoiceData.description}
                        </div>
                        {selectedVoiceData.sample_audio_path && (
                          <div className="text-xs text-green-600">
                            ✓ 支援免費試聽
                          </div>
                        )}
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
              
              {/* 試聽音頻播放器 */}
              {previewAudioUrl && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium text-blue-900">聲優試聽</Label>
                    <span className="text-xs text-blue-600">{selectedVoice}</span>
                  </div>
                  <audio
                    ref={previewAudioRef}
                    src={previewAudioUrl}
                    controls
                    className="w-full h-8"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={playPreview}
                    className="w-full mt-2 text-blue-700 hover:text-blue-900"
                  >
                    <Play className="mr-2 h-3 w-3" />
                    重新播放試聽
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* ATEN 進階設定 */}
          <div className="space-y-3">
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  ATEN 進階語音設定
                  {showAdvanced ? " (已展開)" : " (點擊展開)"}
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
                          {voiceConfig.pitch > 0 ? '+' : ''}{voiceConfig.pitch.toFixed(1)}st
                        </span>
                      </div>
                      <Slider
                        value={[voiceConfig.pitch]}
                        onValueChange={handlePitchChange}
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
                          {voiceConfig.rate.toFixed(1)}x
                        </span>
                      </div>
                      <Slider
                        value={[voiceConfig.rate]}
                        onValueChange={handleRateChange}
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
                          {voiceConfig.volume > 0 ? '+' : ''}{voiceConfig.volume.toFixed(1)}dB
                        </span>
                      </div>
                      <Slider
                        value={[voiceConfig.volume]}
                        onValueChange={handleVolumeChange}
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
                          {voiceConfig.silence_scale.toFixed(1)}x
                        </span>
                      </div>
                      <Slider
                        value={[voiceConfig.silence_scale]}
                        onValueChange={handleSilenceScaleChange}
                        min={0.8}
                        max={1.2}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="text-xs text-muted-foreground">
                        調整注音符號停頓時間 (0.8x ~ 1.2x)
                      </div>
                    </div>
                  </div>

                  {/* 進階功能選項 */}
                  <div className="space-y-3 pt-4 border-t border-gray-300">
                    <Label className="text-sm font-medium">進階功能</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="use_custom_poly"
                        checked={voiceConfig.use_custom_poly}
                        onChange={(e) => updateVoiceConfig('use_custom_poly', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="use_custom_poly" className="text-sm">
                        使用自定義多音字字典
                      </Label>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      啟用後將使用您在 ATEN 網頁設定的自定義多音字字典表
                    </div>
                  </div>

                  {/* 參數重置 */}
                  <div className="pt-4 border-t border-gray-300">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setVoiceConfig({
                        pitch: 0,
                        rate: 1.0,
                        volume: 0,
                        silence_scale: 1.0,
                        use_custom_poly: false
                      })}
                      className="w-full"
                    >
                      重置為預設值
                    </Button>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* 生成按鈕 */}
          <Button
            onClick={generateSpeech}
            disabled={isLoading || !text.trim()}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ATEN 合成中...
              </>
            ) : (
              <>
                <Volume2 className="mr-2 h-4 w-4" />
                生成語音
              </>
            )}
          </Button>

          {/* 音頻播放器 */}
          {audioUrl && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>ATEN 生成的音頻</Label>
                    {audioInfo && (
                      <div className="text-sm text-muted-foreground">
                        時長: {audioInfo.duration ? `${parseFloat(audioInfo.duration).toFixed(1)}s` : 'N/A'}
                      </div>
                    )}
                  </div>
                  
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    controls
                    className="w-full"
                  />
                  
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={playAudio} className="flex-1">
                      <Play className="mr-2 h-4 w-4" />
                      播放
                    </Button>
                    <Button variant="outline" onClick={downloadAudio} className="flex-1">
                      <Download className="mr-2 h-4 w-4" />
                      下載
                    </Button>
                  </div>

                  {audioInfo && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>服務: ATEN AIVoice ({audioInfo.service})</div>
                      <div>檔名: {audioInfo.filename}</div>
                      {audioInfo.audioPath && (
                        <div>路徑: {audioInfo.audioPath}</div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* SSML 說明 */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">SSML 支援</Label>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>• 支援完整的 SSML 標籤：&lt;speak&gt;, &lt;voice&gt;, &lt;prosody&gt;, &lt;break&gt;, &lt;phoneme&gt;, &lt;lang&gt;, &lt;say-as&gt;</div>
                  <div>• 自動轉義特殊字符：" &amp; ' &lt; &gt;</div>
                  <div>• 範例：在文本中使用 &lt;break time="500ms"/&gt; 插入停頓</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
