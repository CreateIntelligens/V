# 🐳 Docker 配置說明

## 📂 文件結構

```
Duix.Heygem/
├── 🐳 docker-compose.yml      # 主要的 Docker Compose 配置
├── 🐳 Dockerfile.web          # Web 應用的 Dockerfile
├── 📊 data/                   # 數據存儲目錄
└── 🔥 web-vue/                # Web 應用源碼
```

## 🚀 快速啟動

```bash
# 從專案根目錄啟動所有服務
docker-compose up -d

# 重新構建並啟動
docker-compose build --no-cache
docker-compose up -d

# 查看日誌
docker-compose logs -f heygem-web-vue
```

## 🔧 配置特色

### **🎯 整包掛載**
```yaml
volumes:
  - ./web-vue:/app              # 整個 web-vue 目錄掛載
  - /app/node_modules           # 排除 node_modules
  - ./data:/app/data            # 數據目錄統一掛載
```

### **🏗️ 智能構建**
- 容器啟動時自動檢測是否需要構建前端
- 如果沒有 `dist` 目錄，自動執行 `npm run build`
- 構建完成後提供靜態文件服務

### **📡 服務端口**
| 服務 | 端口 | 說明 |
|-----|------|------|
| Web 界面 | 3000 | 主要應用入口 |
| TTS 服務 | 18180 | 語音合成 API |
| ASR 服務 | 10095 | 語音識別 API |
| 影片生成 | 8383 | 影片生成 API |

## 📋 服務配置

### **heygem-web-vue**
- **構建**: `./web-vue` 目錄
- **Dockerfile**: `Dockerfile.web`
- **掛載**: 整個應用 + 數據目錄
- **命令**: `npm start`

### **heygem-tts**
- **鏡像**: `guiji2025/fish-speech-ziming`
- **GPU**: 需要 NVIDIA 運行時
- **數據**: `./data/voice` 掛載到 `/code/data`

### **heygem-asr**
- **鏡像**: `guiji2025/fun-asr`
- **GPU**: 需要 NVIDIA 運行時
- **特殊**: `privileged: true`

### **heygem-gen-video**
- **鏡像**: `guiji2025/heygem.ai`
- **GPU**: 需要 NVIDIA 運行時
- **數據**: `./data/face2face` 掛載到 `/code/data`
- **內存**: `8GB` 共享內存

## 🔍 故障排除

### **模塊解析錯誤**
```bash
# 如果出現 "Failed to resolve module specifier" 錯誤
docker-compose exec heygem-web-vue npm run build
docker-compose restart heygem-web-vue
```

### **權限問題**
```bash
# 確保數據目錄有正確權限
sudo chown -R $(id -u):$(id -g) data/
```

### **GPU 問題**
```bash
# 檢查 NVIDIA Docker 支持
docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi
```

## 📁 備份文件位置

所有舊的配置文件都已移動到：
- `tools/backup/docker-compose.yml` - web-vue 原配置
- `tools/backup/original-configs/` - 原作者配置

## 🎯 訪問應用

主要應用地址: **http://localhost:3000**

---
**現在你可以從專案根目錄一鍵啟動所有服務！** 🎉
