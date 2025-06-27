// 影片輸出配置
export const VIDEO_OUTPUT_CONFIG = {
  // 影片輸出目錄 (相對於 data 目錄)
  OUTPUT_DIR: 'videos',
  
  // 可選的輸出目錄 (用於查找舊檔案)
  ALTERNATIVE_DIRS: [
    'videos',
    'temp',
    'face2face/temp',
    'result'
  ],
  
  // 影片檔案命名格式
  FILENAME_FORMAT: '{taskCode}-r.mp4',
  
  // 支援的影片格式
  SUPPORTED_FORMATS: ['.mp4', '.avi', '.mov', '.webm'],
  
  // 影片存取 URL 前綴
  ACCESS_URL_PREFIX: '/results',
  
  // 是否可以自定義輸出目錄
  ALLOW_CUSTOM_OUTPUT_DIR: true,
  
  // 預設影片設定
  DEFAULT_VIDEO_SETTINGS: {
    chaofen: 0,        // 超分辨率
    watermark_switch: 0, // 水印開關
    pn: 1              // 處理編號
  }
};

// 音頻輸出配置
export const AUDIO_OUTPUT_CONFIG = {
  // 音頻輸出目錄 (相對於 data 目錄)
  OUTPUT_DIR: 'audios',
  
  // 可選的輸出目錄 (用於查找舊檔案)
  ALTERNATIVE_DIRS: [
    'audios',
    'voice',
    'uploads'
  ],
  
  // 支援的音頻格式
  SUPPORTED_FORMATS: ['.wav', '.mp3', '.flac', '.aac'],
  
  // 音頻存取 URL 前綴
  ACCESS_URL_PREFIX: '/results'
};

// 獲取影片檔案的完整路徑
export function getVideoFilePath(taskCode: string, outputDir?: string): string {
  const dir = outputDir || VIDEO_OUTPUT_CONFIG.OUTPUT_DIR;
  return `${dir}/${taskCode}-r.mp4`;
}

// 獲取影片存取 URL
export function getVideoAccessUrl(filePath: string): string {
  return `${VIDEO_OUTPUT_CONFIG.ACCESS_URL_PREFIX}/${filePath}`;
}

// 檢查影片檔案是否存在
export function findVideoFile(taskCode: string, dataDir: string): string | null {
  const fs = require('fs-extra');
  const path = require('path');
  
  // 檢查所有可能的目錄
  for (const dir of VIDEO_OUTPUT_CONFIG.ALTERNATIVE_DIRS) {
    const filePath = path.join(dataDir, dir, `${taskCode}-r.mp4`);
    try {
      if (fs.existsSync(filePath)) {
        return `${dir}/${taskCode}-r.mp4`;
      }
    } catch (error) {
      console.error(`檢查檔案失敗: ${filePath}`, error);
    }
  }
  
  return null;
}
