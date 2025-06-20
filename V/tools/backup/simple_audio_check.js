/**
 * 簡單的音頻檢測 - 不依賴 ffmpeg
 * 使用基本的文件頭檢測和大小判斷
 */

const fs = require('fs');
const path = require('path');

/**
 * 檢查文件是否有音頻軌道的可能性
 * 基於文件格式和大小的簡單啟發式判斷
 */
function simpleAudioCheck(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return {
        hasAudio: false,
        reason: "文件不存在"
      };
    }

    const stats = fs.statSync(filePath);
    const fileSize = stats.size;
    const ext = path.extname(filePath).toLowerCase();

    // 檢查文件擴展名
    const videoFormats = ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm'];
    const audioFormats = ['.mp3', '.wav', '.aac', '.ogg', '.m4a', '.flac'];

    if (audioFormats.includes(ext)) {
      // 純音頻文件
      if (fileSize < 1024) { // 小於1KB
        return {
          hasAudio: false,
          reason: "音頻文件太小，可能是空文件"
        };
      }
      return {
        hasAudio: true,
        confidence: "high",
        reason: "檢測到音頻文件格式"
      };
    }

    if (!videoFormats.includes(ext)) {
      return {
        hasAudio: false,
        reason: "不支持的文件格式"
      };
    }

    // 對於影片文件，使用簡單的啟發式判斷
    // 讀取文件頭來檢測
    const buffer = Buffer.alloc(1024);
    const fd = fs.openSync(filePath, 'r');
    const bytesRead = fs.readSync(fd, buffer, 0, 1024, 0);
    fs.closeSync(fd);

    if (bytesRead === 0) {
      return {
        hasAudio: false,
        reason: "無法讀取文件內容"
      };
    }

    // 檢查常見的音頻編解碼器標識
    const content = buffer.toString('binary');
    const audioSignatures = [
      'aac',  // AAC 音頻
      'mp3',  // MP3 音頻
      'mp4a', // MP4 音頻
      'sowt', // PCM 音頻
      'alaw', // A-law 音頻
      'ulaw'  // μ-law 音頻
    ];

    let audioHints = 0;
    audioSignatures.forEach(sig => {
      if (content.includes(sig)) {
        audioHints++;
      }
    });

    // 基於文件大小的判斷
    let sizeHint = "unknown";
    if (fileSize < 100 * 1024) { // 小於100KB
      sizeHint = "too_small";
    } else if (fileSize < 1024 * 1024) { // 小於1MB
      sizeHint = "small";
    } else if (fileSize < 10 * 1024 * 1024) { // 小於10MB
      sizeHint = "medium";
    } else {
      sizeHint = "large";
    }

    // 綜合判斷
    if (audioHints > 0) {
      return {
        hasAudio: true,
        confidence: audioHints > 1 ? "high" : "medium",
        reason: `檢測到 ${audioHints} 個音頻特徵標識`,
        sizeHint
      };
    }

    // 基於文件大小的推測
    if (sizeHint === "too_small") {
      return {
        hasAudio: false,
        confidence: "high",
        reason: "文件太小，不太可能包含有意義的音頻"
      };
    }

    if (sizeHint === "large") {
      return {
        hasAudio: true,
        confidence: "medium",
        reason: "大文件通常包含音頻軌道",
        sizeHint
      };
    }

    // 默認為可能有音頻（保守估計）
    return {
      hasAudio: true,
      confidence: "low",
      reason: "無法確定，但假設包含音頻",
      sizeHint
    };

  } catch (error) {
    return {
      hasAudio: false,
      reason: `檢測失敗: ${error.message}`
    };
  }
}

/**
 * 檢查音頻質量（基於文件大小和時長估算）
 */
function estimateAudioQuality(filePath, estimatedDuration = 10) {
  try {
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;
    
    // 估算音頻比特率（假設影片中音頻占10%）
    const estimatedAudioSize = fileSize * 0.1;
    const estimatedBitrate = (estimatedAudioSize * 8) / estimatedDuration; // bps
    const estimatedKbps = estimatedBitrate / 1000;

    let quality = "unknown";
    if (estimatedKbps < 32) {
      quality = "low";
    } else if (estimatedKbps < 128) {
      quality = "medium";
    } else {
      quality = "high";
    }

    return {
      estimatedBitrate: Math.round(estimatedKbps),
      quality,
      fileSize,
      estimatedDuration
    };

  } catch (error) {
    return {
      error: error.message
    };
  }
}

module.exports = {
  simpleAudioCheck,
  estimateAudioQuality
};
