import fs from 'fs-extra';
import path from 'path';

// 清理配置
const CLEANUP_CONFIG = {
  ENABLE_CLEANUP: true,
  // 未收藏內容的存活時間 (7天 = 604800秒) - 給用戶充足時間決定是否收藏
  UNFAVORITED_TTL: 7 * 24 * 60 * 60, // 7天
  // 臨時 TTS 檔案的存活時間 (2小時) - 避免生成過程中被刪除
  TTS_FILE_TTL: 2 * 60 * 60, // 2小時
  // temp 檔案的存活時間 (1小時) - Face2Face處理需要較長時間
  TEMP_FILE_TTL: 60 * 60, // 1小時
  // 清理間隔 (每6小時檢查一次，減少系統負擔)
  CLEANUP_INTERVAL: 6 * 60 * 60 * 1000, // 6小時
  // 檔案數量限制 - 提高限制，減少誤刪
  MAX_AUDIO_FILES: 100,
  MAX_VIDEO_FILES: 50,
  // 啟動時清理
  CLEANUP_ON_STARTUP: true,
};

// 數據庫路徑
const dataDir = path.join(process.cwd(), 'data');
const audiosDir = path.join(dataDir, 'audios'); // 音頻目錄
const videosDir = path.join(dataDir, 'videos'); // 影片目錄
const tempDir = path.join(dataDir, 'temp'); // Face2Face 臨時目錄
const videosDbPath = path.join(dataDir, 'database', 'videos.json');

// 讀取數據庫
const readDatabase = (dbPath: string) => {
  try {
    return fs.readJsonSync(dbPath);
  } catch (error) {
    console.error('讀取數據庫失敗:', error);
    return null;
  }
};

// 寫入數據庫
const writeDatabase = (dbPath: string, data: any) => {
  try {
    fs.writeJsonSync(dbPath, data, { spaces: 2 });
    return true;
  } catch (error) {
    console.error('寫入數據庫失敗:', error);
    return false;
  }
};

