import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MicOff, UserCircle, Edit, Trash2, Plus, ArrowRight, Play, Pause, Video, Expand, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VideoModal } from "@/components/video-modal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/user-context";
import { useState, useRef } from "react";
import type { Model } from "@shared/schema";

interface ModelGridProps {
  models: Model[];
}

export function ModelGrid({ models }: ModelGridProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentUser } = useUser();
  const [playingAudio, setPlayingAudio] = useState<number | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<{ src: string; title: string; id: string } | null>(null);
  const audioRefs = useRef<{ [key: number]: HTMLAudioElement }>({});

  // 確保 models 是陣列
  const safeModels = Array.isArray(models) ? models : [];

  const deleteModelMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/models/${id}`, {
        userId: currentUser?.username
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "刪除失敗");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "資源已刪除",
        description: "資源已成功刪除",
      });
      // 修復查詢鍵，使用正確的格式
      queryClient.invalidateQueries({ queryKey: ["/api/models", currentUser?.username || "guest"] });
    },
    onError: (error: Error) => {
      toast({
        title: "刪除失敗",
        description: error.message || "請稍後重試",
        variant: "destructive",
      });
    },
  });

  // 分享/取消分享資源
  const toggleShareMutation = useMutation({
    mutationFn: async ({ id, isShared }: { id: string; isShared: boolean }) => {
      const response = await apiRequest("PATCH", `/api/models/${id}/share`, { 
        isShared,
        userId: currentUser?.username
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/models", currentUser] });
      toast({
        title: "操作成功",
        description: data.message,
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

  const handleDeleteModel = (id: number) => {
    if (window.confirm("確定要刪除這個資源嗎？")) {
      deleteModelMutation.mutate(id);
    }
  };

  const handleToggleShare = (model: Model) => {
    toggleShareMutation.mutate({
      id: model.id.toString(),
      isShared: !model.isShared
    });
  };

  // 音頻播放控制
  const handleAudioPlay = (modelId: number, audioUrl: string) => {
    // 停止其他正在播放的音頻
    Object.values(audioRefs.current).forEach(audio => {
      if (!audio.paused) {
        audio.pause();
      }
    });

    if (playingAudio === modelId) {
      // 如果正在播放這個音頻，則停止
      setPlayingAudio(null);
      if (audioRefs.current[modelId]) {
        audioRefs.current[modelId].pause();
      }
    } else {
      // 播放新音頻
      if (!audioRefs.current[modelId]) {
        audioRefs.current[modelId] = new Audio(audioUrl);
        audioRefs.current[modelId].onended = () => setPlayingAudio(null);
      }
      audioRefs.current[modelId].play();
      setPlayingAudio(modelId);
    }
  };

  // 獲取影片預覽 - 直接使用影片檔案
  const getVideoPreview = (videoPath: string) => {
    // 直接使用資源檔案路徑，不需要縮圖 API
    return `/models/${videoPath}`;
  };

  const getModelIcon = (type: string) => {
    return type === "voice" ? MicOff : UserCircle;
  };

  const getModelBgColor = (type: string) => {
    return type === "voice" ? "bg-gradient-to-br from-blue-400 to-blue-600" : "bg-gradient-to-br from-green-400 to-green-600";
  };

  const getModelTypeText = (type: string) => {
    return type === "voice" ? "聲音" : "人物";
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "未知";
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - d.getTime());
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // 今天：顯示時間
    if (diffDays === 1) {
      return d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    }
    // 昨天：顯示昨天 + 時間
    if (diffDays === 2) {
      return `昨天 ${d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}`;
    }
    // 更早：顯示月/日 + 時間
    return d.toLocaleDateString('zh-TW', { 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <section className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">我的資源</h3>
        <Button variant="ghost" className="text-primary hover:text-primary/80">
          查看全部 <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {safeModels.map((model) => {
          const Icon = getModelIcon(model.type);
          return (
            <Card key={model.id} className="hover:shadow-material-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 ${getModelBgColor(model.type)} rounded-lg flex items-center justify-center`}>
                    <Icon className="text-white h-6 w-6" />
                  </div>
                  <div className="flex space-x-2">
                    {/* 分享按鈕：ai360 可以分享任何作品，其他用戶只能分享自己的作品，訪客不能分享 */}
                    {(currentUser?.username === "ai360" || 
                      (currentUser?.username && model.userId === currentUser.username)) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleToggleShare(model)}
                        className={model.isShared ? "text-blue-500" : "text-gray-400"}
                        title={model.isShared ? "取消分享" : "分享給所有人"}
                      >
                        <Users className={`h-4 w-4 ${model.isShared ? "fill-current" : ""}`} />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-gray-400 hover:text-red-500"
                      onClick={() => handleDeleteModel(model.id)}
                      disabled={deleteModelMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{model.name}</h4>
                  <span className="text-xs text-gray-500">
                    by {model.userId === 'global' ? '訪客' : 
                        model.userId === currentUser?.username ? '我' : 
                        model.userId}
                  </span>
                </div>
                
                {/* 聲音模型音頻預覽 */}
                {model.type === "voice" && model.trainingFiles && model.trainingFiles.length > 0 && (
                  <div className="mb-3">
                    <div className="w-full bg-gray-50 rounded-lg p-3 border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 truncate flex-1">
                          音頻檔案
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAudioPlay(model.id, `/api/files/${model.trainingFiles[0]}`)}
                          className="ml-2 h-8 w-8 p-0"
                        >
                          {playingAudio === model.id ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 人物模型影片預覽 */}
                {model.type === "character" && model.trainingFiles && model.trainingFiles.length > 0 && (
                  <div className="mb-3">
                    <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden relative group cursor-pointer">
                      <video
                        src={getVideoPreview(model.trainingFiles[0])}
                        className="w-full h-full object-contain"
                        muted
                        preload="metadata"
                        onError={(e) => {
                          // 如果影片載入失敗，顯示預設內容
                          const target = e.target as HTMLVideoElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                                <div class="text-center">
                                  <div class="w-8 h-8 mx-auto mb-2 bg-gray-300 rounded flex items-center justify-center">
                                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM5 8a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"/>
                                    </svg>
                                  </div>
                                  影片預覽
                                </div>
                              </div>
                            `;
                          }
                        }}
                        onMouseEnter={(e) => {
                          // 滑鼠懸停時播放預覽
                          const video = e.target as HTMLVideoElement;
                          video.currentTime = 0;
                          video.play().catch(() => {
                            // 播放失敗時忽略錯誤
                          });
                        }}
                        onMouseLeave={(e) => {
                          // 滑鼠離開時暫停
                          const video = e.target as HTMLVideoElement;
                          video.pause();
                          video.currentTime = 0;
                        }}
                      />
                      
                      {/* 放大按鈕 */}
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVideo({
                            src: getVideoPreview(model.trainingFiles[0]),
                            title: `${model.name} - 人物形象預覽`,
                            id: model.id.toString()
                          });
                        }}
                      >
                        <Expand className="h-3 w-3" />
                      </Button>
                      
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded flex items-center">
                        <Video className="w-3 h-3 mr-1" />
                        影片
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>{formatDate(model.createdAt)}</span>
                </div>
                {model.status !== "ready" && (
                  <div className="mt-2 text-xs text-center">
                    <span className={`px-2 py-1 rounded-full ${
                      model.status === "training" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                    }`}>
                      {model.status === "training" ? "訓練中..." : "訓練失敗"}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        <Card className="bg-gray-50 border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
              <Plus className="text-gray-400 h-6 w-6" />
            </div>
            <h4 className="font-medium text-gray-700 mb-2">創建新資源</h4>
            <p className="text-sm text-gray-500">開始訓練您的專屬AI資源</p>
          </CardContent>
        </Card>
      </div>
      
      {/* 影片放大模態框 */}
      {selectedVideo && (
        <VideoModal
          src={selectedVideo.src}
          title={selectedVideo.title}
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </section>
  );
}
