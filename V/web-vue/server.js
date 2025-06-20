const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { canUseForVoiceCloning, quickAudioCheck } = require('./audio_checker');

const app = express();
const PORT = process.env.PORT || 3000;

// 中間件
app.use(cors());
app.use(express.json());

// 檢查是否存在 dist 目錄，如果不存在則使用開發模式
const distPath = path.join(__dirname, 'dist');
const isDev = !fs.existsSync(distPath);

if (isDev) {
  console.log('🔧 開發模式: 掛載模式，先檢查是否需要構建');
  // 嘗試構建前端
  try {
    const { execSync } = require('child_process');
    console.log('正在構建前端...');
    execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
    console.log('✅ 前端構建完成');
    app.use(express.static('dist'));
  } catch (error) {
    console.error('❌ 構建失敗，使用靜態文件模式:', error.message);
    app.use(express.static('.'));
  }
} else {
  console.log('📦 生產模式: 使用 dist 目錄');
  app.use(express.static('dist'));
}

// 確保上傳目錄存在
const uploadDir = path.join(__dirname, 'uploads');
const sharedDir = path.join(__dirname, '../data');
const dbDir = path.join(sharedDir, 'database');
fs.ensureDirSync(uploadDir);
fs.ensureDirSync(path.join(sharedDir, 'voice'));
fs.ensureDirSync(path.join(sharedDir, 'face2face'));
fs.ensureDirSync(dbDir);

// 數據庫文件路徑
const modelsDbPath = path.join(dbDir, 'models.json');
const videosDbPath = path.join(dbDir, 'videos.json');

// 初始化數據庫文件
const initDatabase = () => {
  if (!fs.existsSync(modelsDbPath)) {
    fs.writeJsonSync(modelsDbPath, { models: [] });
  }
  if (!fs.existsSync(videosDbPath)) {
    fs.writeJsonSync(videosDbPath, { videos: [] });
  }
};

// 讀取數據庫
const readDatabase = (dbPath) => {
  try {
    return fs.readJsonSync(dbPath);
  } catch (error) {
    console.error('讀取數據庫失敗:', error);
    return null;
  }
};

// 寫入數據庫
const writeDatabase = (dbPath, data) => {
  try {
    fs.writeJsonSync(dbPath, data, { spaces: 2 });
    return true;
  } catch (error) {
    console.error('寫入數據庫失敗:', error);
    return false;
  }
};

// 初始化數據庫
initDatabase();

// 初始化測試數據（僅在開發模式下）
if (process.env.NODE_ENV === 'development') {
  try {
    const { initTestData } = require('./init-test-data');
    initTestData();
  } catch (error) {
    console.log('ℹ️ 跳過測試數據初始化:', error.message);
  }
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
  face2face: process.env.FACE2FACE_URL || 'http://localhost:8383/easy',
  tts: process.env.TTS_URL || 'http://localhost:18180',
  asr: process.env.ASR_URL || 'http://localhost:10095'
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

// 創建模特
app.post('/api/model/create', async (req, res) => {
  try {
    const { 
      name, 
      videoPath, 
      audioPath, 
      type = 'person', // 'person' 或 'voice'
      description = '',
      audioQuality = null 
    } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: '模特名稱不能為空'
      });
    }
    
    // 讀取現有模特數據
    const db = readDatabase(modelsDbPath);
    if (!db) {
      return res.status(500).json({
        success: false,
        message: '無法讀取數據庫'
      });
    }
    
    // 檢查名稱是否已存在
    const existingModel = db.models.find(m => m.name === name.trim());
    if (existingModel) {
      return res.status(400).json({
        success: false,
        message: '模特名稱已存在'
      });
    }
    
    // 創建新模特
    const newModel = {
      id: uuidv4(),
      name: name.trim(),
      type: type,
      description: description.trim(),
      videoPath: videoPath || null,
      audioPath: audioPath || null,
      audioQuality: audioQuality,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // 添加到數據庫
    db.models.push(newModel);
    
    // 保存數據庫
    if (!writeDatabase(modelsDbPath, db)) {
      return res.status(500).json({
        success: false,
        message: '保存數據失敗'
      });
    }
    
    console.log(`✅ 創建模特成功: ${newModel.name} (${newModel.type})`);
    
    res.json({
      success: true,
      modelId: newModel.id,
      model: newModel,
      message: '模特創建成功'
    });
  } catch (error) {
    console.error('創建模特錯誤:', error);
    res.status(500).json({
      success: false,
      message: '創建模特失敗'
    });
  }
});

