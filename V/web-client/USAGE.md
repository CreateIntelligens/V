# 使用說明

## 🚀 完整部署步驟

### 1. 在服務器上部署
```bash
# 進入項目目錄
cd /path/to/web-client

# 啟動所有服務
docker compose up -d

# 檢查服務狀態
docker ps
```

### 2. 開放防火牆端口
需要開放以下端口：
- **8501** - Web 客戶端界面
- **8383** - 影片生成服務
- **18180** - TTS 服務
- **10095** - ASR 服務

#### Ubuntu/Debian (ufw)
```bash
sudo ufw allow 8501
sudo ufw allow 8383
sudo ufw allow 18180
sudo ufw allow 10095
sudo ufw reload
```

#### 雲服務商安全組
如果使用 GCP/AWS/Azure，需要在控制台配置安全組開放這些端口。

### 3. 訪問服務
- **Web 界面**: http://你的服務器IP:8501
- **影片生成 API**: http://你的服務器IP:8383

## 🔧 Docker 管理指令

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
docker logs heygem-web-client
docker logs heygem-gen-video
docker logs heygem-tts
docker logs heygem-asr
```

### 故障排除
```bash
# 檢查容器狀態
docker ps -a

# 重建並啟動服務
docker compose up -d --build

# 查看端口使用情況
netstat -tulpn | grep :8501
```

## 📱 本地開發

如果只想在本地運行 Web 客戶端：

```bash
# 1. 設置服務器地址
export HEYGEM_SERVER_HOST=你的服務器IP

# 2. 安裝依賴
pip install -r requirements.txt

# 3. 運行應用
streamlit run app.py
```

## ⚠️ 常見問題

### 1. 無法訪問 Web 界面 (8501)
- 檢查 Docker 容器是否運行：`docker ps`
- 檢查防火牆是否開放 8501 端口
- 檢查雲服務商安全組設置

### 2. MP4 文件無法下載
- 檢查 8383 端口是否開放
- 檢查影片生成服務是否正常運行：`docker logs heygem-gen-video`

### 3. 服務啟動失敗
- 檢查 GPU 驅動是否安裝
- 檢查 Docker 是否支持 NVIDIA runtime
- 查看錯誤日誌：`docker compose logs`

就這麼簡單！
