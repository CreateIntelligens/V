import { useState, useRef, useEffect } from "react";
import { Play, Pause, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface AudioPlayerProps {
  src: string;
}

export function AudioPlayer({ src }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  // 檢查 src 是否有效
  if (!src || src === 'undefined' || src === 'null') {
    console.error('AudioPlayer: 接收到無效的 src:', src);
    return (
      <div className="flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded">
        <AlertCircle className="h-4 w-4 text-red-500" />
        <span className="text-sm text-red-700">音頻源無效</span>
        <span className="text-xs text-red-500">接收到的 src: {String(src)}</span>
      </div>
    );
  }

  // 確保使用完整的 URL - 修復相對路徑問題
  const fullAudioUrl = src.startsWith('http') ? src : 
    src.startsWith('blob:') ? src : 
    `${window.location.origin}${src.startsWith('/') ? src : '/' + src}`;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) {
      console.log('AudioPlayer: 無效的音頻源', { audio: !!audio, src });
      return;
    }

    console.log('AudioPlayer: 載入音頻', { src, fullAudioUrl });
    setError(null);
    setIsLoading(true);
    setRetryCount(0); // 重置重試計數

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      setRetryCount(0); // 重置重試計數
      console.log('AudioPlayer: 音頻載入完成', { duration: audio.duration, src });
    };
    
    const handleError = (e: Event) => {
      console.error('AudioPlayer: 音頻載入錯誤', e, { src, retryCount });
      
      // 如果重試次數少於3次，等待2秒後重試
      if (retryCount < 3) {
        console.log(`AudioPlayer: 準備重試 (${retryCount + 1}/3)`, { src });
        setRetryCount(prev => prev + 1);
        
        retryTimeoutRef.current = setTimeout(() => {
          console.log(`AudioPlayer: 執行重試 ${retryCount + 1}`, { src });
          if (audio) {
            audio.load();
          }
        }, 2000);
      } else {
        setError('音頻載入失敗');
        setIsLoading(false);
      }
    };

    const handleCanPlay = () => {
      console.log('AudioPlayer: 音頻可以播放', { src });
      setIsLoading(false);
      setRetryCount(0); // 重置重試計數
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", () => setIsPlaying(false));
    audio.addEventListener("error", handleError);
    audio.addEventListener("canplay", handleCanPlay);

    // 重新載入音頻
    audio.load();

    return () => {
      // 清除重試定時器
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", () => setIsPlaying(false));
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("canplay", handleCanPlay);
    };
  }, [src, fullAudioUrl, retryCount]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = value[0];
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (error) {
    return (
      <div className="flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded">
        <AlertCircle className="h-4 w-4 text-red-500" />
        <span className="text-sm text-red-700">{error}</span>
        <span className="text-xs text-red-500">URL: {src}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-3">
        <Button
          variant="default"
          size="icon"
          className="w-10 h-10 rounded-full"
          onClick={togglePlay}
          disabled={isLoading || error !== null}
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
        
        <div className="flex-1 relative">
          <Slider
            value={[currentTime]}
            onValueChange={handleSeek}
            max={duration || 100}
            step={1}
            className="w-full"
            disabled={isLoading || error !== null}
          />
        </div>
        
        <span className="text-xs text-gray-500 font-mono min-w-[4rem]">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
      
      <div className="text-xs text-gray-400">
        音頻 URL: {src}
      </div>
      
      <audio 
        ref={audioRef} 
        src={fullAudioUrl} 
        preload="metadata"
      />
    </div>
  );
}