// 刪除模特
app.delete('/api/model/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: '模特 ID 不能為空'
      });
    }
    
    // 讀取現有模特數據
    const db = readDatabase(modelsDbPath);
    if (!db) {
      return res.status(500).json({
        success: false,
        message: '無法讀取數據庫'
      });
    }
    
    // 找到要刪除的模特
    const modelIndex = db.models.findIndex(m => m.id === id);
    if (modelIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '模特不存在'
      });
    }
    
    const deletedModel = db.models[modelIndex];
    
    // 從數據庫中移除
    db.models.splice(modelIndex, 1);
    
    // 保存數據庫
    if (!writeDatabase(modelsDbPath, db)) {
      return res.status(500).json({
        success: false,
        message: '保存數據失敗'
      });
    }
    
    console.log(`🗑️ 刪除模特: ${deletedModel.name} (${deletedModel.type})`);
    
    res.json({
      success: true,
      message: '模特刪除成功'
    });
  } catch (error) {
    console.error('刪除模特錯誤:', error);
    res.status(500).json({
      success: false,
      message: '刪除模特失敗'
    });
  }
});

// 獲取模特列表
app.get('/api/models', async (req, res) => {
  try {
    const { page = 1, pageSize = 20, name = '', type = '' } = req.query;
    
    // 讀取模特數據庫
    const db = readDatabase(modelsDbPath);
    if (!db) {
      return res.status(500).json({
        success: false,
        message: '無法讀取數據庫'
      });
    }
    
    // 過濾模特
    let filteredModels = db.models.filter(model => {
      let match = true;
      
      // 按名稱過濾
      if (name && name.trim()) {
        match = match && model.name.toLowerCase().includes(name.trim().toLowerCase());
      }
      
      // 按類型過濾
      if (type && type.trim()) {
        match = match && model.type === type.trim();
      }
      
      // 只顯示活動的模特
      match = match && model.status === 'active';
      
      return match;
    });
    
    // 按創建時間倒序排列
    filteredModels.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // 分頁
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + parseInt(pageSize);
    const paginatedModels = filteredModels.slice(startIndex, endIndex);
    
    console.log(`📋 返回模特列表: ${paginatedModels.length}/${filteredModels.length} 個模特`);
    
    res.json({
      success: true,
      data: {
        list: paginatedModels,
        total: filteredModels.length,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('獲取模特列表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取模特列表失敗'
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

    // 檢查文件是否存在（相對於 uploads 目錄）
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

    // 修復：使用正確的 TTS API 格式
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
      // 只有在提供了參考音頻時才添加這些字段
      ...(voiceConfig.reference_audio && voiceConfig.reference_text ? {
        reference_audio: voiceConfig.reference_audio,
        reference_text: voiceConfig.reference_text
      } : {})
    };

    console.log('發送 TTS 請求:', JSON.stringify(data, null, 2));

    const response = await axios.post(`${API_CONFIG.tts}/v1/invoke`, data, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000,
      responseType: 'arraybuffer'
    });

    // 檢查響應是否為音頻
    const contentType = response.headers['content-type'];
    if (contentType && contentType.startsWith('audio/')) {
      // 保存音頻文件
      const audioFileName = `tts_${Date.now()}_${uuidv4().substring(0, 8)}.wav`;
      const audioPath = path.join(uploadDir, audioFileName);
      await fs.writeFile(audioPath, response.data);
      
      console.log(`TTS 音頻已保存: ${audioPath}`);
      
      res.json({
        success: true,
        audioUrl: `/uploads/${audioFileName}`,
        filename: audioFileName,
        size: response.data.length,
        message: 'TTS生成成功'
      });
    } else {
      // 如果不是音頻，可能是錯誤響應
      const errorText = Buffer.from(response.data).toString('utf8');
      console.error('TTS 服務返回非音頻響應:', errorText);
      
      res.status(400).json({
        success: false,
        message: `TTS生成失敗: ${errorText}`
      });
    }
  } catch (error) {
    console.error('TTS生成錯誤:', error.message);
    
    // 檢查是否是 axios 錯誤
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
    const response = await axios.get(`http://localhost:8383${filePath}`, {
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
  // 檢查是否有 dist 目錄
  if (fs.existsSync(path.join(__dirname, 'dist', 'index.html'))) {
    // 有構建後的 index.html
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    // 沒有構建文件，返回開發版本
    res.sendFile(path.join(__dirname, 'index.html'));
  }
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
});
