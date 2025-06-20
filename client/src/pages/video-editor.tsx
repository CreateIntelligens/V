import { useState } from "react";
import { ContentGeneration } from "@/components/content-generation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Video, Music, Image, Settings, Download, Play } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Model } from "@shared/schema";

export default function VideoEditor() {
  const [selectedTemplate, setSelectedTemplate] = useState("standard");
  const [videoDuration, setVideoDuration] = useState([30]);
  const [videoQuality, setVideoQuality] = useState("1080p");
  
  const { data: models = [] } = useQuery<Model[]>({
    queryKey: ["/api/models"],
  });

  const templates = [
    { id: "standard", name: "標準模板", description: "適合一般用途的標準視頻模板" },
    { id: "presentation", name: "演示模板", description: "適合商業演示和教學的模板" },
    { id: "social", name: "社交媒體", description: "適合社交媒體分享的豎屏模板" },
    { id: "news", name: "新聞播報", description: "新聞風格的專業模板" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">視頻編輯器</h1>
        <p className="text-gray-600">使用AI模特創建專業的視頻內容</p>
      </div>

      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate">內容生成</TabsTrigger>
          <TabsTrigger value="template">模板選擇</TabsTrigger>
          <TabsTrigger value="settings">高級設置</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <ContentGeneration models={models} />
        </TabsContent>

        <TabsContent value="template" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">選擇視頻模板</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <Card 
                    key={template.id}
                    className={`cursor-pointer transition-all ${
                      selectedTemplate === template.id 
                        ? 'ring-2 ring-primary border-primary' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                          <Video className="text-white h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{template.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                        </div>
                      </div>
                      {selectedTemplate === template.id && (
                        <div className="mt-3 flex items-center text-primary text-sm">
                          <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                          已選擇
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">預覽區域</h3>
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <Play className="text-gray-400 h-12 w-12 mx-auto mb-3" />
                  <p className="text-gray-500">視頻預覽將在這裡顯示</p>
                  <p className="text-sm text-gray-400 mt-1">選擇模板並生成內容後可以預覽</p>
                </div>
              </div>
              <div className="flex justify-center space-x-3 mt-4">
                <Button variant="outline">
                  <Play className="mr-2 h-4 w-4" />
                  預覽
                </Button>
                <Button>
                  <Download className="mr-2 h-4 w-4" />
                  匯出視頻
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">視頻設置</h3>
                <div className="space-y-4">
                  <div>
                    <Label>視頻時長 (秒)</Label>
                    <div className="mt-2">
                      <Slider
                        value={videoDuration}
                        onValueChange={setVideoDuration}
                        max={300}
                        min={10}
                        step={5}
                      />
                      <div className="flex justify-between text-sm text-gray-500 mt-1">
                        <span>10秒</span>
                        <span>{videoDuration[0]}秒</span>
                        <span>300秒</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label>視頻品質</Label>
                    <Select value={videoQuality} onValueChange={setVideoQuality}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="720p">720p (HD)</SelectItem>
                        <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                        <SelectItem value="1440p">1440p (2K)</SelectItem>
                        <SelectItem value="2160p">2160p (4K)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>視頻比例</Label>
                    <Select defaultValue="16:9">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="16:9">16:9 (橫屏)</SelectItem>
                        <SelectItem value="9:16">9:16 (豎屏)</SelectItem>
                        <SelectItem value="1:1">1:1 (方形)</SelectItem>
                        <SelectItem value="4:3">4:3 (傳統)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">音頻設置</h3>
                <div className="space-y-4">
                  <div>
                    <Label>背景音樂</Label>
                    <Select defaultValue="none">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">無背景音樂</SelectItem>
                        <SelectItem value="soft">輕音樂</SelectItem>
                        <SelectItem value="corporate">商務風格</SelectItem>
                        <SelectItem value="energetic">活力音樂</SelectItem>
                        <SelectItem value="ambient">環境音</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>音量平衡</Label>
                    <div className="space-y-3 mt-2">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>人聲音量</span>
                          <span>80%</span>
                        </div>
                        <Slider defaultValue={[80]} max={100} step={1} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>背景音樂</span>
                          <span>20%</span>
                        </div>
                        <Slider defaultValue={[20]} max={100} step={1} />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">匯出設置</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>檔案格式</Label>
                  <Select defaultValue="mp4">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mp4">MP4</SelectItem>
                      <SelectItem value="avi">AVI</SelectItem>
                      <SelectItem value="mov">MOV</SelectItem>
                      <SelectItem value="webm">WebM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>編碼格式</Label>
                  <Select defaultValue="h264">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="h264">H.264</SelectItem>
                      <SelectItem value="h265">H.265</SelectItem>
                      <SelectItem value="vp9">VP9</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>位元率</Label>
                  <Select defaultValue="auto">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">自動</SelectItem>
                      <SelectItem value="5000">5 Mbps</SelectItem>
                      <SelectItem value="10000">10 Mbps</SelectItem>
                      <SelectItem value="20000">20 Mbps</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}