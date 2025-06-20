const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { simpleAudioCheck, estimateAudioQuality } = require('./simple_audio_check');

const app = express();
const PORT = process.env.PORT || 3000;

// 中間件
app.use(cors());
app.use(express.json());
app.use(express.static('dist')); // 提供靜態文件

// 確保上傳目錄存在
const uploadDir = path.join(__dirname, 'uploads');
const sharedDir = path.join(__dirname, '../data');
const modelsFile = path.join(__dirname, 'models.json'); // 簡單的文件數據庫

fs.ensureDirSync(uploadDir);
fs.ensureDirSync(path.join(sharedDir, 'voice'));
fs.ensureDirSync(path.join(sharedDir, 'face2face'));

// 初始化模型數據文件
if (!fs.existsSync(modelsFile)) {
  fs.writeFileSync(modelsFile, JSON.stringify([]));
}

// 配置 multer 用於文件上傳
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

// API 配置
const API_CONFIG = {
  face2face: process.env.FACE2FACE_URL || 'http://heygem-gen-video:8383/easy',
  tts: process.env.TTS_URL || 'http://heygem-tts:8080',
  asr: process.env.ASR_URL || 'http://heygem-asr:10095'
};

// 工具函數
const copyFileToShared = async (filePath, type) => {
  try {
    const fileName = path.basename(filePath);
    const targetDir = type === 'audio' ? 
      path.join(sharedDir, 'voice') : 
      path.join(sharedDir, 'face2face');
    
    const targetPath = path.join(targetDir, fileName);
    await fs.copy(filePath, targetPath);
    
    // 返回容器內的路徑
    return type === 'audio' ? 
      `/code/data/${fileName}` : 
      `/code/data/${fileName}`;
  } catch (error) {
    console.error('複製文件到共享目錄失敗:', error);
    return null;
  }
};

// 模型數據管理函數
const loadModels = () => {
  try {
    const data = fs.readFileSync(modelsFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('讀取模型數據失敗:', error);
    return [];
  }
};

const saveModels = (models) => {
  try {
    fs.writeFileSync(modelsFile, JSON.stringify(models, null, 2));
  } catch (error) {
    console.error('保存模型數據失敗:', error);
  }
};

// API 路由

// 文件上傳
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '沒有上傳文件' });
    }

    const { type } = req.body; // 'audio' 或 'video'
    const sharedPath = await copyFileToShared(req.file.path, type);
    
    if (!sharedPath) {
      return res.status(500).json({ error: '文件處理失敗' });
    }

    console.log(`📁 文件上傳成功: ${req.file.filename}`);

    res.json({
      success: true,
      filename: req.file.filename,
      originalName: req.file.originalname,
      sharedPath,
      size: req.file.size
    });
  } catch (error) {
    console.error('文件上傳錯誤:', error);
    res.status(500).json({ error: '文件上傳失敗' });
  }
});

// 創建模特 - 實現真正的邏輯
app.post('/api/model/create', async (req, res) => {
  try {
    const { name, videoPath } = req.body;
    
    console.log(`開始創建模特: ${name}, 影片: ${videoPath}`);
    
    if (!name || !videoPath) {
      return res.status(400).json({
        success: false,
        message: '缺少必要參數: name 和 videoPath'
      });
    }

    // 處理 videoPath（可能是完整路徑或文件名）
    let actualVideoPath = videoPath;
    if (videoPath.startsWith('/code/data/')) {
      // 如果是共享路徑，提取文件名
      actualVideoPath = path.basename(videoPath);
    }
    
    // 檢查文件是否存在
    const fullVideoPath = path.join(uploadDir, actualVideoPath);
    if (!fs.existsSync(fullVideoPath)) {
      return res.status(400).json({
        success: false,
        message: `影片文件不存在: ${actualVideoPath}`
      });
    }

    // 1. 簡單音頻檢測
    console.log('🔍 檢測音頻適用性...');
    const audioCheck = simpleAudioCheck(fullVideoPath);
    const audioQuality = estimateAudioQuality(fullVideoPath);
    
    console.log(`🎵 音頻檢測結果: ${audioCheck.hasAudio ? '有音頻' : '無音頻'} (${audioCheck.confidence || 'unknown'})`);

    // 2. 決定創建哪些模特
    const createdModels = [];
    const baseName = name.trim();
    const baseTimestamp = new Date().toISOString();
    const fileStats = fs.statSync(fullVideoPath);

    // 永遠創建人物模特
    const faceModelId = uuidv4();
    const faceModel = {
      id: faceModelId,
      name: `${baseName} (人物)`,
      type: 'face',
      videoPath,
      originalFilename: req.body.originalFilename || videoPath,
      createdAt: baseTimestamp,
      status: 'ready',
      audioCheck,
      audioQuality,
      metadata: {
        fileSize: fileStats.size,
        createdBy: 'user',
        version: '1.0',
        modelType: 'face'
      }
    };
    createdModels.push(faceModel);

    // 如果有音頻，創建聲音模特（除非確定音頻質量很差）
    if (audioCheck.hasAudio && !(audioCheck.confidence === 'low' && audioCheck.sizeHint === 'too_small')) {
      console.log('🎤 創建聲音模特...');
      
      const voiceModelId = uuidv4();
      const voiceModel = {
        id: voiceModelId,
        name: `${baseName} (聲音)`,
        type: 'voice',
        videoPath,
        originalFilename: req.body.originalFilename || videoPath,
        createdAt: baseTimestamp,
        status: 'ready',
        audioCheck,
        audioQuality,
        // 這裡可以後續添加 ASR 結果
        asrResult: null,
        metadata: {
          fileSize: fileStats.size,
          createdBy: 'user',
          version: '1.0',
          modelType: 'voice'
        }
      };
      createdModels.push(voiceModel);
    }

    // 3. 保存到數據庫
    const models = loadModels();
    createdModels.forEach(model => models.push(model));
    saveModels(models);

    const modelTypes = createdModels.map(m => m.type).join(' + ');
    console.log(`✅ 模特創建成功: ${modelTypes} (${createdModels.length}個)`);

    res.json({
      success: true,
      modelsCreated: createdModels.length,
      models: createdModels,
      message: `成功創建 ${createdModels.length} 個模特: ${modelTypes}`
    });

  } catch (error) {
    console.error('創建模特錯誤:', error);
    res.status(500).json({
      success: false,
      message: '創建模特失敗',
      error: error.message
    });
  }
});

