# HeyGem 數字人生成器 - Web 客戶端

基於 Streamlit 的 HeyGem 數字人生成器 Web 界面，支援音頻和影片文件上傳，生成數字人影片。

## 項目結構

```
web-client/
├── app.py              # 主應用程式 (Streamlit 界面)
├── api_client.py       # API 客戶端 (與後端服務通信)
├── config.py           # 配置文件 (支援環境變數)
├── requirements.txt    # Python 依賴
├── .env.example        # 環境變數範例
├── .gitignore          # Git 忽略文件
├── docker-compose.yml  # Docker 容器編排
├── Dockerfile          # Docker 鏡像構建
├── README.md           # 項目說明 (本文件)
└── USAGE.md            # 簡單使用說明
```

## 快速開始

### Docker 部署 (推薦)

```bash
# 啟動所有服務
docker compose up -d

# 檢查服務狀態
docker ps

# 查看日誌
docker logs heygem-gen-video
```

Web 界面將在 http://localhost:8501 啟動。

### 本地開發

```bash
# 1. 安裝依賴
pip install -r requirements.txt

# 2. 設置服務器地址
export HEYGEM_SERVER_HOST=你的服務器IP

# 3. 運行應用
streamlit run app.py
```

## 配置說明

### 環境變數

- `HEYGEM_SERVER_HOST`: HeyGem 服務器 IP 地址 (默認: 35.234.24.82)
- `DOCKER_ENV`: Docker 環境標識 (自動檢測)

### 服務端點

- **影片生成服務**: `http://服務器IP:8383/easy`
- **TTS 語音合成**: `http://服務器IP:18180`
- **ASR 語音識別**: `http://服務器IP:18181`

## Docker 指令

### 基本操作

```bash
# 啟動服務
docker compose up -d

# 停止服務
docker compose down

# 重啟服務
docker compose restart

# 查看服務狀態
docker ps
```

### 日誌查看

```bash
# 查看所有服務日誌
docker compose logs

# 查看特定服務日誌
docker logs heygem-gen-video
docker logs heygem-tts
docker logs heygem-asr
docker logs heygem-web-client
```

### 服務管理

```bash
# 重啟特定服務
docker restart heygem-gen-video

# 進入容器
docker exec -it heygem-gen-video /bin/bash

# 查看容器資源使用
docker stats
```

## 功能特性

- 🎵 **音頻上傳**: 支援 WAV, MP3, M4A 格式
- 🎬 **影片上傳**: 支援 MP4, AVI, MOV 格式
- 🔄 **實時進度**: 顯示影片生成進度
- 📱 **響應式界面**: 適配不同螢幕尺寸
- 🐳 **Docker 部署**: 一鍵啟動所有服務
- 🔧 **靈活配置**: 環境變數配置服務器地址

## 故障排除

### 1. 服務無法啟動

```bash
# 檢查容器狀態
docker ps -a

# 查看錯誤日誌
docker logs 容器名稱
```

### 2. 端口衝突

```bash
# 檢查端口使用情況
netstat -tulpn | grep :8383
netstat -tulpn | grep :18180
netstat -tulpn | grep :10095
```

### 3. 連接問題

確認防火牆已開放必要端口：
- 8383 (影片生成服務)
- 18180 (TTS服務)
- 10095 (ASR服務)

## 系統要求

- Docker 20.10+
- Docker Compose 2.0+
- 至少 8GB RAM
- NVIDIA GPU (用於 AI 服務)

## 開發

### 本地開發環境

```bash
# 克隆項目
git clone <repository>

# 進入目錄
cd web-client

# 安裝依賴
pip install -r requirements.txt

# 設置環境變數
export HEYGEM_SERVER_HOST=localhost

# 運行開發服務器
streamlit run app.py
```

### 修改配置

- 編輯 `config.py` 修改服務端點
- 編輯 `docker-compose.yml` 修改 Docker 配置
- 編輯 `.env` 文件設置環境變數

## 許可證

請參考主項目的許可證文件。
