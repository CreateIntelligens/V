import { VoiceSynthesisPanel } from "./voice-synthesis-panel";

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
}: VoiceSettingsProps) {
  return (
    <VoiceSynthesisPanel
      voiceGenerationType={voiceGenerationType}
      setVoiceGenerationType={setVoiceGenerationType}
      inputText={inputText}
      setInputText={setInputText}
      selectedTTSProvider={selectedTTSProvider}
      setSelectedTTSProvider={setSelectedTTSProvider}
      selectedTTSModel={selectedTTSModel}
      setSelectedTTSModel={setSelectedTTSModel}
      referenceAudio={referenceAudio}
      setReferenceAudio={setReferenceAudio}
      ttsProviders={ttsProviders}
      ttsVoices={ttsVoices}
      minimaxEmotions={minimaxEmotions}
      voiceModels={voiceModels}
      showMinimaxAdvanced={showMinimaxAdvanced}
      setShowMinimaxAdvanced={setShowMinimaxAdvanced}
      minimaxEmotion={minimaxEmotion}
      setMinimaxEmotion={setMinimaxEmotion}
      minimaxVolume={minimaxVolume}
      setMinimaxVolume={setMinimaxVolume}
      minimaxSpeed={minimaxSpeed}
      setMinimaxSpeed={setMinimaxSpeed}
      minimaxPitch={minimaxPitch}
      setMinimaxPitch={setMinimaxPitch}
      showATENAdvanced={showATENAdvanced}
      setShowATENAdvanced={setShowATENAdvanced}
      atenPitch={atenPitch}
      setAtenPitch={setAtenPitch}
      atenRate={atenRate}
      setAtenRate={setAtenRate}
      atenVolume={atenVolume}
      setAtenVolume={setAtenVolume}
      atenSilenceScale={atenSilenceScale}
      setAtenSilenceScale={setAtenSilenceScale}
      showVoAIAdvanced={showVoAIAdvanced}
      setShowVoAIAdvanced={setShowVoAIAdvanced}
      voaiModel={voaiModel}
      setVoaiModel={setVoaiModel}
      voaiStyle={voaiStyle}
      setVoaiStyle={setVoaiStyle}
      voaiSpeed={voaiSpeed}
      setVoaiSpeed={setVoaiSpeed}
      voaiPitch={voaiPitch}
      setVoaiPitch={setVoaiPitch}
      showVoiceTypeSelector={true}
      showTextInput={true}
      compact={false}
    />
  );
}