import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MicOff, UserCircle, Edit, Trash2, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Model } from "@shared/schema";

interface ModelGridProps {
  models: Model[];
}

export function ModelGrid({ models }: ModelGridProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteModelMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/models/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "模特已刪除",
        description: "模特已成功刪除",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/models"] });
    },
    onError: () => {
      toast({
        title: "刪除失敗",
        description: "請稍後重試",
        variant: "destructive",
      });
    },
  });

  const handleDeleteModel = (id: number) => {
    if (window.confirm("確定要刪除這個模特嗎？")) {
      deleteModelMutation.mutate(id);
    }
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
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "今天";
    if (diffDays === 2) return "昨天";
    if (diffDays <= 7) return `${diffDays}天前`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)}週前`;
    return d.toLocaleDateString();
  };

  return (
    <section className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">我的模特</h3>
        <Button variant="ghost" className="text-primary hover:text-primary/80">
          查看全部 <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {models.map((model) => {
          const Icon = getModelIcon(model.type);
          return (
            <Card key={model.id} className="hover:shadow-material-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 ${getModelBgColor(model.type)} rounded-lg flex items-center justify-center`}>
                    <Icon className="text-white h-6 w-6" />
                  </div>
                  <div className="flex space-x-2">
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
                <h4 className="font-semibold text-gray-900 mb-2">{model.name}</h4>
                <p className="text-sm text-gray-600 mb-3">{model.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{getModelTypeText(model.type)} | {model.language}</span>
                  <span>{formatDate(model.createdAt)}</span>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      {model.type === "voice" ? "測試" : "預覽"}
                    </Button>
                    <Button size="sm" className="flex-1">
                      {model.type === "voice" ? "使用" : "製作影片"}
                    </Button>
                  </div>
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
            <h4 className="font-medium text-gray-700 mb-2">創建新模特</h4>
            <p className="text-sm text-gray-500">開始訓練您的專屬AI模特</p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
