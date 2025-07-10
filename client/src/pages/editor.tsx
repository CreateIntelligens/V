import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { AudioPlayer } from "@/components/audio-player";
import { VideoModal } from "@/components/video-modal";
import { MicOff, Video, Download, Users, Play, Settings, Zap, Expand, User, Loader2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/user-context";
import type { Model, InsertGeneratedContent } from "@shared/schema";
import { VoiceSettings } from "@/components/tts/voice-settings";
import { VoiceSynthesisPanel } from "@/components/tts/voice-synthesis-panel";
import { GenerationPanel } from "@/components/generation-panel";

export default function VideoEditor() {
  const [inputText, setInputText] = useState("");
  const [selectedCharacterModelId, setSelectedCharacterModelId] = useState<string>("");
  const [emotion, setEmotion] = useState("neutral");
  const [voiceGenerationType, setVoiceGenerationType] = useState<"basic_tts" | "voice_model">("basic_tts");
  const [selectedTTSProvider, setSelectedTTSProvider] = useState("edgetts");
  const [selectedTTSModel, setSelectedTTSModel] = useState("zh-CN-XiaoxiaoNeural"); // 設置預設聲音
  const [referenceAudio, setReferenceAudio] = useState<File | null>(null);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(() => {
    const saved = sessionStorage.getItem('generatedAudio');
    return saved || null;
  });
  const [generatedAudioId, setGeneratedAudioId] = useState<string | null>(() => {
    const saved = sessionStorage.getItem('generatedAudioId');
    return saved || null;
  });
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(() => {
    const saved = sessionStorage.getItem('generatedVideo');
    return saved || null;
  });
  const [generatedVideoId, setGeneratedVideoId] = useState<string | null>(() => {
    const saved = sessionStorage.getItem('generatedVideoId');
    return saved || null;
  });
  const [selectedVoiceModelId, setSelectedVoiceModelId] = useState<string>("");
  const [selectedGeneratedAudioId, setSelectedGeneratedAudioId] = useState<string>("");

  // VoAI 進階設定狀態
  const [showVoAIAdvanced, setShowVoAIAdvanced] = useState(false);
  const [voaiModel, setVoaiModel] = useState("Neo");
  const [voaiStyle, setVoaiStyle] = useState("預設");
  const [voaiSpeed, setVoaiSpeed] = useState([1.0]);
  const [voaiPitch, setVoaiPitch] = useState([0]);

  // MiniMax 進階設定狀態
  const [showMinimaxAdvanced, setShowMinimaxAdvanced] = useState(false);
  const [minimaxEmotion, setMinimaxEmotion] = useState("neutral");
  const [minimaxVolume, setMinimaxVolume] = useState([1.0]);
  const [minimaxSpeed, setMinimaxSpeed] = useState([1.0]);
  const [minimaxPitch, setMinimaxPitch] = useState([0]);

  // ATEN 進階設定狀態
  const [showATENAdvanced, setShowATENAdvanced] = useState(false);
  const [atenPitch, setAtenPitch] = useState([0]);
  const [atenRate, setAtenRate] = useState([1.0]);
  const [atenVolume, setAtenVolume] = useState([0]);
  const [atenSilenceScale, setAtenSilenceScale] = useState([1.0]);

  const [videoModalOpen, setVideoModalOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentUser } = useUser();

  // 監聽頁面刷新時清除 sessionStorage（這樣刷新後會清除狀態）
  useEffect(() => {
    const handleBeforeUnload = () => {
      // 只有在真正刷新頁面時才清除，而不是切換頁面
      if (performance.navigation.type === performance.navigation.TYPE_RELOAD) {
        sessionStorage.removeItem('generatedVideo');
        sessionStorage.removeItem('generatedVideoId');
        sessionStorage.removeItem('generatedAudio');
        sessionStorage.removeItem('generatedAudioId');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // 分享/取消分享
  const toggleShareMutation = useMutation({
    mutationFn: async ({ id, isShared }: { id: string; isShared: boolean }) => {
      const response = await apiRequest("PATCH", `/api/content/${id}/favorite`, { 
        isFavorite: isShared, // 後端還是用 isFavorite 欄位，但語義是分享
        userId: currentUser?.username
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      toast({
        title: "操作成功",
        description: data.data.isFavorite ? "已分享給所有人" : "已取消分享",
      });
    },
    onError: () => {
      toast({
        title: "操作失敗",
        description: "請稍後重試",
        variant: "destructive",
      });
    },
  });

  const { data: modelsResponse } = useQuery({
    queryKey: ["/api/models", currentUser?.username],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (currentUser?.username) params.append("userId", currentUser.username);
      const response = await apiRequest("GET", `/api/models?${params.toString()}`);
      return response.json();
    },
  });

  const models = modelsResponse?.data?.list || [];
  const characterModels = models.filter((m: Model) => m.type === "character" && m.status === "ready");
  const voiceModels = models.filter((m: Model) => m.type === "voice" && m.status === "ready");

  // 預設選擇第一個可用的角色模特
  useEffect(() => {
    if (!selectedCharacterModelId && characterModels.length > 0) {
      setSelectedCharacterModelId(characterModels[0].id.toString());
    }
  }, [characterModels, selectedCharacterModelId]);

  // 預設選擇第一個可用的語音模型
  useEffect(() => {
    if (!selectedVoiceModelId && voiceModels.length > 0) {
      setSelectedVoiceModelId(voiceModels[0].id.toString());
    }
  }, [voiceModels, selectedVoiceModelId]);

  // TTS 提供商 (已更新 - 20250709) - 移除 MiniMax 和 FishTTS
  const ttsProviders = [
    { id: "edgetts", name: "EdgeTTS (微軟)", description: "免費，多語言支援" },
    // { id: "minimax", name: "MiniMax", description: "付費，高品質中文，支援情緒控制" }, // 暫時移除：API 過期
    { id: "aten", name: "ATEN AIVoice", description: "專業級語音合成，支援中文、英文、台語" },
    { id: "voai", name: "VoAI (網際智慧)", description: "台灣高品質中文語音，支援多種風格" },
    // { id: "fishtts", name: "FishTTS", description: "開源，可自訓練" }, // 暫時移除：未完成測試
  ];

  // 動態獲取的 TTS 聲音選項
  const { data: ttsVoicesData, isLoading: voicesLoading } = useQuery({
    queryKey: ["tts-voices"],
    queryFn: async () => {
      // 獲取 EdgeTTS 聲音列表
      const edgeResponse = await fetch("/api/tts/services/service1/info");
      const edgeData = await edgeResponse.json();
      
      // 獲取 VoAI 聲音列表
      const voaiResponse = await fetch("/api/tts/services/service6/info");
      const voaiData = await voaiResponse.json();
      
      return {
        edgetts: [
          // 中文聲音
          { id: "zh-CN-XiaoxiaoNeural", name: "曉曉 (溫柔女聲)", language: "zh-CN", gender: "Female" },
          { id: "zh-CN-YunxiNeural", name: "雲希 (活潑男聲)", language: "zh-CN", gender: "Male" },
          { id: "zh-CN-XiaoyiNeural", name: "曉伊 (甜美女聲)", language: "zh-CN", gender: "Female" },
          { id: "zh-CN-YunjianNeural", name: "雲健 (沉穩男聲)", language: "zh-CN", gender: "Male" },
          { id: "zh-CN-YunyangNeural", name: "雲揚 (年輕男聲)", language: "zh-CN", gender: "Male" },
          { id: "zh-CN-YunxiaNeural", name: "雲夏 (清朗男聲)", language: "zh-CN", gender: "Male" },
          { id: "zh-TW-HsiaoChenNeural", name: "曉臻 (台灣女聲)", language: "zh-TW", gender: "Female" },
          { id: "zh-TW-YunJheNeural", name: "雲哲 (台灣男聲)", language: "zh-TW", gender: "Male" },
          { id: "zh-TW-HsiaoYuNeural", name: "曉雨 (台語女聲)", language: "zh-TW", gender: "Female" },
          { id: "zh-HK-HiuMaanNeural", name: "曉曼 (香港女聲)", language: "zh-HK", gender: "Female" },
          { id: "zh-HK-WanLungNeural", name: "雲龍 (香港男聲)", language: "zh-HK", gender: "Male" },
          { id: "zh-CN-liaoning-XiaobeiNeural", name: "曉北 (東北女聲)", language: "zh-CN", gender: "Female" },
          { id: "zh-CN-shaanxi-XiaoniNeural", name: "曉妮 (陝西女聲)", language: "zh-CN", gender: "Female" },
          // 英文聲音
          { id: "en-US-AriaNeural", name: "Aria (美式女聲)", language: "en-US", gender: "Female" },
          { id: "en-US-DavisNeural", name: "Davis (美式男聲)", language: "en-US", gender: "Male" },
          { id: "en-US-GuyNeural", name: "Guy (美式男聲)", language: "en-US", gender: "Male" },
          { id: "en-US-JennyNeural", name: "Jenny (美式女聲)", language: "en-US", gender: "Female" },
          { id: "en-US-JasonNeural", name: "Jason (美式男聲)", language: "en-US", gender: "Male" },
        ],
        voai: [
          // 精選主要角色 (可在進階選項中調整風格和模型)
          { id: "佑希", name: "佑希", speaker: "佑希", language: "zh-TW", gender: "男聲" },
          { id: "雨榛", name: "雨榛", speaker: "雨榛", language: "zh-TW", gender: "女聲" },
          { id: "子墨", name: "子墨", speaker: "子墨", language: "zh-TW", gender: "男聲" },
          { id: "采芸", name: "采芸", speaker: "采芸", language: "zh-TW", gender: "女聲" },
          { id: "昊宇", name: "昊宇", speaker: "昊宇", language: "zh-TW", gender: "男聲" },
          { id: "柔洢", name: "柔洢", speaker: "柔洢", language: "zh-TW", gender: "女聲" },
          { id: "竹均", name: "竹均", speaker: "竹均", language: "zh-TW", gender: "女聲" },
          { id: "汪一誠", name: "汪一誠", speaker: "汪一誠", language: "zh-TW", gender: "男聲" },
          { id: "李晴", name: "李晴", speaker: "李晴", language: "zh-TW", gender: "女聲" },
          { id: "春枝", name: "春枝", speaker: "春枝", language: "zh-TW", gender: "女聲" },
          { id: "婉婷", name: "婉婷", speaker: "婉婷", language: "zh-TW", gender: "女聲" },
          { id: "淑芬", name: "淑芬", speaker: "淑芬", language: "zh-TW", gender: "女聲" },
          { id: "璦廷", name: "璦廷", speaker: "璦廷", language: "zh-TW", gender: "女聲" },
          { id: "楷心", name: "楷心", speaker: "楷心", language: "zh-TW", gender: "女聲" },
          { id: "美霞", name: "美霞", speaker: "美霞", language: "zh-TW", gender: "女聲" },
          { id: "惠婷", name: "惠婷", speaker: "惠婷", language: "zh-TW", gender: "女聲" },
          { id: "語安", name: "語安", speaker: "語安", language: "zh-TW", gender: "女聲" },
          { id: "虹葳", name: "虹葳", speaker: "虹葳", language: "zh-TW", gender: "女聲" },
          { id: "欣妤", name: "欣妤", speaker: "欣妤", language: "zh-TW", gender: "女聲" },
          { id: "柏翰", name: "柏翰", speaker: "柏翰", language: "zh-TW", gender: "男聲" },
          { id: "凡萱", name: "凡萱", speaker: "凡萱", language: "zh-TW", gender: "女聲" },
          { id: "韻菲", name: "韻菲", speaker: "韻菲", language: "zh-TW", gender: "女聲" },
          { id: "士倫", name: "士倫", speaker: "士倫", language: "zh-TW", gender: "男聲" },
          { id: "袁祺裕", name: "袁祺裕", speaker: "袁祺裕", language: "zh-TW", gender: "男聲" },
          { id: "皓軒", name: "皓軒", speaker: "皓軒", language: "zh-TW", gender: "男聲" },
          { id: "靜芝", name: "靜芝", speaker: "靜芝", language: "zh-TW", gender: "女聲" },
          { id: "渝函", name: "渝函", speaker: "渝函", language: "zh-TW", gender: "女聲" },
          { id: "娜娜", name: "娜娜", speaker: "娜娜", language: "zh-TW", gender: "女聲" },
          { id: "文澤", name: "文澤", speaker: "文澤", language: "zh-TW", gender: "男聲" },
          { id: "諭書", name: "諭書", speaker: "諭書", language: "zh-TW", gender: "男聲" },
          { id: "鳳姊", name: "鳳姊", speaker: "鳳姊", language: "zh-TW", gender: "女聲" },
          { id: "悅青", name: "悅青", speaker: "悅青", language: "zh-TW", gender: "女聲" },
          { id: "俊傑", name: "俊傑", speaker: "俊傑", language: "zh-TW", gender: "男聲" },
          { id: "詠芯", name: "詠芯", speaker: "詠芯", language: "zh-TW", gender: "女聲" },
          { id: "建忠", name: "建忠", speaker: "建忠", language: "zh-TW", gender: "男聲" },
          { id: "德仔", name: "德仔", speaker: "德仔", language: "zh-TW", gender: "未知" },
        ],
        // minimax: [
        //   { id: "moss_audio_069e7ef7-45ab-11f0-b24c-2e48b7cbf811", name: "小安 (女)", language: "zh-CN" },
        //   { id: "moss_audio_e2651ab2-50e2-11f0-8bff-3ee21232901d", name: "小賴 (男)", language: "zh-CN" },
        //   { id: "moss_audio_9e3d9106-42a6-11f0-b6c4-9e15325fe584", name: "Hayley (女)", language: "zh-CN" },
        // ],
        aten: [
          // 男聲聲優
          { id: "Aaron", name: "沉穩男聲-裕祥", language: "zh-TW" },
          { id: "Shawn", name: "斯文男聲-俊昇", language: "zh-TW" },
          { id: "Jason", name: "自在男聲-展河", language: "zh-TW" },
          { id: "Winston_narrative", name: "悠然男聲-展揚", language: "zh-TW" },
          { id: "Alan_colloquial", name: "穩健男聲-展仁", language: "zh-TW" },
          { id: "Waldo_Ad", name: "廣告男聲-展龍", language: "zh-TW" },
          { id: "Bill_cheerful", name: "活力男聲-力晨", language: "zh-TW" },
          { id: "Eason_broadcast", name: "廣播男聲-展宏", language: "zh-TW" },
          
          // 女聲聲優
          { id: "Bella_host", name: "動人女聲-貝拉", language: "zh-TW" },
          { id: "Bella_vivid", name: "開朗女聲-貝拉", language: "zh-TW" },
          { id: "Rena", name: "溫和女聲-思柔", language: "zh-TW" },
          { id: "Hannah_colloquial", name: "自在女聲-思涵", language: "zh-TW" },
          { id: "Michelle_colloquial", name: "悠然女聲-思婷", language: "zh-TW" },
          { id: "Celia_call_center", name: "客服女聲-思琪", language: "zh-TW" },
          { id: "Hannah_news", name: "知性女聲-思涵", language: "zh-TW" },
          { id: "Aurora", name: "穩重女聲-嘉妮", language: "zh-TW" },
          
          // 台語聲優
          { id: "Easton_news", name: "台語男聲-文雄", language: "TL" },
          { id: "Raina_narrative", name: "台語女聲-思羽", language: "TL" },
          { id: "Winston_narrative_taigi", name: "台語悠然男聲-展揚", language: "TL" },
          { id: "Celia_call_center_taigi", name: "台語客服女聲-思琪", language: "TL" },
        ],
        // fishtts: [
        //   { id: "default", name: "預設聲音", language: "zh-CN" },
        // ],
      };
    },
    staleTime: 5 * 60 * 1000, // 5分鐘
  });

  // 使用動態獲取的聲音數據，如果沒有則使用空對象
  const ttsVoices = ttsVoicesData || {};

  // 確保在 TTS 提供商變更時設定正確的預設聲音
  useEffect(() => {
    if (selectedTTSProvider && ttsVoices[selectedTTSProvider as keyof typeof ttsVoices] && 
        !selectedTTSModel) {
      const defaultVoice = ttsVoices[selectedTTSProvider as keyof typeof ttsVoices]?.[0]?.id;
      if (defaultVoice) {
        setSelectedTTSModel(defaultVoice);
      }
    }
  }, [selectedTTSProvider, ttsVoices, selectedTTSModel]);

  // MiniMax 情緒選項 (已註解 - 服務暫時移除)
  // const minimaxEmotions = [
  //   { id: "neutral", name: "中性" },
  //   { id: "happy", name: "開心" },
  //   { id: "sad", name: "悲傷" },
  //   { id: "angry", name: "憤怒" },
  //   { id: "surprised", name: "驚訝" },
  //   { id: "calm", name: "平靜" },
  // ];
  
  // 保留 MiniMax 情緒選項供未來使用
  const minimaxEmotions = [
    { id: "neutral", name: "中性" },
    { id: "happy", name: "開心" },
    { id: "sad", name: "悲傷" },
    { id: "angry", name: "憤怒" },
    { id: "surprised", name: "驚訝" },
    { id: "calm", name: "平靜" },
  ];

  const generateAudioMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/generate/audio", data);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratingAudio(true);
      setAudioProgress(0);
      // 清除之前的音頻狀態
      setGeneratedAudio(null);
      setGeneratedAudioId(null);
      sessionStorage.removeItem('generatedAudio');
      sessionStorage.removeItem('generatedAudioId');

      const interval = setInterval(() => {
        setAudioProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setGeneratingAudio(false);
            // 防護性檢查：確保 data.data 存在
            if (data?.data?.audioUrl) {
              setGeneratedAudio(data.data.audioUrl);
              setGeneratedAudioId(data.data.id);
              // 保存到 sessionStorage
              sessionStorage.setItem('generatedAudio', data.data.audioUrl);
              sessionStorage.setItem('generatedAudioId', data.data.id);
              toast({
                title: "語音生成完成",
                description: "您的語音內容已準備好",
              });
            } else {
              toast({
                title: "語音生成失敗",
                description: "回應格式錯誤，請稍後重試",
                variant: "destructive",
              });
            }
            return 100;
          }
          return prev + 10;
        });
      }, 300);

      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
    },
    onError: () => {
      toast({
        title: "生成失敗",
        description: "請稍後重試",
        variant: "destructive",
      });
      setGeneratingAudio(false);
    },
  });

  const generateVideoMutation = useMutation({
    mutationFn: async (data: InsertGeneratedContent) => {
      const response = await apiRequest("POST", "/api/generate/video", data);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratingVideo(true);
      setVideoProgress(0);
      // 清除之前的影片狀態
      setGeneratedVideo(null);
      setGeneratedVideoId(null);
      sessionStorage.removeItem('generatedVideo');
      sessionStorage.removeItem('generatedVideoId');

      const taskCode = data.data.taskCode;
      console.log(`🎬 開始監控影片生成進度: ${taskCode}`);

      // 真正的進度追蹤 - 增加重試計數和更長的等待時間
      let retryCount = 0;
      const maxRetries = 60; // 最多重試 60 次 (約 5 分鐘)
      
      const checkProgress = async () => {
        try {
          const statusResponse = await apiRequest("GET", `/api/video/query?code=${taskCode}`);
          const statusData = await statusResponse.json();

          console.log(`Face2Face 回應 (重試 ${retryCount}/${maxRetries}):`, statusData);

          // Face2Face 容器的回應格式: { code: 10000, data: {...}, msg: "...", success: true }
          if (statusData.code === 10000) {
            const data = statusData.data;
            const status = data.status;
            const progress = data.progress || 0;

            setVideoProgress(progress);
            retryCount = 0; // 重置重試計數

            if (status === 2 && data.result) {
              // 影片生成完成 (status === 2 表示完成)
              setGeneratingVideo(false);
              setVideoProgress(100);
              const videoUrl = data.video_url || `/videos/${data.result}`;
              setGeneratedVideo(videoUrl);
              setGeneratedVideoId(taskCode);
              // 保存到 sessionStorage
              sessionStorage.setItem('generatedVideo', videoUrl);
              sessionStorage.setItem('generatedVideoId', taskCode);
              toast({
                title: "影片生成完成",
                description: "您的 AI 影片已準備好",
              });
              queryClient.invalidateQueries({ queryKey: ["/api/content"] });
              return; // 停止檢查
            } else if (status === 'failed' || status === -1) {
              // 影片生成失敗
              setGeneratingVideo(false);
              toast({
                title: "影片生成失敗",
                description: "請稍後重試",
                variant: "destructive",
              });
              return; // 停止檢查
            }

            // 繼續檢查進度
            setTimeout(checkProgress, 3000); // 3 秒後再次檢查
          } else if (statusData.code === 10004) {
            // 任務不存在，可能已完成或還在處理中
            retryCount++;
            console.log(`任務暫時查不到 (重試 ${retryCount}/${maxRetries})，可能還在處理中...`);
            
            // 檢查是否超過最大重試次數
            if (retryCount >= maxRetries) {
              console.log('達到最大重試次數，檢查資料庫狀態...');
              
              try {
                // 從 taskCode 提取內容 ID
                const contentIdMatch = taskCode.match(/task_(\d+)_/);
                if (contentIdMatch) {
                  const contentId = contentIdMatch[1];
                  
                  // 檢查資料庫中的內容狀態
                  const contentResponse = await apiRequest("GET", `/api/content/${contentId}`);
                  const contentData = await contentResponse.json();
                  
                  if (contentData.success && contentData.data.status === "completed") {
                    // 任務已在資料庫中標記為完成
                    setGeneratingVideo(false);
                    setVideoProgress(100);
                    setGeneratedVideo(contentData.data.outputPath);
                    setGeneratedVideoId(contentData.data.id);
                    // 保存到 sessionStorage
                    sessionStorage.setItem('generatedVideo', contentData.data.outputPath);
                    sessionStorage.setItem('generatedVideoId', contentData.data.id);
                    toast({
                      title: "影片生成完成",
                      description: "您的 AI 影片已準備好",
                    });
                    queryClient.invalidateQueries({ queryKey: ["/api/content"] });
                    return;
                  } else if (contentData.data.status === "failed") {
                    // 任務失敗
                    setGeneratingVideo(false);
                    toast({
                      title: "影片生成失敗",
                      description: "請稍後重試",
                      variant: "destructive",
                    });
                    return;
                  }
                }
              } catch (error) {
                console.error('檢查資料庫狀態失敗:', error);
              }
              
              // 如果資料庫中還是 processing 狀態，停止監控
              setGeneratingVideo(false);
              toast({
                title: "監控超時",
                description: "影片可能還在生成中，請稍後到作品管理查看",
                variant: "destructive",
              });
              return;
            }
            
            // 繼續嘗試，但間隔時間更長
            setTimeout(checkProgress, 5000); // 5 秒後再次檢查
          } else {
            // 其他錯誤，繼續嘗試
            retryCount++;
            console.log(`查詢失敗 (重試 ${retryCount}/${maxRetries}):`, statusData.msg);
            
            if (retryCount >= maxRetries) {
              setGeneratingVideo(false);
              toast({
                title: "監控超時",
                description: "無法獲取影片生成狀態，請稍後到作品管理查看",
                variant: "destructive",
              });
              return;
            }
            
            setTimeout(checkProgress, 5000); // 5 秒後再次檢查
          }
        } catch (error) {
          retryCount++;
          console.error(`檢查影片生成進度失敗 (重試 ${retryCount}/${maxRetries}):`, error);
          
          if (retryCount >= maxRetries) {
            setGeneratingVideo(false);
            toast({
              title: "監控超時",
              description: "網路連接問題，請稍後到作品管理查看",
              variant: "destructive",
            });
            return;
          }
          
          // 繼續嘗試
          setTimeout(checkProgress, 5000); // 5 秒後再次檢查
        }
      };

      // 開始檢查進度
      setTimeout(checkProgress, 5000); // 5 秒後開始第一次檢查

      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
    },
    onError: () => {
      toast({
        title: "生成失敗",
        description: "請稍後重試",
        variant: "destructive",
      });
      setGeneratingVideo(false);
    },
  });

  const handleGenerateAudio = () => {
    if (!inputText && voiceGenerationType === "basic_tts") {
      toast({
        title: "請輸入文本",
        description: "TTS 生成需要輸入文本內容",
        variant: "destructive",
      });
      return;
    }

    if (voiceGenerationType === "voice_model" && selectedTTSModel === "upload_new" && !referenceAudio) {
      toast({
        title: "請上傳參考音頻",
        description: "上傳音頻需要上傳音頻文件",
        variant: "destructive",
      });
      return;
    }

    generateAudioMutation.mutate({
      inputText: voiceGenerationType === "basic_tts" ? inputText : "",
      emotion,
      type: "audio",
      voiceSource: voiceGenerationType === "basic_tts" ? "default" : (selectedTTSModel === "upload_new" ? "reference" : "model"),
      provider: selectedTTSProvider,
      ttsModel: selectedTTSModel,
      referenceAudio: referenceAudio,
      userId: currentUser?.username, // 確保音頻歸屬於當前用戶
    });
  };

  const handleGenerateVideo = () => {
    if (!selectedCharacterModelId) {
      toast({
        title: "請選擇人物形象",
        description: "影片生成需要選擇人物形象",
        variant: "destructive",
      });
      return;
    }

    if (!inputText && voiceGenerationType === "basic_tts") {
      toast({
        title: "請輸入文本",
        description: "TTS 生成需要輸入文本內容",
        variant: "destructive",
      });
      return;
    }

    if (voiceGenerationType === "voice_model" && selectedTTSModel === "upload_new" && !referenceAudio) {
      toast({
        title: "請上傳參考音頻",
        description: "上傳音頻需要上傳音頻文件",
        variant: "destructive",
      });
      return;
    }

    const videoData: any = {
      modelId: parseInt(selectedCharacterModelId), // 轉換為數字
      inputText: voiceGenerationType === "basic_tts" ? inputText : "",
      emotion,
      type: "video",
      voiceSource: voiceGenerationType === "basic_tts" ? "default" : (selectedTTSModel === "upload_new" ? "reference" : "model"),
      provider: selectedTTSProvider,
      ttsModel: selectedTTSModel,
      userId: currentUser?.username, // 確保影片歸屬於當前用戶
    };

    // 如果有參考音頻，添加到數據中
    if (referenceAudio) {
      videoData.referenceAudio = referenceAudio;
    }

    generateVideoMutation.mutate(videoData);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">影音生成器</h1>
        <p className="text-gray-600">使用AI模特創建專業的影片和語音內容</p>
      </div>

      <Tabs defaultValue="tts-generator" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tts-generator" className="flex items-center gap-2">
            <MicOff className="h-4 w-4" />
            語音生成器
          </TabsTrigger>
          <TabsTrigger value="video-generator" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            影片生成器
          </TabsTrigger>
        </TabsList>

        {/* 語音生成器 */}
        <TabsContent value="tts-generator" className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <MicOff className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">🎤 語音生成器</h3>
            </div>
            <p className="text-gray-600 text-sm">
              使用多種 TTS 服務將文字轉換為自然語音，支援語速、音調等細節調整
            </p>
          </div>

          <VoiceSynthesisPanel
            voiceGenerationType="basic_tts"
            setVoiceGenerationType={() => {}} // 固定為 basic_tts
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
            generatingAudio={generatingAudio}
            audioProgress={audioProgress}
            generatedAudio={generatedAudio}
            onGenerateAudio={handleGenerateAudio}
            showVoiceTypeSelector={false}
            showTextInput={true}
            compact={false}
          />
        </TabsContent>

        {/* 影片生成器 */}
        <TabsContent value="video-generator" className="space-y-6">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Video className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">🎬 影片生成器</h3>
            </div>
            <p className="text-gray-600 text-sm">
              結合人物形象與語音合成，創建個性化的數位人影片內容
            </p>
          </div>

          {/* 步驟 1: 選擇人物模型 */}
          <Card className="shadow-sm border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">1</span>
                </div>
                <Label className="text-lg font-semibold text-gray-900">選擇人物模型</Label>
              </div>
              
              <Select value={selectedCharacterModelId} onValueChange={setSelectedCharacterModelId}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="選擇要生成影片的人物形象" />
                </SelectTrigger>
                <SelectContent>
                  {characterModels.map((model: Model) => (
                    <SelectItem key={model.id} value={model.id.toString()}>
                      <div className="flex items-center space-x-3 w-full py-1">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{model.name}</div>
                          <div className="text-xs text-gray-500">數位人模型</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-2">
                💡 選擇一個人物模型作為影片主角
              </p>
            </CardContent>
          </Card>

          {/* 步驟 2: 配置語音來源 */}
          <Card className="shadow-sm border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold text-sm">2</span>
                </div>
                <Label className="text-lg font-semibold text-gray-900">配置語音來源</Label>
              </div>

              {/* 語音來源選擇 */}
              <div className="mb-6">
                <Label className="text-sm font-medium text-gray-700 mb-3 block">選擇語音生成方式</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card
                    className={`cursor-pointer transition-all ${
                      voiceGenerationType === "basic_tts"
                        ? "ring-2 ring-primary border-primary bg-primary/5"
                        : "hover:shadow-md hover:bg-gray-50"
                    }`}
                    onClick={() => setVoiceGenerationType("basic_tts")}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <MicOff className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">使用 TTS 服務</h4>
                          <p className="text-xs text-gray-600 mt-1">輸入文字，AI 自動轉換成語音</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card
                    className={`cursor-pointer transition-all ${
                      voiceGenerationType === "voice_model"
                        ? "ring-2 ring-primary border-primary bg-primary/5"
                        : "hover:shadow-md hover:bg-gray-50"
                    }`}
                    onClick={() => setVoiceGenerationType("voice_model")}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">使用語音資源</h4>
                          <p className="text-xs text-gray-600 mt-1">上傳音檔或使用已儲存的聲音模型</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* 根據選擇顯示對應的配置 */}
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
                showVoiceTypeSelector={false} // 已經在上面顯示選擇了
                showTextInput={voiceGenerationType === "basic_tts"} // 只有 TTS 模式才顯示文字輸入
                compact={false}
              />
            </CardContent>
          </Card>

          {/* 步驟 3: 生成影片 */}
          <Card className="shadow-sm border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-semibold text-sm">3</span>
                </div>
                <Label className="text-lg font-semibold text-gray-900">生成影片</Label>
              </div>
              
              <Button 
                onClick={handleGenerateVideo}
                disabled={generatingVideo || generateVideoMutation.isPending || !selectedCharacterModelId}
                size="lg"
                className="w-full h-12 text-base"
              >
                {generatingVideo ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Video className="h-5 w-5 mr-2" />
                    🎬 開始生成數位人影片
                  </>
                )}
              </Button>
              
              {generatingVideo && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>生成進度</span>
                    <span>{videoProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${videoProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    正在合成人物形象和語音，預計需要 2-5 分鐘...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 步驟 4: 影片預覽 */}
          {generatedVideo && (
            <Card className="shadow-sm border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-blue-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-semibold text-sm">4</span>
                  </div>
                  <Label className="text-lg font-semibold text-gray-900">🎬 影片預覽與下載</Label>
                </div>
                
                <div className="space-y-4">
                  <video
                    src={generatedVideo}
                    controls
                    className="w-full max-w-lg mx-auto rounded-lg shadow-md"
                    onError={(e) => {
                      console.error('影片載入失敗:', e);
                      toast({
                        title: "影片載入失敗",
                        description: "請檢查影片檔案是否存在",
                        variant: "destructive",
                      });
                    }}
                  >
                    您的瀏覽器不支援影片播放
                  </video>
                  
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" size="sm" asChild>
                      <a href={generatedVideo} download>
                        <Download className="h-4 w-4 mr-2" />
                        下載影片
                      </a>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setVideoModalOpen(true)}
                    >
                      <Expand className="h-4 w-4 mr-2" />
                      全螢幕預覽
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>


      </Tabs>

      {/* 影片放大模態框 */}
      {generatedVideo && (
        <VideoModal
          src={generatedVideo}
          title="AI 生成影片預覽"
          isOpen={videoModalOpen}
          onClose={() => setVideoModalOpen(false)}
          onDownload={() => {
            if (generatedVideo) {
              const link = document.createElement('a');
              link.href = generatedVideo;
              link.download = `ai-video-${Date.now()}.mp4`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
          }}
        />
      )}
    </div>
  );
}
