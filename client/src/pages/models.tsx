import { CharacterModelCreation } from "@/components/character-model-creation";
import { ModelGrid } from "@/components/model-grid";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Model } from "@shared/schema";

export default function CharacterModels() {
  const { data: modelsResponse } = useQuery({
    queryKey: ["/api/models"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/models");
      return response.json();
    },
  });

  // 只顯示人物模特
  const characterModels = (modelsResponse?.data?.list || []).filter((model: Model) => model.type === "character");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">人物模特</h1>
        <p className="text-gray-600">管理您的AI人物模特</p>
      </div>

      <CharacterModelCreation />
      <ModelGrid models={characterModels} />
    </div>
  );
}
