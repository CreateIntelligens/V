// 測試數據初始化腳本
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbDir = path.join(__dirname, '../data/database');
const modelsDbPath = path.join(dbDir, 'models.json');

// 確保目錄存在
fs.ensureDirSync(dbDir);

// 示例模特數據
const testModels = [
  {
    id: uuidv4(),
    name: '測試人物模特1',
    type: 'person',
    description: '用於影片生成的測試人物模特',
    videoPath: '/uploads/test-video.mp4',
    audioPath: null,
    audioQuality: null,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: '測試聲音模特1',
    type: 'voice',
    description: '用於語音合成的測試聲音模特',
    videoPath: null,
    audioPath: '/uploads/test-audio.wav',
    audioQuality: {
      canUse: true,
      reason: '音頻質量良好',
      details: {
        duration: 30.5,
        sampleRate: 44100,
        quality: 'good'
      }
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: '測試雙模特',
    type: 'person',
    description: '同時包含影片和音頻的雙模特',
    videoPath: '/uploads/test-dual.mp4',
    audioPath: '/uploads/test-dual.wav',
    audioQuality: {
      canUse: true,
      reason: '音頻質量優秀',
      details: {
        duration: 45.2,
        sampleRate: 48000,
        quality: 'excellent'
      }
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// 初始化數據庫
function initTestData() {
  try {
    let db = { models: [] };
    
    // 如果文件已存在，讀取現有數據
    if (fs.existsSync(modelsDbPath)) {
      db = fs.readJsonSync(modelsDbPath);
    }
    
    // 檢查是否已有測試數據
    const hasTestData = db.models.some(model => model.name.includes('測試'));
    
    if (!hasTestData) {
      // 添加測試數據
      db.models.push(...testModels);
      
      // 保存到文件
      fs.writeJsonSync(modelsDbPath, db, { spaces: 2 });
      
      console.log('✅ 測試數據初始化完成');
      console.log(`📊 添加了 ${testModels.length} 個測試模特`);
    } else {
      console.log('ℹ️ 測試數據已存在，跳過初始化');
    }
    
  } catch (error) {
    console.error('❌ 初始化測試數據失敗:', error);
  }
}

// 如果直接運行此腳本
if (require.main === module) {
  initTestData();
}

module.exports = { initTestData };
