import { ModelCreation } from "@/components/model-creation";
import { ModelGrid } from "@/components/model-grid";
import { useQuery } from "@tanstack/react-query";
import type { Model } from "@shared/schema";

export default function Models() {
  const { data: models = [] } = useQuery<Model[]>({
    queryKey: ["/api/models"],
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">模特管理</h1>
        <p className="text-gray-600">創建和管理您的AI聲音模特和人物模特</p>
      </div>

      <ModelCreation />
      <ModelGrid models={models} />
    </div>
  );
}