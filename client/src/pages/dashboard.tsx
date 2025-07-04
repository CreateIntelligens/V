import { Brain, Bell, Mic, Video, Home, User, Wand2, Folder } from "lucide-react";
import { CharacterModelCreation } from "@/components/character-model-creation";
import { ContentGeneration } from "@/components/content-generation";
import { VideoGeneration } from "@/components/video-generation";
import { ModelGrid } from "@/components/model-grid";
import { useQuery } from "@tanstack/react-query";
import type { Model, GeneratedContent } from "@shared/schema";

export default function Dashboard() {
  const { data: models = [] } = useQuery<Model[]>({
    queryKey: ["/api/models"],
  });

  const { data: recentContent = [] } = useQuery<GeneratedContent[]>({
    queryKey: ["/api/content"],
  });

  const recentActivity = recentContent.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Brain className="text-primary-foreground text-sm" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">AI Model Studio</h1>
              </div>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#dashboard" className="text-primary border-b-2 border-primary pb-4 px-1 text-sm font-medium">儀表板</a>
              <a href="#models" className="text-gray-500 hover:text-gray-700 pb-4 px-1 text-sm font-medium transition-colors">我的資源</a>
              <a href="#generate" className="text-gray-500 hover:text-gray-700 pb-4 px-1 text-sm font-medium transition-colors">內容生成</a>
              <a href="#library" className="text-gray-500 hover:text-gray-700 pb-4 px-1 text-sm font-medium transition-colors">素材庫</a>
            </nav>
            <div className="flex items-center space-x-4">
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                <Bell className="h-5 w-5" />
              </button>
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Model Creation */}
        <CharacterModelCreation />

        {/* Content Generation */}
        <ContentGeneration models={models} />

        {/* Video Generation */}
        <VideoGeneration />

        {/* My Models */}
        <ModelGrid models={models} />

        {/* Recent Activity */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">最近活動</h3>
          <div className="bg-white rounded-xl shadow-material">
            <div className="divide-y divide-gray-100">
              {recentActivity.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  暫無活動記錄
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        activity.type === 'audio' ? 'bg-blue-100' : 'bg-purple-100'
                      }`}>
                        {activity.type === 'audio' ? (
                          <Mic className="text-blue-600 h-5 w-5" />
                        ) : (
                          <Video className="text-purple-600 h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.type === 'audio' ? '語音生成' : '影片生成'}{activity.status === 'completed' ? '完成' : '進行中'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {activity.inputText.slice(0, 50)}...
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(activity.createdAt!).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around">
          <button className="flex flex-col items-center space-y-1 text-primary">
            <Home className="h-5 w-5" />
            <span className="text-xs">首頁</span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-gray-400">
            <User className="h-5 w-5" />
            <span className="text-xs">資源</span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-gray-400">
            <Wand2 className="h-5 w-5" />
            <span className="text-xs">生成</span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-gray-400">
            <Folder className="h-5 w-5" />
            <span className="text-xs">文件</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
