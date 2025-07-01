import { useEffect, useRef } from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoModalProps {
  src: string;
  title?: string;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: () => void;
}

export function VideoModal({ src, title, isOpen, onClose, onDownload }: VideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ') {
        e.preventDefault();
        const video = videoRef.current;
        if (video) {
          if (video.paused) {
            video.play();
          } else {
            video.pause();
          }
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-80"
        onClick={onClose}
      />
      
      {/* 影片容器 */}
      <div className="relative w-full h-full max-w-6xl max-h-[90vh] m-4">
        {/* 頂部工具列 */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-medium truncate">
              {title || '影片預覽'}
            </h3>
            <div className="flex items-center space-x-2">
              {onDownload && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDownload}
                  className="text-white hover:bg-white/20"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* 影片播放器 */}
        <video
          ref={videoRef}
          src={src}
          controls
          autoPlay
          className="w-full h-full object-contain bg-black rounded-lg"
          onError={(e) => {
            console.error('影片載入失敗:', e);
          }}
        >
          您的瀏覽器不支援影片播放
        </video>

        {/* 底部提示 */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/50 to-transparent p-4">
          <p className="text-white/70 text-sm text-center">
            按 ESC 關閉 · 按空白鍵播放/暫停
          </p>
        </div>
      </div>
    </div>
  );
}