import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Video, Music, Download, Share, Trash2, Search, Grid, List, Star, Expand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AudioPlayer } from "@/components/audio-player";
import { VideoModal } from "@/components/video-modal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ContentItem {
  id: string;
  type: "audio" | "video";
  inputText: string;
  outputPath: string;
  emotion: string;
  provider?: string;
  ttsModel?: string;
  status: "completed" | "generating" | "failed" | "processing";
  duration?: number | null;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function Gallery() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedVideo, setSelectedVideo] = useState<{ src: string; title: string; id: string } | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 獲取內容列表
  const { data: contentResponse, isLoading, error } = useQuery({
    queryKey: ["/api/content", filterType, showFavoritesOnly],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterType !== "all") params.append("type", filterType);
      if (showFavoritesOnly) params.append("favoriteOnly", "true");
      
      console.log('API 請求:', `/api/content?${params.toString()}`);
      const response = await apiRequest("GET", `/api/content?${params.toString()}`);
      const result = await response.json();
      console.log('API 回應:', result);
      return result;
    },
  });

  const content: ContentItem[] = contentResponse?.data?.list || [];

  // 收藏/取消收藏
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const response = await apiRequest("PATCH", `/api/content/${id}/favorite`, { isFavorite });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      toast({
        title: data.message,
        description: data.data.isFavorite ? "已加入收藏" : "已取消收藏",
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

  // 刪除內容
  const deleteContentMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/content/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      toast({
        title: "刪除成功",
        description: "內容已刪除",
      });
    },
    onError: () => {
      toast({
        title: "刪除失敗",
        description: "請稍後重試",
        variant: "destructive",
      });
    },
  });

  const filteredContent = content
    .filter(item => {
      if (searchTerm && !item.inputText.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "duration":
          return (b.duration || 0) - (a.duration || 0);
        default:
          return 0;
      }
    });

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "未知";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}秒`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "generating":
        return "bg-yellow-100 text-yellow-700";
      case "failed":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "已完成";
      case "generating":
        return "生成中";
      case "failed":
        return "失敗";
      default:
        return "未知";
    }
  };

  const handleToggleFavorite = (item: ContentItem) => {
    toggleFavoriteMutation.mutate({
      id: item.id,
      isFavorite: !item.isFavorite
    });
  };

  const handleDeleteContent = (id: string) => {
    if (confirm("確定要刪除這個內容嗎？")) {
      deleteContentMutation.mutate(id);
    }
  };

  // 將音色 ID 轉換為友好顯示名稱
  const getVoiceDisplayName = (ttsModel: string | undefined, provider: string | undefined) => {
    if (!ttsModel) return '未知';
    
    // MiniMax 音色映射
    if (provider === 'minimax') {
      const minimaxVoices: { [key: string]: string } = {
        'moss_audio_069e7ef7-45ab-11f0-b24c-2e48b7cbf811': '小安 (女)',
        'moss_audio_e2651ab2-50e2-11f0-8bff-3ee21232901d': '小賴 (男)',
        'moss_audio_9e3d9106-42a6-11f0-b6c4-9e15325fe584': 'Hayley (女)'
      };
      return minimaxVoices[ttsModel] || ttsModel;
    }
    
    // EdgeTTS 音色映射
    if (provider === 'edgetts') {
      const edgeTTSVoices: { [key: string]: string } = {
        'zh-CN-XiaoxiaoNeural': '曉曉 (溫柔女聲)',
        'zh-CN-YunxiNeural': '雲希 (活潑男聲)',
        'zh-CN-XiaoyiNeural': '曉伊 (甜美女聲)',
        'zh-CN-YunjianNeural': '雲健 (沉穩男聲)',
        'en-US-JennyNeural': 'Jenny (美式女聲)',
        'en-US-GuyNeural': 'Guy (美式男聲)'
      };
      return edgeTTSVoices[ttsModel] || ttsModel;
    }
    
    // 其他提供商直接返回原始名稱
    return ttsModel;
  };

  // 格式化創建時間，顯示精確時間
  const formatCreatedTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW') + ' ' + date.toLocaleTimeString('zh-TW', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">作品管理</h1>
        <p className="text-gray-600">瀏覽和管理您的所有AI生成內容</p>
      </div>

      {/* 標籤頁 */}
      <Tabs value={showFavoritesOnly ? "favorites" : "all"} onValueChange={(value) => setShowFavoritesOnly(value === "favorites")}>
        <TabsList>
          <TabsTrigger value="all">全部作品</TabsTrigger>
          <TabsTrigger value="favorites">收藏作品</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {/* 篩選和搜尋工具列 */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="搜尋內容..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="audio">音頻</SelectItem>
                  <SelectItem value="video">影片</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">最新</SelectItem>
                  <SelectItem value="oldest">最舊</SelectItem>
                  <SelectItem value="duration">時長</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 統計資訊 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{content.length}</p>
                  <p className="text-sm text-gray-600">總作品數</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{content.filter(c => c.type === "audio").length}</p>
                  <p className="text-sm text-gray-600">音頻作品</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{content.filter(c => c.type === "video").length}</p>
                  <p className="text-sm text-gray-600">影片作品</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 內容展示 */}
          {error && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="text-red-400 h-8 w-8" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">載入失敗</h3>
              <p className="text-red-600">{error.message}</p>
            </div>
          )}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">載入中...</p>
            </div>
          ) : !error && filteredContent.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="text-gray-400 h-8 w-8" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暫無內容</h3>
              <p className="text-gray-600">開始創建您的第一個AI生成內容吧！</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContent.map((item) => (
                <Card key={item.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        item.type === 'audio' ? 'bg-blue-100' : 'bg-purple-100'
                      }`}>
                        {item.type === 'audio' ? (
                          <Music className="text-blue-600 h-6 w-6" />
                        ) : (
                          <Video className="text-purple-600 h-6 w-6" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {item.type === 'audio' ? '音頻內容' : '影片內容'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatCreatedTime(item.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleFavorite(item)}
                          className={item.isFavorite ? "text-yellow-500" : "text-gray-400"}
                        >
                          <Star className={`h-4 w-4 ${item.isFavorite ? "fill-current" : ""}`} />
                        </Button>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(item.status)}`}>
                          {getStatusText(item.status)}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {item.inputText}
                    </p>

                    {item.type === 'audio' && item.status === 'completed' && item.outputPath && (
                      <div className="mb-4">
                        <AudioPlayer src={item.outputPath} />
                      </div>
                    )}

                    {item.type === 'video' && item.status === 'completed' && item.outputPath && (
                      <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden flex items-center justify-center relative group cursor-pointer">
                        <video 
                          src={item.outputPath}
                          controls 
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            console.error('影片載入失敗:', e);
                            console.error('影片路徑:', item.outputPath);
                          }}
                        >
                          您的瀏覽器不支援影片播放
                        </video>
                        
                        {/* 放大按鈕 */}
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVideo({
                              src: item.outputPath,
                              title: `影片 - ${item.inputText?.slice(0, 30)}${item.inputText?.length > 30 ? '...' : ''}`,
                              id: item.id
                            });
                          }}
                        >
                          <Expand className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {item.type === 'video' && item.status !== 'completed' && (
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                        <div className="text-center">
                          <Video className="text-gray-400 h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">
                            {item.status === 'processing' ? '生成中...' : 
                             item.status === 'failed' ? '生成失敗' : '影片預覽'}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>提供商: {item.provider || '未知'}</span>
                      <span>模型: {getVoiceDisplayName(item.ttsModel, item.provider)}</span>
                    </div>

                    <div className="flex space-x-2">
                      {item.status === 'completed' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => {
                              if (item.outputPath) {
                                const link = document.createElement('a');
                                link.href = item.outputPath;
                                link.download = `video-${item.id}-${Date.now()}.mp4`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }
                            }}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            下載
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Share className="mr-2 h-4 w-4" />
                            分享
                          </Button>
                        </>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteContent(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredContent.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        item.type === 'audio' ? 'bg-blue-100' : 'bg-purple-100'
                      }`}>
                        {item.type === 'audio' ? (
                          <Music className="text-blue-600 h-6 w-6" />
                        ) : (
                          <Video className="text-purple-600 h-6 w-6" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium text-gray-900">
                            {item.type === 'audio' ? '音頻內容' : '影片內容'}
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleFavorite(item)}
                            className={item.isFavorite ? "text-yellow-500" : "text-gray-400"}
                          >
                            <Star className={`h-4 w-4 ${item.isFavorite ? "fill-current" : ""}`} />
                          </Button>
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(item.status)}`}>
                            {getStatusText(item.status)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{item.inputText}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{formatCreatedTime(item.createdAt)}</span>
                          <span>提供商: {item.provider || '未知'}</span>
                          <span>模型: {getVoiceDisplayName(item.ttsModel, item.provider)}</span>
                        </div>
                        
                        {item.type === 'audio' && item.status === 'completed' && item.outputPath && (
                          <div className="mt-3">
                            <AudioPlayer src={item.outputPath} />
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        {item.status === 'completed' && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                if (item.outputPath) {
                                  const link = document.createElement('a');
                                  link.href = item.outputPath;
                                  const fileExtension = item.type === 'audio' ? 'wav' : 'mp4';
                                  link.download = `${item.type}-${item.id}-${Date.now()}.${fileExtension}`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }
                              }}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              下載
                            </Button>
                            <Button variant="outline" size="sm">
                              <Share className="mr-2 h-4 w-4" />
                              分享
                            </Button>
                          </>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteContent(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="space-y-6">
          {/* 收藏作品內容 - 重複使用相同的展示邏輯 */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">載入中...</p>
            </div>
          ) : filteredContent.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="text-gray-400 h-8 w-8" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暫無收藏</h3>
              <p className="text-gray-600">點擊星號收藏您喜歡的作品</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContent.map((item) => (
                <Card key={item.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        item.type === 'audio' ? 'bg-blue-100' : 'bg-purple-100'
                      }`}>
                        {item.type === 'audio' ? (
                          <Music className="text-blue-600 h-6 w-6" />
                        ) : (
                          <Video className="text-purple-600 h-6 w-6" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {item.type === 'audio' ? '音頻內容' : '影片內容'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleFavorite(item)}
                        className="text-yellow-500"
                      >
                        <Star className="h-4 w-4 fill-current" />
                      </Button>
                    </div>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {item.inputText}
                    </p>

                    {item.type === 'audio' && item.status === 'completed' && item.outputPath && (
                      <div className="mb-4">
                        <AudioPlayer src={item.outputPath} />
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>時長: {formatDuration(item.duration)}</span>
                      <span>情感: {item.emotion}</span>
                    </div>

                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          if (item.outputPath) {
                            const link = document.createElement('a');
                            link.href = item.outputPath;
                            link.download = `audio-${item.id}-${Date.now()}.wav`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }
                        }}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        下載
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Share className="mr-2 h-4 w-4" />
                        分享
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 影片放大模態框 */}
      {selectedVideo && (
        <VideoModal
          src={selectedVideo.src}
          title={selectedVideo.title}
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          onDownload={() => {
            if (selectedVideo) {
              const link = document.createElement('a');
              link.href = selectedVideo.src;
              link.download = `video-${selectedVideo.id}-${Date.now()}.mp4`;
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
