#!/usr/bin/env python3
"""
簡單的音頻適用性檢測工具
用於判斷音頻是否適合聲音克隆
"""

import os
import sys
import subprocess
import json
from pathlib import Path

def check_ffmpeg():
    """檢查 ffmpeg 是否可用"""
    try:
        subprocess.run(['ffmpeg', '-version'], 
                      capture_output=True, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def extract_audio_info(video_file):
    """使用 ffprobe 提取音頻信息"""
    try:
        cmd = [
            'ffprobe', '-v', 'quiet', '-print_format', 'json',
            '-show_format', '-show_streams', video_file
        ]
        
        # 修復：設置編碼和錯誤處理
        result = subprocess.run(cmd, capture_output=True, text=True, 
                              check=True, encoding='utf-8', errors='ignore')
        
        if not result.stdout or result.stdout.strip() == '':
            return None, "ffprobe 沒有返回數據"
            
        data = json.loads(result.stdout)
        
        # 尋找音頻流
        audio_streams = []
        for stream in data.get('streams', []):
            if stream.get('codec_type') == 'audio':
                audio_streams.append(stream)
        
        if not audio_streams:
            return None, "沒有找到音頻流"
        
        # 獲取第一個音頻流的信息
        audio_stream = audio_streams[0]
        duration = float(data.get('format', {}).get('duration', 0))
        
        return {
            'duration': duration,
            'codec': audio_stream.get('codec_name', 'unknown'),
            'sample_rate': int(audio_stream.get('sample_rate', 0)),
            'channels': int(audio_stream.get('channels', 0)),
            'bit_rate': int(audio_stream.get('bit_rate', 0)) if audio_stream.get('bit_rate') else 0
        }, None
        
    except subprocess.CalledProcessError as e:
        return None, f"ffprobe 錯誤: {e}"
    except json.JSONDecodeError:
        return None, "解析音頻信息失敗"
    except Exception as e:
        return None, f"未知錯誤: {e}"

def check_audio_volume(video_file, duration_limit=10):
    """檢查音頻音量 (使用 ffmpeg)"""
    try:
        # 只分析前 N 秒，避免處理時間太長
        cmd = [
            'ffmpeg', '-i', video_file, '-t', str(duration_limit),
            '-af', 'volumedetect', '-f', 'null', '-'
        ]
        
        # 修復：設置編碼和錯誤處理
        result = subprocess.run(cmd, capture_output=True, text=True,
                              encoding='utf-8', errors='ignore')
        
        # 解析 volumedetect 輸出
        for line in result.stderr.split('\n'):
            if 'mean_volume:' in line:
                # 提取平均音量 (dB)
                try:
                    volume_db = float(line.split('mean_volume:')[1].split('dB')[0].strip())
                    return volume_db, None
                except (ValueError, IndexError):
                    continue
        
        return None, "無法檢測音量"
        
    except Exception as e:
        return None, f"音量檢測錯誤: {e}"

def can_use_for_voice_cloning(video_file):
    """
    判斷影片文件是否適合用於聲音克隆
    返回 (可用性, 詳細信息)
    """
    
    # 檢查文件是否存在
    if not os.path.exists(video_file):
        return False, "文件不存在"
    
    # 檢查 ffmpeg
    if not check_ffmpeg():
        return False, "系統缺少 ffmpeg，無法檢測音頻"
    
    print(f"🔍 正在檢測: {video_file}")
    
    # 1. 提取音頻基本信息
    audio_info, error = extract_audio_info(video_file)
    if error:
        return False, error
    
    if not audio_info:
        return False, "沒有音頻流"
    
    print(f"📊 音頻信息: {audio_info}")
    
    # 2. 檢查時長
    duration = audio_info['duration']
    if duration < 3:
        return False, f"音頻太短 ({duration:.1f}秒)，建議至少3秒"
    
    # 3. 檢查採樣率
    sample_rate = audio_info['sample_rate']
    if sample_rate < 8000:
        return False, f"採樣率太低 ({sample_rate}Hz)，建議至少8kHz"
    
    # 4. 檢查聲道
    channels = audio_info['channels']
    if channels == 0:
        return False, "音頻聲道信息異常"
    
    # 5. 檢查音量
    print("🔊 檢測音量...")
    volume_db, volume_error = check_audio_volume(video_file)
    
    if volume_error:
        print(f"⚠️ 音量檢測失敗: {volume_error}")
        # 音量檢測失敗不影響整體判斷
    elif volume_db is not None:
        if volume_db < -40:  # 音量太小
            return False, f"音量太小 ({volume_db:.1f}dB)，可能是靜音"
    
    # 通過所有檢查
    quality_info = []
    
    # 評估音質等級
    if sample_rate >= 22050:
        quality_info.append("✅ 高質量採樣率")
    elif sample_rate >= 16000:
        quality_info.append("🟨 中等採樣率")
    else:
        quality_info.append("🟧 基礎採樣率")
    
    if duration >= 10:
        quality_info.append("✅ 充足時長")
    elif duration >= 5:
        quality_info.append("🟨 適中時長")
    else:
        quality_info.append("🟧 較短時長")
    
    if volume_db is not None and volume_db > -20:
        quality_info.append("✅ 音量充足")
    elif volume_db is not None and volume_db > -30:
        quality_info.append("🟨 音量適中")
    
    return True, {
        'message': '適合用於聲音克隆',
        'duration': duration,
        'sample_rate': sample_rate,
        'channels': channels,
        'volume_db': volume_db,
        'quality_notes': quality_info
    }

def main():
    """命令行入口"""
    if len(sys.argv) != 2:
        print("用法: python audio_checker.py <影片/音頻文件>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    print("🎤 HeyGem 音頻適用性檢測工具")
    print("=" * 50)
    
    can_use, result = can_use_for_voice_cloning(file_path)
    
    if can_use:
        print("✅ 檢測結果: 適合聲音克隆")
        if isinstance(result, dict):
            print(f"📏 時長: {result['duration']:.1f}秒")
            print(f"🎵 採樣率: {result['sample_rate']}Hz")
            print(f"🔊 聲道: {result['channels']}")
            if result['volume_db'] is not None:
                print(f"📢 音量: {result['volume_db']:.1f}dB")
            
            print("\n質量評估:")
            for note in result['quality_notes']:
                print(f"  {note}")
    else:
        print("❌ 檢測結果: 不適合聲音克隆")
        print(f"原因: {result}")
        print("\n建議: 使用預設聲音庫")
    
    print("=" * 50)

if __name__ == "__main__":
    main()