// 刪除檔案
const deleteFile = async (filePath: string): Promise<boolean> => {
  try {
    if (fs.existsSync(filePath)) {
      await fs.unlink(filePath);
      console.log(`🗑️ 已刪除檔案: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.warn(`⚠️ 無法刪除檔案: ${filePath}`, error);
    return false;
  }
};

// 清理過期的未收藏內容（只清理從未被收藏的內容）
const cleanupUnfavoritedContent = async () => {
  console.log('🧹 開始清理過期的未收藏內容...');
  
  const db = readDatabase(videosDbPath);
  if (!db) {
    console.error('無法讀取內容數據庫');
    return;
  }

  const now = new Date().getTime();
  const expiredContent = [];
  const validContent = [];

  // 分類內容：音頻和影片
  const audioContent = [];
  const videoContent = [];

  for (const content of db.videos) {
    const createdAt = new Date(content.createdAt).getTime();
    const age = (now - createdAt) / 1000; // 秒

    // 如果內容曾經被收藏過（包括現在已取消收藏的），永久保留
    if (content.isFavorite || content.everFavorited) {
      validContent.push(content);
      continue;
    }

    // 按類型分類（用於數量限制）
    if (content.type === 'audio') {
      audioContent.push(content);
    } else if (content.type === 'video') {
      videoContent.push(content);
    }

    // 如果內容未過期，暫時保留
    if (age < CLEANUP_CONFIG.UNFAVORITED_TTL) {
      validContent.push(content);
      continue;
    }

    // 內容已過期，標記為刪除
    expiredContent.push(content);
  }

  // 檢查數量限制：如果超過限制，刪除最舊的未收藏內容
  const audioToDelete = [];
  const videoToDelete = [];

  // 音頻數量限制
  if (audioContent.length > CLEANUP_CONFIG.MAX_AUDIO_FILES) {
    // 按創建時間排序，刪除最舊的
    audioContent.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const excessCount = audioContent.length - CLEANUP_CONFIG.MAX_AUDIO_FILES;
    audioToDelete.push(...audioContent.slice(0, excessCount));
    console.log(`📊 音頻檔案超過限制 (${audioContent.length}/${CLEANUP_CONFIG.MAX_AUDIO_FILES})，將刪除最舊的 ${excessCount} 個`);
  }

  // 影片數量限制
  if (videoContent.length > CLEANUP_CONFIG.MAX_VIDEO_FILES) {
    // 按創建時間排序，刪除最舊的
    videoContent.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const excessCount = videoContent.length - CLEANUP_CONFIG.MAX_VIDEO_FILES;
    videoToDelete.push(...videoContent.slice(0, excessCount));
    console.log(`📊 影片檔案超過限制 (${videoContent.length}/${CLEANUP_CONFIG.MAX_VIDEO_FILES})，將刪除最舊的 ${excessCount} 個`);
  }

  // 合併要刪除的內容
  const allContentToDelete = [...expiredContent, ...audioToDelete, ...videoToDelete];

  if (allContentToDelete.length === 0) {
    console.log('✅ 沒有內容需要清理');
    return;
  }

  console.log(`🗑️ 發現 ${allContentToDelete.length} 個內容需要清理 (過期: ${expiredContent.length}, 超量: ${audioToDelete.length + videoToDelete.length})`);

  // 刪除內容的檔案
  let deletedFiles = 0;
  for (const content of allContentToDelete) {
    const filesToDelete = [];

    // 主要輸出檔案
    if (content.outputPath) {
      if (content.outputPath.startsWith('/audios/')) {
        const fileName = content.outputPath.replace('/audios/', '');
        filesToDelete.push(path.join(audiosDir, fileName));
      } else if (content.outputPath.startsWith('/videos/')) {
        const fileName = content.outputPath.replace('/videos/', '');
        filesToDelete.push(path.join(videosDir, fileName));
      } else if (content.outputPath.startsWith('/uploads/')) {
        // 向後相容性：處理舊的 uploads 路徑
        const fileName = content.outputPath.replace('/uploads/', '');
        filesToDelete.push(path.join(audiosDir, fileName));
      }
    }

    // 音頻檔案 (影片生成時的 TTS 檔案)
    if (content.audioPath) {
      if (content.audioPath.startsWith('/audios/')) {
        const fileName = content.audioPath.replace('/audios/', '');
        filesToDelete.push(path.join(audiosDir, fileName));
      } else if (content.audioPath.startsWith('/uploads/')) {
        // 向後相容性：處理舊的 uploads 路徑
        const fileName = content.audioPath.replace('/uploads/', '');
        filesToDelete.push(path.join(audiosDir, fileName));
      }
    }

    // 刪除檔案
    for (const filePath of filesToDelete) {
      if (await deleteFile(filePath)) {
        deletedFiles++;
      }
    }

    // 從 validContent 中移除要刪除的內容
    const index = validContent.findIndex(v => v.id === content.id);
    if (index !== -1) {
      validContent.splice(index, 1);
    }
  }

  // 更新數據庫
  db.videos = validContent;
  if (writeDatabase(videosDbPath, db)) {
    console.log(`✅ 清理完成: 刪除了 ${allContentToDelete.length} 個內容記錄和 ${deletedFiles} 個檔案`);
  } else {
    console.error('❌ 更新數據庫失敗');
  }
};

// 清理臨時 TTS 檔案
const cleanupTempTTSFiles = async () => {
  console.log('🧹 開始清理臨時 TTS 檔案...');
  
  try {
    // 確保音頻目錄存在
    if (!fs.existsSync(audiosDir)) {
      console.log('📁 音頻目錄不存在，跳過清理');
      return;
    }

    const files = await fs.readdir(audiosDir);
    const now = new Date().getTime();
    let deletedCount = 0;

    for (const file of files) {
      // 只處理 TTS 相關的檔案 (audio_ 開頭的檔案)
      if (!file.startsWith('audio_') && !file.includes('tts_') && !file.includes('video_audio_')) {
        continue;
      }

      const filePath = path.join(audiosDir, file);
      const stats = await fs.stat(filePath);
      const age = (now - stats.mtime.getTime()) / 1000; // 秒

      // 如果檔案已過期
      if (age > CLEANUP_CONFIG.TTS_FILE_TTL) {
        // 檢查檔案是否還在數據庫中被引用
        const db = readDatabase(videosDbPath);
        if (db) {
          const isReferenced = db.videos.some((content: any) => 
            content.outputPath === `/audios/${file}` || 
            content.audioPath === `/audios/${file}` ||
            content.outputPath === `/uploads/${file}` || // 向後相容性
            content.audioPath === `/uploads/${file}` // 向後相容性
          );

          // 如果檔案沒有被引用，可以安全刪除
          if (!isReferenced) {
            if (await deleteFile(filePath)) {
              deletedCount++;
            }
          }
        }
      }
    }

    if (deletedCount > 0) {
      console.log(`✅ 清理了 ${deletedCount} 個臨時 TTS 檔案`);
    } else {
      console.log('✅ 沒有臨時 TTS 檔案需要清理');
    }
  } catch (error) {
    console.error('❌ 清理臨時 TTS 檔案失敗:', error);
  }
};

// 清理 temp 檔案（影片生成過程中的臨時音頻檔案）
const cleanupTempFiles = async () => {
  console.log('🧹 開始清理 temp 檔案...');
  
  try {
    // 確保音頻目錄存在
    if (!fs.existsSync(audiosDir)) {
      console.log('📁 音頻目錄不存在，跳過清理');
      return;
    }

    const files = await fs.readdir(audiosDir);
    const now = new Date().getTime();
    let deletedCount = 0;

    for (const file of files) {
      // 只處理 temp_ 開頭的檔案
      if (!file.startsWith('temp_')) {
        continue;
      }

      const filePath = path.join(audiosDir, file);
      const stats = await fs.stat(filePath);
      const age = (now - stats.mtime.getTime()) / 1000; // 秒

      // 如果檔案已過期（30分鐘）
      if (age > CLEANUP_CONFIG.TEMP_FILE_TTL) {
        if (await deleteFile(filePath)) {
          deletedCount++;
        }
      }
    }

    if (deletedCount > 0) {
      console.log(`✅ 清理了 ${deletedCount} 個 temp 檔案`);
    } else {
      console.log('✅ 沒有 temp 檔案需要清理');
    }
  } catch (error) {
    console.error('❌ 清理 temp 檔案失敗:', error);
  }
};


// 清理 temp 目錄（Face2Face 臨時檔案）
const cleanupTempDirectory = async () => {
  console.log('🧹 開始清理 temp 目錄...');
  
  try {
    // 確保 temp 目錄存在
    if (!fs.existsSync(tempDir)) {
      console.log('📁 temp 目錄不存在，跳過清理');
      return;
    }

    const files = await fs.readdir(tempDir);
    const now = new Date().getTime();
    let deletedCount = 0;

    for (const file of files) {
      // 處理所有檔案類型（mp4, wav, avi, mov 等）
      const filePath = path.join(tempDir, file);
      const stats = await fs.stat(filePath);
      const age = (now - stats.mtime.getTime()) / 1000; // 秒

      // 如果檔案已過期（30分鐘）
      if (age > CLEANUP_CONFIG.TEMP_FILE_TTL) {
        // task_ 開頭的檔案超過30分鐘，說明已經處理完成，可以刪除
        if (file.startsWith('task_')) {
          if (await deleteFile(filePath)) {
            deletedCount++;
          }
        }
      }
    }

    if (deletedCount > 0) {
      console.log(`✅ 清理了 ${deletedCount} 個 temp 目錄檔案`);
    } else {
      console.log('✅ 沒有 temp 目錄檔案需要清理');
    }
  } catch (error) {
    console.error('❌ 清理 temp 目錄失敗:', error);
  }
};

// 執行完整清理
const performCleanup = async () => {
  if (!CLEANUP_CONFIG.ENABLE_CLEANUP) {
    console.log('🚫 自動清理已停用');
    return;
  }

  console.log('🧹 開始執行自動清理...');
  const startTime = Date.now();

  try {
    await cleanupUnfavoritedContent();
    await cleanupTempTTSFiles();
    await cleanupTempFiles();
    await cleanupTempDirectory();
    
    const duration = Date.now() - startTime;
    console.log(`✅ 自動清理完成，耗時 ${duration}ms`);
  } catch (error) {
    console.error('❌ 自動清理失敗:', error);
  }
};

// 啟動清理服務
export const startCleanupService = () => {
  console.log('🚀 啟動自動清理服務...');
  console.log(`📋 清理配置:`, {
    未收藏內容存活時間: `${CLEANUP_CONFIG.UNFAVORITED_TTL / (24 * 60 * 60)} 天`,
    TTS檔案存活時間: `${CLEANUP_CONFIG.TTS_FILE_TTL / (60 * 60)} 小時`,
    Temp檔案存活時間: `${CLEANUP_CONFIG.TEMP_FILE_TTL / (60 * 60)} 小時`,
    清理間隔: `${CLEANUP_CONFIG.CLEANUP_INTERVAL / (60 * 60 * 1000)} 小時`,
    音頻檔案限制: `${CLEANUP_CONFIG.MAX_AUDIO_FILES} 個`,
    影片檔案限制: `${CLEANUP_CONFIG.MAX_VIDEO_FILES} 個`,
    啟動時清理: CLEANUP_CONFIG.CLEANUP_ON_STARTUP
  });

  // 啟動時清理
  if (CLEANUP_CONFIG.CLEANUP_ON_STARTUP) {
    setTimeout(performCleanup, 5000); // 5秒後執行，避免啟動時阻塞
  }

  // 定期清理 - 使用 setInterval 每30分鐘執行一次
  setInterval(performCleanup, CLEANUP_CONFIG.CLEANUP_INTERVAL);

  console.log('✅ 自動清理服務已啟動');
};

// 手動清理 API
export const manualCleanup = async () => {
  console.log('🔧 執行手動清理...');
  await performCleanup();
};

// 獲取清理統計
export const getCleanupStats = async () => {
  const db = readDatabase(videosDbPath);
  if (!db) {
    return null;
  }

  const now = new Date().getTime();
  let unfavoritedExpired = 0;
  let unfavoritedTotal = 0;
  let favoritedTotal = 0;

  for (const content of db.videos) {
    if (content.isFavorite) {
      favoritedTotal++;
    } else {
      unfavoritedTotal++;
      const createdAt = new Date(content.createdAt).getTime();
      const age = (now - createdAt) / 1000;
      if (age > CLEANUP_CONFIG.UNFAVORITED_TTL) {
        unfavoritedExpired++;
      }
    }
  }

  // 統計 TTS 檔案
  let ttsFiles = 0;
  let expiredTtsFiles = 0;
  try {
    if (fs.existsSync(audiosDir)) {
      const files = await fs.readdir(audiosDir);
      for (const file of files) {
        if (file.startsWith('audio_') || file.includes('tts_') || file.includes('video_audio_')) {
          ttsFiles++;
          const filePath = path.join(audiosDir, file);
          const stats = await fs.stat(filePath);
          const age = (now - stats.mtime.getTime()) / 1000;
          if (age > CLEANUP_CONFIG.TTS_FILE_TTL) {
            expiredTtsFiles++;
          }
        }
      }
    }
  } catch (error) {
    console.error('統計 TTS 檔案失敗:', error);
  }

  return {
    content: {
      total: db.videos.length,
      favorited: favoritedTotal,
      unfavorited: unfavoritedTotal,
      unfavoritedExpired: unfavoritedExpired
    },
    files: {
      ttsFiles: ttsFiles,
      expiredTtsFiles: expiredTtsFiles
    },
    config: CLEANUP_CONFIG
  };
};
