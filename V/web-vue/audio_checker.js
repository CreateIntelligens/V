/**
 * 音頻適用性檢測模組
 * 用於判斷上傳的影片是否適合用於聲音克隆
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 檢查 ffmpeg 是否可用
 */
function checkFfmpeg() {
    return new Promise((resolve) => {
        const ffmpeg = spawn('ffmpeg', ['-version']);
        
        ffmpeg.on('error', () => resolve(false));
        ffmpeg.on('close', (code) => resolve(code === 0));
        
        // 設置超時
        setTimeout(() => {
            ffmpeg.kill();
            resolve(false);
        }, 5000);
    });
}

/**
 * 使用 ffprobe 提取音頻信息
 */
function extractAudioInfo(videoFile) {
    return new Promise((resolve, reject) => {
        const ffprobe = spawn('ffprobe', [
            '-v', 'quiet',
            '-print_format', 'json',
            '-show_format',
            '-show_streams',
            videoFile
        ]);

        let output = '';
        ffprobe.stdout.on('data', (data) => {
            output += data.toString();
        });

        ffprobe.on('error', (error) => {
            reject(new Error(`ffprobe 執行失敗: ${error.message}`));
        });

        ffprobe.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`ffprobe 退出碼: ${code}`));
                return;
            }

            try {
                if (!output || output.trim() === '') {
                    reject(new Error('ffprobe 沒有返回數據'));
                    return;
                }
                
                const data = JSON.parse(output);
                
                // 尋找音頻流
                const audioStreams = data.streams?.filter(stream => 
                    stream.codec_type === 'audio'
                ) || [];

                if (audioStreams.length === 0) {
                    resolve({ error: "沒有找到音頻流" });
                    return;
                }

                const audioStream = audioStreams[0];
                const duration = parseFloat(data.format?.duration || 0);

                resolve({
                    duration,
                    codec: audioStream.codec_name || 'unknown',
                    sample_rate: parseInt(audioStream.sample_rate || 0),
                    channels: parseInt(audioStream.channels || 0),
                    bit_rate: parseInt(audioStream.bit_rate || 0)
                });

            } catch (error) {
                reject(new Error(`解析 JSON 失敗: ${error.message}`));
            }
        });
    });
}

/**
 * 檢查音頻音量
 */
function checkAudioVolume(videoFile, durationLimit = 10) {
    return new Promise((resolve) => {
        const ffmpeg = spawn('ffmpeg', [
            '-i', videoFile,
            '-t', durationLimit.toString(),
            '-af', 'volumedetect',
            '-f', 'null',
            '-'
        ]);

        let output = '';
        ffmpeg.stderr.on('data', (data) => {
            output += data.toString();
        });

        ffmpeg.on('error', () => {
            resolve({ error: "音量檢測失敗" });
        });

        ffmpeg.on('close', () => {
            // 解析 volumedetect 輸出
            const lines = output.split('\n');
            for (const line of lines) {
                if (line.includes('mean_volume:')) {
                    const match = line.match(/mean_volume:\s*([-\d.]+)\s*dB/);
                    if (match) {
                        resolve({ volume_db: parseFloat(match[1]) });
                        return;
                    }
                }
            }
            resolve({ error: "無法解析音量信息" });
        });
    });
}

/**
 * 判斷影片文件是否適合用於聲音克隆
 */
async function canUseForVoiceCloning(videoFile) {
    try {
        // 檢查文件是否存在
        if (!fs.existsSync(videoFile)) {
            return {
                canUse: false,
                reason: "文件不存在",
                details: null
            };
        }

        // 檢查 ffmpeg
        const hasFfmpeg = await checkFfmpeg();
        if (!hasFfmpeg) {
            return {
                canUse: false,
                reason: "系統缺少 ffmpeg，無法檢測音頻",
                details: null
            };
        }

        // 提取音頻信息
        const audioInfo = await extractAudioInfo(videoFile);
        if (audioInfo.error) {
            return {
                canUse: false,
                reason: audioInfo.error,
                details: null
            };
        }

        // 檢查時長
        if (audioInfo.duration < 3) {
            return {
                canUse: false,
                reason: `音頻太短 (${audioInfo.duration.toFixed(1)}秒)，建議至少3秒`,
                details: audioInfo
            };
        }

        // 檢查採樣率
        if (audioInfo.sample_rate < 8000) {
            return {
                canUse: false,
                reason: `採樣率太低 (${audioInfo.sample_rate}Hz)，建議至少8kHz`,
                details: audioInfo
            };
        }

        // 檢查聲道
        if (audioInfo.channels === 0) {
            return {
                canUse: false,
                reason: "音頻聲道信息異常",
                details: audioInfo
            };
        }

        // 檢查音量
        const volumeInfo = await checkAudioVolume(videoFile);
        let volume_db = null;
        
        if (volumeInfo.error) {
            console.warn(`音量檢測失敗: ${volumeInfo.error}`);
        } else if (volumeInfo.volume_db !== undefined) {
            volume_db = volumeInfo.volume_db;
            
            if (volume_db < -40) {
                return {
                    canUse: false,
                    reason: `音量太小 (${volume_db.toFixed(1)}dB)，可能是靜音`,
                    details: { ...audioInfo, volume_db }
                };
            }
        }

        // 生成質量評估
        const qualityNotes = [];
        
        if (audioInfo.sample_rate >= 22050) {
            qualityNotes.push("✅ 高質量採樣率");
        } else if (audioInfo.sample_rate >= 16000) {
            qualityNotes.push("🟨 中等採樣率");
        } else {
            qualityNotes.push("🟧 基礎採樣率");
        }

        if (audioInfo.duration >= 10) {
            qualityNotes.push("✅ 充足時長");
        } else if (audioInfo.duration >= 5) {
            qualityNotes.push("🟨 適中時長");
        } else {
            qualityNotes.push("🟧 較短時長");
        }

        if (volume_db !== null) {
            if (volume_db > -20) {
                qualityNotes.push("✅ 音量充足");
            } else if (volume_db > -30) {
                qualityNotes.push("🟨 音量適中");
            }
        }

        return {
            canUse: true,
            reason: "適合用於聲音克隆",
            details: {
                ...audioInfo,
                volume_db,
                qualityNotes
            }
        };

    } catch (error) {
        return {
            canUse: false,
            reason: `檢測過程出錯: ${error.message}`,
            details: null
        };
    }
}

/**
 * 快速檢測（僅基本信息，不檢測音量）
 */
async function quickAudioCheck(videoFile) {
    try {
        const audioInfo = await extractAudioInfo(videoFile);
        
        if (audioInfo.error) {
            return {
                hasAudio: false,
                message: "沒有音頻"
            };
        }

        if (audioInfo.duration < 3) {
            return {
                hasAudio: true,
                canUse: false,
                message: "音頻太短"
            };
        }

        return {
            hasAudio: true,
            canUse: true,
            message: "檢測到可用音頻",
            duration: audioInfo.duration,
            sample_rate: audioInfo.sample_rate
        };

    } catch (error) {
        return {
            hasAudio: false,
            message: "檢測失敗"
        };
    }
}

module.exports = {
    canUseForVoiceCloning,
    quickAudioCheck,
    checkFfmpeg
};
