"""
HeyGem 數字人生成器配置
支援本地和 Docker 環境自動檢測
"""

import os

# 環境檢測
IS_DOCKER = bool(os.getenv('DOCKER_ENV'))

# 根據環境設置服務器配置
if IS_DOCKER:
    # Docker 容器環境 - 使用容器服務名
    REMOTE_HOST = "container-network"
    API_ENDPOINTS = {
        "face2face": "http://heygem-gen-video:8383/easy",  # 影片生成服務
        "tts": "http://heygem-tts:8080",                    # TTS語音合成服務  
        "asr": "http://heygem-asr:10095"                    # ASR語音識別服務
    }
else:
    # 本地開發環境 - 連接到本地 Docker 服務
    REMOTE_HOST = os.getenv('HEYGEM_SERVER_HOST', 'localhost')  # 默認連接本地
    API_ENDPOINTS = {
        "face2face": f"http://{REMOTE_HOST}:8383/easy",  # 影片生成服務
        "tts": f"http://{REMOTE_HOST}:18180",           # TTS語音合成服務
        "asr": f"http://{REMOTE_HOST}:10095"            # ASR語音識別服務
    }

# 應用設置（兩個環境共用）
APP_CONFIG = {
    "title": "HeyGem 數字人生成器",
    "description": "上傳音頻和影片文件，生成數字人影片",
    "max_file_size": 100 * 1024 * 1024,  # 100MB
    "supported_audio_formats": [".wav", ".mp3", ".m4a"],
    "supported_video_formats": [".mp4", ".avi", ".mov"],
    "poll_interval": 2,  # 輪詢間隔（秒）
    "timeout": 1200      # 請求超時時間（秒）- 增加到ˊ20分鐘
}

# 調試模式
DEBUG = True

# 環境信息（用於顯示）
ENV_INFO = {
    "type": "Docker 容器" if IS_DOCKER else "本地開發",
    "host": REMOTE_HOST,
    "endpoints": API_ENDPOINTS
}
