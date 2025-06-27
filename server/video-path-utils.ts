import fs from 'fs-extra';
import path from 'path';
import { findVideoFile, getVideoAccessUrl, AUDIO_OUTPUT_CONFIG } from './config';

// 查找音頻檔案
function findAudioFile(fileName: string, dataDir: string): string | null {
  // 檢查所有可能的目錄
  for (const dir of AUDIO_OUTPUT_CONFIG.ALTERNATIVE_DIRS) {
    const filePath = path.join(dataDir, dir, fileName);
    if (fs.existsSync(filePath)) {
      return `${dir}/${fileName}`;
    }
  }
  return null;
}

// 修復影片和音頻路徑的工具函數
export async function fixVideoPathsInDatabase() {
  const dataDir = path.join(process.cwd(), 'data');
  const videosDbPath = path.join(dataDir, 'database', 'videos.json');
  
  console.log('🔧 開始修復影片路徑...');
  
  try {
    // 讀取數據庫
    const db = fs.readJsonSync(videosDbPath);
    let updatedCount = 0;
    
    // 遍歷所有記錄
    for (const item of db.videos) {
      let updated = false;
      
      // 處理影片記錄
      if (item.type === 'video' && item.taskCode && !item.outputPath) {
        const foundPath = findVideoFile(item.taskCode, dataDir);
        
        if (foundPath) {
          item.outputPath = getVideoAccessUrl(foundPath);
          item.status = 'completed';
          item.progress = 100;
          item.updatedAt = new Date().toISOString();
          updated = true;
          
          console.log(`✅ 修復影片路徑: ${item.taskCode} -> ${item.outputPath}`);
        } else {
          console.log(`❌ 找不到影片檔案: ${item.taskCode}`);
        }
      }
      
      // 處理音頻記錄 - 更新路徑到新的統一目錄
      if (item.type === 'audio' && item.outputPath) {
        const currentPath = item.outputPath;
        
        // 如果路徑指向舊位置，嘗試更新
        if (currentPath.includes('/uploads/') || currentPath.includes('/voice/')) {
          const fileName = path.basename(currentPath);
          const foundPath = findAudioFile(fileName, dataDir);
          
          if (foundPath) {
            const newPath = `/results/${foundPath}`;
            if (newPath !== currentPath) {
              item.outputPath = newPath;
              item.updatedAt = new Date().toISOString();
              updated = true;
              
              console.log(`✅ 修復音頻路徑: ${fileName} -> ${newPath}`);
            }
          }
        }
      }
      
      if (updated) {
        updatedCount++;
      }
    }
    
    // 保存更新後的數據庫
    if (updatedCount > 0) {
      fs.writeJsonSync(videosDbPath, db, { spaces: 2 });
      console.log(`🎉 成功修復 ${updatedCount} 個影片記錄的路徑`);
    } else {
      console.log('📝 沒有需要修復的影片記錄');
    }
    
    return { success: true, updatedCount };
  } catch (error: any) {
    console.error('❌ 修復影片路徑失敗:', error);
    return { success: false, error: error?.message || '未知錯誤' };
  }
}

// 獲取影片輸出配置信息
export function getVideoOutputInfo() {
  const dataDir = path.join(process.cwd(), 'data');
  
  return {
    dataDir,
    outputDirs: [
      'temp',
      'face2face/temp', 
      'result'
    ],
    accessUrlPrefix: '/results',
    currentConfig: {
      outputDir: 'temp',
      allowCustomDir: true,
      supportedFormats: ['.mp4', '.avi', '.mov', '.webm']
    }
  };
}
