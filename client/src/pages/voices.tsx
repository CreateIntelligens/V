import { VoiceModelCreation } from "@/components/voice-model-creation";
import { ModelGrid } from "@/components/model-grid";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { Model } from "@shared/schema";

export default function VoiceModels() {
  const { data: modelsResponse } = useQuery({
    queryKey: ["/api/models"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/models");
      return response.json();
    },
  });

  // 只顯示語音資源
  const voiceModels = (modelsResponse?.data?.list || []).filter((model: Model) => model.type === "voice");

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4">
        <Link href="/tts">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回 TTS
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">語音資源管理</h1>
          <p className="text-gray-600">創庺和管理您的AI語音資源</p>
        </div>
      </div>

      <VoiceModelCreation />
      <ModelGrid models={voiceModels} />
    </div>
  );
}
