import { Brain, Video, Users, FileImage, ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useUser } from "@/contexts/user-context";
import type { Model, GeneratedContent } from "@shared/schema";

export default function Home() {
  const { currentUser } = useUser();
  
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

  const { data: contentResponse } = useQuery({
    queryKey: ["/api/content", currentUser?.username],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (currentUser?.username) params.append("userId", currentUser.username);
      const response = await apiRequest("GET", `/api/content?${params.toString()}`);
      return response.json();
    },
  });

  const content = contentResponse?.data?.list || [];

  const stats = {
    totalModels: Array.isArray(models) ? models.length : 0,
    voiceModels: Array.isArray(models) ? models.filter(m => m.type === "voice").length : 0,
    characterModels: Array.isArray(models) ? models.filter(m => m.type === "character").length : 0,
    totalContent: Array.isArray(content) ? content.length : 0,
    audioContent: Array.isArray(content) ? content.filter(c => c.type === "audio").length : 0,
    videoContent: Array.isArray(content) ? content.filter(c => c.type === "video").length : 0,
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center py-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
        <div className="max-w-4xl mx-auto px-6">
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-6">
            <Brain className="text-primary-foreground h-8 w-8" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Model Studio</h1>
          <p className="text-xl text-gray-600 mb-8">
            專業的AI資源創建和內容生成平台，讓您輕鬆打造個性化的數字人物和聲音模型
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/models">
              <Button size="lg" className="px-8">
                開始創建資源
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/editor">
              <Button variant="outline" size="lg" className="px-8">
                開始生成內容
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Overview */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">數據概覽</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="text-blue-600 h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">總資源數量</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalModels}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Video className="text-green-600 h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">生成內容</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalContent}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileImage className="text-purple-600 h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">語音資源</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.voiceModels}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-orange-600 h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">人物形象</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.characterModels}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">快速操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/models">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="text-blue-600 h-6 w-6" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">資源管理</h3>
                <p className="text-sm text-gray-600">創建和管理您的AI資源</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/editor">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Video className="text-green-600 h-6 w-6" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">影音生成</h3>
                <p className="text-sm text-gray-600">編輯和製作影片內容</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/gallery">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <FileImage className="text-purple-600 h-6 w-6" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">作品管理</h3>
                <p className="text-sm text-gray-600">瀏覽和管理您的作品</p>
              </CardContent>
            </Card>
          </Link>

          <Card className="bg-gray-50 border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-4">
                <ArrowRight className="text-gray-400 h-6 w-6" />
              </div>
              <h3 className="font-semibold text-gray-700 mb-2">更多功能</h3>
              <p className="text-sm text-gray-500">即將推出更多功能</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Recent Activity */}
      {Array.isArray(content) && content.length > 0 && (
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">最近活動</h2>
            <Link href="/gallery">
              <Button variant="ghost">查看全部</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.slice(0, 3).map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      item.type === 'audio' ? 'bg-blue-100' : 'bg-purple-100'
                    }`}>
                      {item.type === 'audio' ? (
                        <div className="text-blue-600 text-sm">🎵</div>
                      ) : (
                        <Video className="text-purple-600 h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.type === 'audio' ? '音頻生成' : '影片生成'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(item.createdAt!).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {item.inputText}
                  </p>
                  <div className="mt-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                      item.status === 'completed' 
                        ? 'bg-green-100 text-green-700' 
                        : item.status === 'generating' 
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {item.status === 'completed' ? '已完成' : 
                       item.status === 'generating' ? '生成中' : '失敗'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