// 獲取模特列表 - 實現真正的邏輯
app.get('/api/models', async (req, res) => {
  try {
    const { page = 1, pageSize = 20, name = '' } = req.query;
    
    console.log(`📋 獲取模特列表: page=${page}, pageSize=${pageSize}, name=${name}`);
    
    // 讀取模型數據
    let models = loadModels();
    
    // 過濾（按名稱搜索）
    if (name.trim()) {
      models = models.filter(model => 
        model.name.toLowerCase().includes(name.toLowerCase())
      );
    }
    
    // 排序（最新的在前面）
    models.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // 分頁
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    const startIndex = (pageNum - 1) * pageSizeNum;
    const endIndex = startIndex + pageSizeNum;
    const pagedModels = models.slice(startIndex, endIndex);
    
    console.log(`📊 找到 ${models.length} 個模特，返回 ${pagedModels.length} 個`);
    
    res.json({
      success: true,
      data: {
        list: pagedModels,
        total: models.length,
        page: pageNum,
        pageSize: pageSizeNum
      }
    });
    
  } catch (error) {
    console.error('獲取模特列表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取模特列表失敗',
      error: error.message
    });
  }
});

// 刪除模特
app.delete('/api/models/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ 刪除模特: ${id}`);
    
    const models = loadModels();
    const modelIndex = models.findIndex(model => model.id === id);
    
    if (modelIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '模特不存在'
      });
    }
    
    const model = models[modelIndex];
    
    // 刪除關聯文件
    try {
      const filePath = path.join(uploadDir, model.videoPath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`📁 已刪除文件: ${model.videoPath}`);
      }
    } catch (error) {
      console.warn('刪除文件失敗:', error.message);
    }
    
    // 從數據庫中移除
    models.splice(modelIndex, 1);
    saveModels(models);
    
    console.log(`✅ 模特刪除成功: ${id}`);
    
    res.json({
      success: true,
      message: '模特刪除成功'
    });
    
  } catch (error) {
    console.error('刪除模特錯誤:', error);
    res.status(500).json({
      success: false,
      message: '刪除模特失敗',
      error: error.message
    });
  }
});

// 音頻適用性檢測
app.post('/api/audio/check', async (req, res) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: '請提供文件路徑'
      });
    }

    const fullPath = path.join(uploadDir, filePath);
    console.log(`🔍 檢測音頻文件: ${fullPath}`);
    
    const result = await canUseForVoiceCloning(fullPath);
    
    res.json({
      success: true,
      canUse: result.canUse,
      reason: result.reason,
      details: result.details
    });
    
  } catch (error) {
    console.error('音頻檢測錯誤:', error);
    res.status(500).json({
      success: false,
      message: `音頻檢測失敗: ${error.message}`
    });
  }
});

// 快速音頻檢測
app.post('/api/audio/quick-check', async (req, res) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: '請提供文件路徑'
      });
    }

    const fullPath = path.join(uploadDir, filePath);
    const result = await quickAudioCheck(fullPath);
    
    res.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('快速音頻檢測錯誤:', error);
    res.status(500).json({
      success: false,
      message: `檢測失敗: ${error.message}`
    });
  }
});

