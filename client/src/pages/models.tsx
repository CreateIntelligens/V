import { CharacterModelCreation } from "@/components/character-model-creation";
import { VoiceModelCreation } from "@/components/voice-model-creation";
import { ModelGrid } from "@/components/model-grid";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Mic } from "lucide-react";
import type { Model } from "@shared/schema";

export default function AIModels() {
  const { data: modelsResponse } = useQuery({
    queryKey: ["/api/models"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/models");
      return response.json();
    },
  });

  const allModels = modelsResponse?.data?.list || [];
  
  // 分別篩選人物模特和語音模特
  const characterModels = allModels.filter((model: Model) => model.type === "character");
  const voiceModels = allModels.filter((model: Model) => model.type === "voice");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI 模特管理</h1>
        <p className="text-gray-600">管理您的 AI 人物模特和語音模特</p>
      </div>

      <Tabs defaultValue="character" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="character" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            人物模特
          </TabsTrigger>
          <TabsTrigger value="voice" className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            語音模特
          </TabsTrigger>
        </TabsList>

        <TabsContent value="character" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">人物模特</h2>
            <p className="text-gray-600 mb-6">創建和管理用於影片生成的 AI 人物模特</p>
          </div>
          <CharacterModelCreation />
          <ModelGrid models={characterModels} />
        </TabsContent>

        <TabsContent value="voice" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">語音模特</h2>
            <p className="text-gray-600 mb-6">創建和管理用於語音合成的 AI 語音模特</p>
          </div>
          <VoiceModelCreation />
          <ModelGrid models={voiceModels} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
