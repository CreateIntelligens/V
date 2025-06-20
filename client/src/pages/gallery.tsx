import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Video, Music, Download, Share, Trash2, Filter, Search, Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AudioPlayer } from "@/components/audio-player";
import type { GeneratedContent } from "@shared/schema";

export default function Gallery() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("newest");

  const { data: content = [] } = useQuery<GeneratedContent[]>({
    queryKey: ["/api/content"],
  });

  // 模擬一些內容數據
  const mockContent: GeneratedContent[] = [
    {
      id: 1,
      modelId: 1,
      type: "audio",
      inputText: "歡迎來到我們的AI模特工作室，這裡有最先進的語音合成技術。",
      outputPath: "audio_1.mp3",
      emotion: "professional",
      status: "completed",
      duration: 15,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: 2,
      modelId: 2,
      type: "video",
      inputText: "大家好！今天我們要介紹最新的產品功能，讓我來為大家詳細解說。",
      outputPath: "video_2.mp4",
      emotion: "energetic",
      status: "completed",
      duration: 45,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
    {
      id: 3,
      modelId: 1,
      type: "audio",
      inputText: "感謝您的收聽，我們下次再見。記得關注我們的頻道獲取更多精彩內容。",
      outputPath: "audio_3.mp3",
      emotion: "gentle",
      status: "completed",
      duration: 12,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    {
      id: 4,
      modelId: 2,
      type: "video",
      inputText: "這是一個演示視頻，展示我們的AI角色如何進行自然的對話和表達。",
      outputPath: "video_4.mp4",
      emotion: "neutral",
      status: "generating",
      duration: null,
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
    },
  ];

  const allContent = [...content, ...mockContent];

  const filteredContent = allContent
    .filter(item => {
      if (filterType !== "all" && item.type !== filterType) return false;
      if (searchTerm && !item.inputText.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
        case "oldest":
          return new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime();
        case "duration":
          return (b.duration || 0) - (a.duration || 0);
        default:
          return 0;
      }
    });

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "生成中...";
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">作品管理</h1>
        <p className="text-gray-600">瀏覽和管理您的所有AI生成內容</p>
      </div>

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
              <SelectItem value="video">視頻</SelectItem>
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
              <p className="text-2xl font-bold text-gray-900">{allContent.length}</p>
              <p className="text-sm text-gray-600">總作品數</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{allContent.filter(c => c.type === "audio").length}</p>
              <p className="text-sm text-gray-600">音頻作品</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{allContent.filter(c => c.type === "video").length}</p>
              <p className="text-sm text-gray-600">視頻作品</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 內容展示 */}
      {viewMode === "grid" ? (
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
                      {item.type === 'audio' ? '音頻內容' : '視頻內容'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(item.createdAt!).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(item.status)}`}>
                    {getStatusText(item.status)}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {item.inputText}
                </p>

                {item.type === 'audio' && item.status === 'completed' && item.outputPath && (
                  <div className="mb-4">
                    <AudioPlayer src={item.outputPath} />
                  </div>
                )}

                {item.type === 'video' && item.status === 'completed' && (
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    <div className="text-center">
                      <Video className="text-gray-400 h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">視頻預覽</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>時長: {formatDuration(item.duration)}</span>
                  <span>情感: {item.emotion}</span>
                </div>

                <div className="flex space-x-2">
                  {item.status === 'completed' && (
                    <>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Download className="mr-2 h-4 w-4" />
                        下載
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Share className="mr-2 h-4 w-4" />
                        分享
                      </Button>
                    </>
                  )}
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
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
                        {item.type === 'audio' ? '音頻內容' : '視頻內容'}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(item.status)}`}>
                        {getStatusText(item.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{item.inputText}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{new Date(item.createdAt!).toLocaleDateString()}</span>
                      <span>時長: {formatDuration(item.duration)}</span>
                      <span>情感: {item.emotion}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    {item.status === 'completed' && (
                      <>
                        <Button variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          下載
                        </Button>
                        <Button variant="outline" size="sm">
                          <Share className="mr-2 h-4 w-4" />
                          分享
                        </Button>
                      </>
                    )}
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredContent.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="text-gray-400 h-8 w-8" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">暫無內容</h3>
          <p className="text-gray-600">開始創建您的第一個AI生成內容吧！</p>
        </div>
      )}
    </div>
  );
}