// 提交影片生成任務
app.post('/api/video/submit', async (req, res) => {
  try {
    const { audioPath, videoPath, options = {} } = req.body;
    const taskCode = uuidv4();

    const data = {
      audio_url: audioPath,
      video_url: videoPath,
      code: taskCode,
      chaofen: options.chaofen || 0,
      watermark_switch: options.watermark || 0,
      pn: options.pn || 1
    };

    const response = await axios.post(`${API_CONFIG.face2face}/submit`, data, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    if (response.data.code === 10000) {
      res.json({
        success: true,
        taskCode,
        message: '任務提交成功'
      });
    } else {
      res.status(400).json({
        success: false,
        message: response.data.msg || '任務提交失敗'
      });
    }
  } catch (error) {
    console.error('提交任務錯誤:', error);
    res.status(500).json({
      success: false,
      message: '服務器錯誤'
    });
  }
});

// 查詢任務狀態
app.get('/api/video/status/:taskCode', async (req, res) => {
  try {
    const { taskCode } = req.params;
    
    const response = await axios.get(`${API_CONFIG.face2face}/query`, {
      params: { code: taskCode },
      timeout: 10000
    });

    if (response.data.code === 10000) {
      const data = response.data.data;
      res.json({
        success: true,
        status: data.status,
        progress: data.progress || 0,
        message: data.msg || '',
        result: data.result
      });
    } else {
      res.status(400).json({
        success: false,
        message: response.data.msg || '查詢失敗'
      });
    }
  } catch (error) {
    console.error('查詢狀態錯誤:', error);
    res.status(500).json({
      success: false,
      message: '服務器錯誤'
    });
  }
});

// 獲取影片列表
app.get('/api/videos', async (req, res) => {
  try {
    const { page = 1, pageSize = 20, name = '' } = req.query;
    
    // 這裡需要調用實際的API或數據庫
    // 暫時返回模擬數據
    res.json({
      success: true,
      data: {
        list: [],
        total: 0,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('獲取影片列表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取影片列表失敗'
    });
  }
});

// TTS 語音合成
app.post('/api/tts/generate', async (req, res) => {
  try {
    const { text, voiceConfig = {} } = req.body;
    
    if (!text || text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '文本不能為空'
      });
    }

    const data = {
      text: text.trim(),
      format: 'wav',
      chunk_length: 200,
      max_new_tokens: 1024,
      top_p: 0.7,
      repetition_penalty: 1.2,
      temperature: 0.7,
      streaming: false,
      normalize: true,
      ...(voiceConfig.reference_audio && voiceConfig.reference_text ? {
        reference_audio: voiceConfig.reference_audio,
        reference_text: voiceConfig.reference_text
      } : {})
    };

    console.log('🎤 發送 TTS 請求:', JSON.stringify(data, null, 2));

    const response = await axios.post(`${API_CONFIG.tts}/v1/invoke`, data, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000,
      responseType: 'arraybuffer'
    });

    const contentType = response.headers['content-type'];
    if (contentType && contentType.startsWith('audio/')) {
      const audioFileName = `tts_${Date.now()}_${uuidv4().substring(0, 8)}.wav`;
      const audioPath = path.join(uploadDir, audioFileName);
      await fs.writeFile(audioPath, response.data);
      
      console.log(`🎵 TTS 音頻已保存: ${audioPath}`);
      
      res.json({
        success: true,
        audioUrl: `/uploads/${audioFileName}`,
        filename: audioFileName,
        size: response.data.length,
        message: 'TTS生成成功'
      });
    } else {
      const errorText = Buffer.from(response.data).toString('utf8');
      console.error('TTS 服務返回非音頻響應:', errorText);
      
      res.status(400).json({
        success: false,
        message: `TTS生成失敗: ${errorText}`
      });
    }
  } catch (error) {
    console.error('TTS生成錯誤:', error.message);
    
    if (error.response) {
      const errorData = error.response.data;
      const errorMessage = typeof errorData === 'string' ? 
        errorData : 
        (errorData.message || errorData.detail || '未知錯誤');
      
      res.status(error.response.status || 500).json({
        success: false,
        message: `TTS服務錯誤: ${errorMessage}`
      });
    } else {
      res.status(500).json({
        success: false,
        message: `TTS服務連接失敗: ${error.message}`
      });
    }
  }
});

// 提供上傳文件的靜態訪問
app.use('/uploads', express.static(uploadDir));

// 提供結果文件的代理訪問
app.get('/results/*', async (req, res) => {
  try {
    const filePath = req.path.replace('/results', '');
    const response = await axios.get(`http://heygem-gen-video:8383${filePath}`, {
      responseType: 'stream'
    });
    
    response.data.pipe(res);
  } catch (error) {
    console.error('代理文件錯誤:', error);
    res.status(404).json({ error: '文件不存在' });
  }
});

// SPA 路由處理
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 錯誤處理中間件
app.use((error, req, res, next) => {
  console.error('服務器錯誤:', error);
  res.status(500).json({
    success: false,
    message: '服務器內部錯誤'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 HeyGem Web服務器運行在 http://localhost:${PORT}`);
  console.log(`📁 上傳目錄: ${uploadDir}`);
  console.log(`🔗 API配置:`, API_CONFIG);
  console.log(`💾 模型數據文件: ${modelsFile}`);
});
