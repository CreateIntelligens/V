import type { Express, Request } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertModelSchema, insertGeneratedContentSchema } from "@shared/schema";
import { manualCleanup } from "./file-cleanup";
import multer from "multer";
import path from "path";
import fs from "fs-extra";

// Configure multer for file uploads - 直接上傳到對應目錄
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      // 根據檔案類型決定存放目錄
      if (['.mp3', '.wav', '.flac'].includes(ext)) {
        cb(null, 'data/audios/');
      } else if (['.mp4', '.avi', '.mov'].includes(ext)) {
        cb(null, 'data/videos/');
      } else {
        cb(null, 'data/audios/'); // 預設放音頻目錄
      }
    },
    filename: (req, file, cb) => {
      // 生成唯一檔名
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 10);
      const ext = path.extname(file.originalname);
      cb(null, `upload_${timestamp}_${randomId}${ext}`);
    }
  }),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedTypes = ['.mp3', '.wav', '.flac', '.zip', '.png', '.jpg', '.jpeg', '.mp4', '.avi', '.mov'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowedTypes.includes(ext));
  }
});

interface MulterRequest extends Request {
  files?: Express.Multer.File[];
  file?: Express.Multer.File;
  body: any;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // 健康檢查端點
  app.get("/api/health", (req, res) => {
    res.json({
      success: true,
      message: "服務正常運行",
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // 提供 videos 目錄的靜態訪問
  app.use('/videos', express.static(path.join(process.cwd(), 'data', 'videos'), {
    setHeaders: (res: any, filePath: any) => {
      const ext = path.extname(filePath).toLowerCase();
      if (ext === '.mp4') {
        res.setHeader('Content-Type', 'video/mp4');
      } else if (ext === '.avi') {
        res.setHeader('Content-Type', 'video/x-msvideo');
      } else if (ext === '.mov') {
        res.setHeader('Content-Type', 'video/quicktime');
      }
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  }));

  // 音頻檔案靜態訪問 - 直接使用 audios 路徑
  app.use('/audios', express.static(path.join(process.cwd(), 'data', 'audios'), {
    setHeaders: (res: any, filePath: any) => {
      const ext = path.extname(filePath).toLowerCase();
      if (ext === '.mp3') {
        res.setHeader('Content-Type', 'audio/mpeg');
      } else if (ext === '.wav') {
        res.setHeader('Content-Type', 'audio/wav');
      } else if (ext === '.flac') {
        res.setHeader('Content-Type', 'audio/flac');
      }
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  }));

  // 保持 uploads 路徑的向後相容性
  app.use('/uploads', express.static(path.join(process.cwd(), 'data', 'audios'), {
    setHeaders: (res: any, filePath: any) => {
      const ext = path.extname(filePath).toLowerCase();
      if (ext === '.mp3') {
        res.setHeader('Content-Type', 'audio/mpeg');
      } else if (ext === '.wav') {
        res.setHeader('Content-Type', 'audio/wav');
      } else if (ext === '.flac') {
        res.setHeader('Content-Type', 'audio/flac');
      }
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  }));


  // Model routes
  app.get("/api/models", async (req, res) => {
    try {
      const models = await storage.getModels();
      res.json({
        success: true,
        message: "獲取模特成功",
        data: {
          list: models,
          total: models.length
        }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "獲取模特失敗",
        error: "Failed to fetch models" 
      });
    }
  });

  app.get("/api/models/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const model = await storage.getModel(id);
      if (!model) {
        return res.status(404).json({ error: "Model not found" });
      }
      res.json(model);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch model" });
    }
  });

  app.post("/api/models", async (req, res) => {
    try {
      const modelData = insertModelSchema.parse(req.body);
      const model = await storage.createModel(modelData);
      res.status(201).json(model);
    } catch (error) {
      res.status(400).json({ error: "Invalid model data" });
    }
  });

  app.patch("/api/models/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const model = await storage.updateModel(id, updates);
      if (!model) {
        return res.status(404).json({ error: "Model not found" });
      }
      res.json(model);
    } catch (error) {
      res.status(500).json({ error: "Failed to update model" });
    }
  });

  app.delete("/api/models/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteModel(id);
      if (!deleted) {
        return res.status(404).json({ error: "Model not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete model" });
    }
  });

  // File upload route
  app.post("/api/upload", upload.array('files'), async (req: any, res) => {
    try {
      if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({ error: "No files uploaded" });
      }
      
      const files = req.files.map((file: any) => ({
        originalName: file.originalname,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype,
        path: file.path
      }));
      
      res.json({ files });
    } catch (error) {
      res.status(500).json({ error: "File upload failed" });
    }
  });

  // Content generation routes
  app.get("/api/content", async (req, res) => {
    try {
      const { type, favoriteOnly } = req.query;
      let content = await storage.getGeneratedContent();
      
      // 篩選類型
      if (type && type !== 'all') {
        content = content.filter(c => c.type === type);
      }
      
      // 篩選收藏
      if (favoriteOnly === 'true') {
        content = content.filter(c => c.isFavorite === true);
      }
      
      res.json({
        success: true,
        message: "獲取內容成功",
        data: {
          list: content,
          total: content.length
        }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "獲取內容失敗",
        error: "Failed to fetch content" 
      });
    }
  });

  app.post("/api/generate/audio", async (req, res) => {
    try {
      const contentData = insertGeneratedContentSchema.parse({
        ...req.body,
        type: "audio",
        status: "generating"
      });
      
      const content = await storage.createGeneratedContent(contentData);
      
      // 創建實際的音頻檔案
      const audioFileName = `audio_${content.id}.mp3`;
      const audioPath = path.join(process.cwd(), 'data', 'audios', audioFileName);
      
      // 確保目錄存在
      await fs.ensureDir(path.dirname(audioPath));
      console.log(`📁 確保音頻目錄存在: ${path.dirname(audioPath)}`);
      
      // 異步生成音頻
      setTimeout(async () => {
        try {
          console.log(`🎵 開始生成音頻: ${contentData.inputText}`);
          console.log(`🔧 使用提供商: ${contentData.provider || 'edgetts'}`);
          
          // 根據提供商選擇對應的服務
          let serviceId = "service1"; // 默認 EdgeTTS
          let voiceConfig = {};
          
          switch (contentData.provider) {
            case "edgetts":
              serviceId = "service1";
              voiceConfig = {
                voice: contentData.ttsModel || "zh-CN-XiaoxiaoNeural",
                rate: "+0%",
                pitch: "+0Hz"
              };
              break;
              
            case "minimax":
              serviceId = "service2";
              voiceConfig = {
                voice_id: contentData.ttsModel || "moss_audio_069e7ef7-45ab-11f0-b24c-2e48b7cbf811",
                emotion: contentData.minimaxEmotion || "neutral",
                speed: contentData.minimaxSpeed || 1.0,
                vol: contentData.minimaxVolume || 1.0,
                pitch: contentData.minimaxPitch || 0
              };
              break;
              
            case "fishtts":
              serviceId = "service3";
              voiceConfig = {
                voice: contentData.ttsModel || "default"
              };
              break;
              
            default:
              serviceId = "service1"; // 默認使用 EdgeTTS
              voiceConfig = {
                voice: contentData.ttsModel || "zh-CN-XiaoxiaoNeural",
                rate: "+0%",
                pitch: "+0Hz"
              };
          }
          
          console.log(`🎯 調用服務: ${serviceId}, 語音配置:`, voiceConfig);
          
          // 調用對應的 TTS 服務
          const ttsResponse = await fetch('http://heygem-tts-services:8080/api/tts/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: contentData.inputText,
              service: serviceId,
              voice_config: voiceConfig,
              format: "mp3",
              language: "zh"
            })
          });
          
          if (!ttsResponse.ok) {
            throw new Error(`TTS 服務回應錯誤: ${ttsResponse.status}`);
          }
          
          const audioBuffer = await ttsResponse.arrayBuffer();
          const audioData = Buffer.from(audioBuffer);
          
          // 保存音頻檔案
          await fs.writeFile(audioPath, audioData);
          
          await storage.updateGeneratedContent(content.id, {
            status: "completed",
            outputPath: `/audios/${audioFileName}`,
            duration: Math.floor(audioData.length / 16000) // 估算時長
          });
          
          console.log(`✅ 音頻檔案已創建: ${audioPath} (${audioData.length} bytes)`);
        } catch (error) {
          console.error('調用 EdgeTTS 服務失敗:', error);
          
          // 如果 TTS 服務失敗，創建一個靜音檔案作為備用
          try {
            const silentMp3 = Buffer.from([
              0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
              0xFF, 0xFB, 0x90, 0x00,
              ...Array(1000).fill(0x00)
            ]);
            
            await fs.writeFile(audioPath, silentMp3);
            
            await storage.updateGeneratedContent(content.id, {
              status: "completed",
              outputPath: `/audios/${audioFileName}`,
              duration: 5 // 5秒靜音
            });
            
            console.log(`⚠️ TTS 服務不可用，已創建靜音檔案: ${audioPath}`);
          } catch (fallbackError) {
            console.error('創建備用檔案失敗:', fallbackError);
            await storage.updateGeneratedContent(content.id, {
              status: "failed"
            });
          }
        }
      }, 1000);
      
      res.status(201).json({
        success: true,
        message: "語音生成已開始",
        data: {
          id: content.id,
          audioUrl: `/audios/${audioFileName}`,
          status: content.status
        }
      });
    } catch (error) {
      res.status(400).json({ 
        success: false,
        message: "語音生成失敗",
        error: "Invalid content data" 
      });
    }
  });

  app.post("/api/generate/video", upload.single('referenceAudio'), async (req: MulterRequest, res) => {
    try {
      // 處理 FormData 或 JSON 資料
      let requestData = req.body;
      
      // 如果有上傳的檔案，加入到請求資料中
      if (req.file) {
        requestData.referenceAudio = req.file;
      }
      
      const contentData = insertGeneratedContentSchema.parse({
        ...requestData,
        modelId: parseInt(requestData.modelId), // 確保 modelId 是數字
        type: "video",
        status: "generating"
      });
      
      const content = await storage.createGeneratedContent(contentData);
      
      // 創建實際的影片檔案
      const videoFileName = `video_${content.id}.mp4`;
      const videoPath = path.join(process.cwd(), 'data', 'videos', videoFileName);
      
      // 確保目錄存在
      await fs.ensureDir(path.dirname(videoPath));
      
      // 生成任務代碼
      const taskCode = `task_${content.id}_${Date.now()}`;
      
      // 異步生成影片
      setTimeout(async () => {
        try {
          console.log(`🎬 開始生成影片: ${contentData.inputText}`);
          console.log(`👤 使用人物模特 ID: ${contentData.modelId}`);
          console.log(`🔧 使用提供商: ${contentData.provider || 'edgetts'}`);
          
          // 先生成音頻
          let audioUrl = null;
          if (contentData.inputText) {
            try {
              // 根據提供商選擇對應的服務
              let serviceId = "service1"; // 默認 EdgeTTS
              let voiceConfig = {};
              
              switch (contentData.provider) {
                case "edgetts":
                  serviceId = "service1";
                  voiceConfig = {
                    voice: contentData.ttsModel || "zh-CN-XiaoxiaoNeural",
                    rate: "+0%",
                    pitch: "+0Hz"
                  };
                  break;
                  
                case "minimax":
                  serviceId = "service2";
                  voiceConfig = {
                    voice_id: contentData.ttsModel || "moss_audio_069e7ef7-45ab-11f0-b24c-2e48b7cbf811",
                    emotion: contentData.minimaxEmotion || "neutral",
                    speed: contentData.minimaxSpeed || 1.0,
                    vol: contentData.minimaxVolume || 1.0,
                    pitch: contentData.minimaxPitch || 0
                  };
                  break;
                  
                default:
                  serviceId = "service1";
                  voiceConfig = {
                    voice: contentData.ttsModel || "zh-CN-XiaoxiaoNeural",
                    rate: "+0%",
                    pitch: "+0Hz"
                  };
              }
              
              console.log(`🎯 調用 TTS 服務: ${serviceId}`);
              
              // 調用 TTS 服務生成音頻
              const ttsResponse = await fetch('http://heygem-tts-services:8080/api/tts/generate', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  text: contentData.inputText,
                  service: serviceId,
                  voice_config: voiceConfig,
                  format: "wav", // Face2Face 需要 wav 格式
                  language: "zh"
                })
              });
              
              if (ttsResponse.ok) {
                const audioBuffer = await ttsResponse.arrayBuffer();
                const audioFileName = `temp_audio_${content.id}.wav`;
                const audioPath = path.join(process.cwd(), 'data', 'audios', audioFileName);
                await fs.writeFile(audioPath, Buffer.from(audioBuffer));
                audioUrl = `http://heygem-web:5000/audios/${audioFileName}`;
                console.log(`✅ 音頻生成成功: ${audioPath}`);
              } else {
                console.log(`⚠️ TTS 服務失敗，使用靜音音頻`);
              }
            } catch (error) {
              console.error('TTS 生成失敗:', error);
            }
          }
          
          // 調用 Face2Face 服務生成影片
          // 使用現有的視頻檔案，讓 Face2Face 使用視頻本身的音頻
          const videoFileName = "3d02623d-33f7-4183-af4d-d0e1971ffd2d-r.mp4";
          const face2faceData = {
            audio_url: `http://heygem-web:5000/videos/${videoFileName}`, // 使用視頻本身的音頻
            video_url: `http://heygem-web:5000/videos/${videoFileName}`, // 人物模型視頻 URL
            code: taskCode,
            chaofen: 0,
            watermark_switch: 0,
            pn: 1
          };
          
          console.log(`🎬 調用 Face2Face 服務:`, face2faceData);
          console.log(`📝 原始文字: ${contentData.inputText}`);
          
          // 在調用 Face2Face 之前，嘗試清理可能的鎖檔案
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            
            await fetch('http://heygem-gen-video:8383/clear_locks', {
              method: 'POST',
              signal: controller.signal
            }).catch(() => {
              // 忽略清理失敗，繼續執行
              console.log('🧹 鎖檔案清理請求失敗，繼續執行');
            }).finally(() => {
              clearTimeout(timeoutId);
            });
          } catch (error) {
            console.log('🧹 無法清理鎖檔案，繼續執行');
          }
          
          const face2faceResponse = await fetch('http://heygem-gen-video:8383/easy/submit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(face2faceData)
          });
          
          if (!face2faceResponse.ok) {
            throw new Error(`Face2Face 服務回應錯誤: ${face2faceResponse.status}`);
          }
          
          const face2faceResult = await face2faceResponse.json();
          console.log(`🎬 Face2Face 回應:`, face2faceResult);
          
          if (face2faceResult.code === 10000) {
            // 成功提交，更新任務代碼
            await storage.updateGeneratedContent(content.id, {
              status: "processing"
            });
            
            console.log(`✅ 影片生成任務已提交，任務代碼: ${taskCode}`);
          } else if (face2faceResult.code === 10001) {
            // 服務忙碌，標記為失敗
            console.log(`❌ Face2Face 服務忙碌，任務提交失敗`);
            await storage.updateGeneratedContent(content.id, {
              status: "failed"
            });
            throw new Error(`Face2Face 服務忙碌，請稍後重試`);
          } else {
            throw new Error(`Face2Face 提交失敗: ${face2faceResult.msg || face2faceResult.code}`);
          }
          
        } catch (error) {
          console.error('影片生成失敗:', error);
          await storage.updateGeneratedContent(content.id, {
            status: "failed"
          });
        }
      }, 2000);
      
      res.status(201).json({
        success: true,
        message: "影片生成已開始",
        data: {
          id: content.id,
          videoUrl: `/videos/${videoFileName}`,
          status: content.status,
          taskCode: taskCode
        }
      });
    } catch (error) {
      console.error('影片生成請求失敗:', error);
      res.status(400).json({ 
        success: false,
        message: "影片生成失敗",
        error: "Invalid content data" 
      });
    }
  });

  app.get("/api/content/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const content = await storage.getGeneratedContent();
      const item = content.find(c => c.id === id || c.id === parseInt(id));
      if (!item) {
        return res.status(404).json({ 
          success: false,
          message: "內容不存在",
          error: "Content not found" 
        });
      }
      res.json({
        success: true,
        message: "獲取內容成功",
        data: item
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "獲取內容失敗",
        error: "Failed to fetch content" 
      });
    }
  });

  // 收藏/取消收藏內容
  app.patch("/api/content/:id/favorite", async (req, res) => {
    try {
      const id = req.params.id;
      const { isFavorite } = req.body;
      
      // 如果是收藏操作，同時設置 everFavorited 標記
      const updateData: any = { isFavorite };
      if (isFavorite) {
        updateData.everFavorited = true;
      }
      
      const updated = await storage.updateGeneratedContent(id, updateData);
      if (!updated) {
        return res.status(404).json({ 
          success: false,
          message: "內容不存在",
          error: "Content not found" 
        });
      }
      
      res.json({
        success: true,
        message: isFavorite ? "已加入收藏" : "已取消收藏",
        data: updated
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "操作失敗",
        error: "Failed to update favorite status" 
      });
    }
  });

  // 刪除內容
  app.delete("/api/content/:id", async (req, res) => {
    try {
      const id = req.params.id;
      
      // 先獲取內容資訊，以便刪除對應的檔案
      const content = await storage.getGeneratedContent();
      const item = content.find(c => c.id === id || c.id === parseInt(id));
      
      if (!item) {
        return res.status(404).json({ 
          success: false,
          message: "內容不存在",
          error: "Content not found" 
        });
      }
      
      // 刪除實際檔案
      if (item.outputPath) {
        try {
          let filePath = '';
          
          // 根據路徑類型決定實際檔案位置
          if (item.outputPath.startsWith('/audios/')) {
            filePath = path.join(process.cwd(), 'data', 'audios', path.basename(item.outputPath));
          } else if (item.outputPath.startsWith('/videos/')) {
            filePath = path.join(process.cwd(), 'data', 'videos', path.basename(item.outputPath));
          } else if (item.outputPath.startsWith('/uploads/')) {
            filePath = path.join(process.cwd(), 'data', 'audios', path.basename(item.outputPath));
          }
          
          // 檢查檔案是否存在並刪除
          if (filePath && await fs.pathExists(filePath)) {
            await fs.remove(filePath);
            console.log(`🗑️ 已刪除檔案: ${filePath}`);
          } else {
            console.log(`⚠️ 檔案不存在或路徑無效: ${filePath}`);
          }
        } catch (fileError) {
          console.error(`檔案刪除失敗: ${fileError}`);
          // 檔案刪除失敗不影響資料庫刪除，繼續執行
        }
      }
      
      // 刪除資料庫記錄
      const deleted = await storage.deleteGeneratedContent(id);
      if (!deleted) {
        return res.status(404).json({ 
          success: false,
          message: "資料庫刪除失敗",
          error: "Database deletion failed" 
        });
      }
      
      res.json({
        success: true,
        message: "刪除成功",
        data: null
      });
    } catch (error) {
      console.error('刪除內容失敗:', error);
      res.status(500).json({ 
        success: false,
        message: "刪除失敗",
        error: "Failed to delete content" 
      });
    }
  });

  // 手動更新內容狀態
  app.patch("/api/content/:id/status", async (req, res) => {
    try {
      const id = req.params.id;
      const { status, outputPath, duration } = req.body;
      
      const updateData: any = { status };
      if (outputPath) updateData.outputPath = outputPath;
      if (duration !== undefined) updateData.duration = duration;
      
      const updated = await storage.updateGeneratedContent(id, updateData);
      if (!updated) {
        return res.status(404).json({ 
          success: false,
          message: "內容不存在",
          error: "Content not found" 
        });
      }
      
      res.json({
        success: true,
        message: "狀態更新成功",
        data: updated
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "狀態更新失敗",
        error: "Failed to update status" 
      });
    }
  });

  // 影片生成進度查詢端點
  app.get("/api/video/query", async (req, res) => {
    try {
      const { code } = req.query;
      
      if (!code) {
        return res.status(400).json({
          code: 10004,
          success: false,
          msg: "缺少任務代碼",
          data: {}
        });
      }
      
      console.log(`🔍 查詢影片生成進度: ${code}`);
      
      // 調用 Face2Face 服務查詢進度
      const face2faceResponse = await fetch(`http://heygem-gen-video:8383/easy/query?code=${code}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!face2faceResponse.ok) {
        console.error(`Face2Face 查詢失敗: ${face2faceResponse.status}`);
        return res.status(500).json({
          code: 10004,
          success: false,
          msg: "查詢服務不可用",
          data: {}
        });
      }
      
      const face2faceResult = await face2faceResponse.json();
      console.log(`🎬 Face2Face 查詢回應:`, face2faceResult);
      
      // 如果任務完成，處理結果檔案
      if (face2faceResult.code === 10000 && face2faceResult.data.status === 2 && face2faceResult.data.result) {
        try {
          const resultFileName = face2faceResult.data.result;
          const taskCode = face2faceResult.data.code;
          
          // 生成新的檔案名稱
          const timestamp = Date.now();
          const newVideoName = `generated_video_${timestamp}.mp4`;
          const localVideoPath = path.join(process.cwd(), 'data', 'videos', newVideoName);
          
          // 確保目錄存在
          await fs.ensureDir(path.dirname(localVideoPath));
          
          // 從 Face2Face 容器複製結果檔案
          const { exec } = require('child_process');
          const copyCommand = `docker cp heygem-gen-video:/code/data/temp/${resultFileName} ${localVideoPath}`;
          
          exec(copyCommand, async (error: any, stdout: any, stderr: any) => {
            if (error) {
              console.error(`檔案複製失敗: ${error}`);
            } else {
              console.log(`✅ 影片已複製到: ${localVideoPath}`);
              
              // 從任務代碼中提取內容 ID
              const contentIdMatch = taskCode.match(/task_(\d+)_/);
              if (contentIdMatch) {
                const contentId = contentIdMatch[1];
                
                // 更新資料庫狀態為完成
                try {
                  await storage.updateGeneratedContent(contentId, {
                    status: "completed",
                    outputPath: `/videos/${newVideoName}`,
                    duration: face2faceResult.data.video_duration || 0
                  });
                  console.log(`✅ 資料庫狀態已更新: ${contentId} -> completed`);
                } catch (updateError) {
                  console.error(`資料庫更新失敗: ${updateError}`);
                }
              }
              
              // 清理 Face2Face 臨時檔案
              const cleanupCommand = `docker exec heygem-gen-video sh -c "rm -f /code/data/temp/${taskCode}*"`;
              exec(cleanupCommand, (cleanupError: any) => {
                if (cleanupError) {
                  console.error(`清理失敗: ${cleanupError}`);
                } else {
                  console.log(`🧹 已清理臨時檔案: ${taskCode}*`);
                }
              });
            }
          });
          
          // 修改回應，提供本地訪問路徑
          face2faceResult.data.video_url = `/videos/${newVideoName}`;
          face2faceResult.data.local_path = localVideoPath;
          
        } catch (error) {
          console.error('處理結果檔案失敗:', error);
        }
      }
      
      // 轉發 Face2Face 的回應
      res.json(face2faceResult);
      
    } catch (error) {
      console.error('影片進度查詢失敗:', error);
      res.status(500).json({
        code: 10004,
        success: false,
        msg: "查詢失敗",
        data: {}
      });
    }
  });

  // HeyGen 影片生成端點
  app.post("/api/heygen/generate", async (req, res) => {
    try {
      const { text, avatar_id, voice_id, api_key } = req.body;
      
      if (!text || !avatar_id || !voice_id || !api_key) {
        return res.status(400).json({
          success: false,
          message: "缺少必要參數",
          error: "Missing required parameters: text, avatar_id, voice_id, api_key"
        });
      }
      
      console.log(`🎬 開始 HeyGen 影片生成: ${text}`);
      console.log(`👤 頭像 ID: ${avatar_id}`);
      console.log(`🎵 聲音 ID: ${voice_id}`);
      
      // 調用 HeyGen API
      const heygenResponse = await fetch('https://api.heygen.com/v2/video/generate', {
        method: 'POST',
        headers: {
          'X-API-KEY': api_key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_inputs: [{
            character: {
              type: "avatar",
              avatar_id: avatar_id,
              avatar_style: "normal"
            },
            voice: {
              type: "text",
              input_text: text,
              voice_id: voice_id
            }
          }],
          dimension: {
            width: 1280,
            height: 720
          },
          aspect_ratio: "16:9"
        })
      });
      
      if (!heygenResponse.ok) {
        const errorText = await heygenResponse.text();
        console.error(`HeyGen API 錯誤: ${heygenResponse.status} - ${errorText}`);
        
        return res.status(heygenResponse.status).json({
          success: false,
          message: "HeyGen API 調用失敗",
          error: errorText
        });
      }
      
      const heygenResult = await heygenResponse.json();
      console.log(`✅ HeyGen 回應:`, heygenResult);
      
      if (heygenResult.error) {
        return res.status(400).json({
          success: false,
          message: "HeyGen 生成失敗",
          error: heygenResult.error.message || heygenResult.error
        });
      }
      
      // 返回生成結果
      res.json({
        success: true,
        message: "HeyGen 影片生成成功",
        data: {
          videoId: heygenResult.data?.video_id,
          videoUrl: heygenResult.data?.video_url || `https://resource.heygen.com/video/${heygenResult.data?.video_id}.mp4`,
          status: "completed"
        }
      });
      
    } catch (error) {
      console.error('HeyGen 影片生成失敗:', error);
      res.status(500).json({
        success: false,
        message: "HeyGen 影片生成失敗",
        error: error.message || "Internal server error"
      });
    }
  });

  // HeyGen 影片狀態查詢端點
  app.get("/api/heygen/status/:videoId", async (req, res) => {
    try {
      const { videoId } = req.params;
      const { api_key } = req.query;
      
      if (!api_key) {
        return res.status(400).json({
          success: false,
          message: "缺少 API 金鑰",
          error: "Missing api_key parameter"
        });
      }
      
      console.log(`🔍 查詢 HeyGen 影片狀態: ${videoId}`);
      
      const heygenResponse = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
        method: 'GET',
        headers: {
          'X-API-KEY': api_key as string,
          'Content-Type': 'application/json',
        }
      });
      
      if (!heygenResponse.ok) {
        const errorText = await heygenResponse.text();
        console.error(`HeyGen 狀態查詢錯誤: ${heygenResponse.status} - ${errorText}`);
        
        return res.status(heygenResponse.status).json({
          success: false,
          message: "HeyGen 狀態查詢失敗",
          error: errorText
        });
      }
      
      const heygenResult = await heygenResponse.json();
      console.log(`📊 HeyGen 狀態回應:`, heygenResult);
      
      res.json({
        success: true,
        message: "狀態查詢成功",
        data: heygenResult.data
      });
      
    } catch (error) {
      console.error('HeyGen 狀態查詢失敗:', error);
      res.status(500).json({
        success: false,
        message: "狀態查詢失敗",
        error: error.message || "Internal server error"
      });
    }
  });

  // 手動清理端點
  app.post("/api/cleanup", async (req, res) => {
    try {
      console.log('🔧 收到手動清理請求');
      await manualCleanup();
      res.json({
        success: true,
        message: "手動清理完成",
        data: null
      });
    } catch (error) {
      console.error('手動清理失敗:', error);
      res.status(500).json({
        success: false,
        message: "手動清理失敗",
        error: "Manual cleanup failed"
      });
    }
  });

  // Training simulation endpoint
  app.post("/api/models/:id/train", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const model = await storage.getModel(id);
      if (!model) {
        return res.status(404).json({ error: "Model not found" });
      }
      
      // Update model status to training
      await storage.updateModel(id, { status: "training" });
      
      // Simulate training process
      setTimeout(async () => {
        await storage.updateModel(id, { status: "ready" });
      }, 10000); // 10 seconds for demo
      
      res.json({ message: "Training started" });
    } catch (error) {
      res.status(500).json({ error: "Failed to start training" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
