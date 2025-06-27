# HeyGem AI 數字人生成平台

一個整合了現代化前端界面和強大後端功能的 AI 數字人生成平台，支援多 TTS 服務、影片生成和模特管理。

> 📋 **專案結構說明**: 詳細的目錄結構和開發指南請參考 [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)

## 🚀 功能特色

### 前端界面
- **現代化 React + TypeScript 界面**：使用 shadcn/ui 組件庫
- **響應式設計**：支援桌面和行動裝置
- **即時預覽**：支援音頻播放和影片預覽
- **拖拽上傳**：直觀的文件上傳體驗

### 核心功能
- **模特管理**：創建、編輯、刪除數字人模特
- **語音合成**：基於 Fish Speech 的高品質 TTS
- **影片生成**：Face2Face 技術驅動的數字人影片
- **文件管理**：自動清理和存儲管理
- **任務追蹤**：即時查看生成進度

## 🏗️ 系統架構

```
HeyGem Platform
├── 前端 (React + TypeScript)
│   ├── 首頁 - 功能概覽
│   ├── 模特管理 - 創建和管理數字人
│   ├── 影音生成器 - 生成數字人影片
│   └── 作品庫 - 查看生成結果
├── 後端 (Express.js + TypeScript)
│   ├── RESTful API
│   ├── 文件上傳處理
│   ├── 模特數據管理
│   └── 任務狀態追蹤
└── AI 服務
    ├── TTS 服務 (Fish Speech)
    ├── Face2Face 影片生成
    └── ASR 語音識別 (可選)
```

## 🛠️ 技術棧

### 前端
- **React 18** - 用戶界面框架
- **TypeScript** - 類型安全
- **Vite** - 快速構建工具
- **shadcn/ui** - 現代化組件庫
- **Tailwind CSS** - 樣式框架
- **React Query** - 數據狀態管理
- **Wouter** - 輕量級路由

### 後端
- **Express.js** - Web 框架
- **TypeScript** - 類型安全
- **Multer** - 文件上傳
- **fs-extra** - 文件系統操作
- **Axios** - HTTP 客戶端

### AI 服務
- **Fish Speech** - 語音合成
- **Face2Face** - 影片生成
- **CUDA** - GPU 加速

### 基礎設施
- **Docker** - 容器化部署
- **Redis** - 快取和任務隊列
- **PostgreSQL** - 數據持久化 (可選)
- **Nginx** - 反向代理 (生產環境)

## 📦 快速開始

### 前置需求
- Docker 和 Docker Compose
- NVIDIA GPU (用於 AI 服務)
- NVIDIA Container Toolkit

### 開發環境

1. **克隆專案**
```bash
git clone <repository-url>
cd heygem-platform
```

2. **啟動開發服務**
```bash
# 啟動所有服務
docker compose up -d

# 或者只啟動 Web 應用 (用於前端開發)
npm run dev
```

3. **訪問應用**
- Web 界面: http://localhost:5000
- TTS API: http://localhost:18180
- Redis: http://localhost:6379
- PostgreSQL: http://localhost:5432

### 生產環境

1. **構建和部署**
```bash
# 構建所有服務
docker compose build

# 啟動服務
docker compose up -d
```

2. **查看服務狀態**
```bash
# 查看運行狀態
docker compose ps

# 查看日誌
docker compose logs -f
```

## 🔧 配置說明

### 環境變量
```bash
# 應用配置
NODE_ENV=production
PORT=5000

# AI 服務 URL
TTS_URL=http://tts-server:18180
FACE2FACE_URL=http://face2face-server:8383/easy
ASR_URL=http://asr-server:10095

# 數據庫配置 (可選)
POSTGRES_DB=heygem
POSTGRES_USER=heygem_user
POSTGRES_PASSWORD=heygem_password

# Redis 配置
REDIS_URL=redis://redis:6379
```

### 文件清理配置
```javascript
FILE_CLEANUP_CONFIG = {
  "ENABLE_CLEANUP": true,
  "RESULT_FILE_TTL": 24 * 3600,  // 24小時
  "UPLOAD_FILE_TTL": 3600,       // 1小時
  "MAX_RESULT_FILES": 50,
  "MAX_UPLOAD_FILES": 20,
  "CLEANUP_INTERVAL": 3600,      // 1小時
}
```

## 📚 API 文檔

### 模特管理
```bash
# 獲取模特列表
GET /api/models?page=1&pageSize=20&name=&type=

# 創建模特
POST /api/model/create
{
  "name": "模特名稱",
  "type": "person|voice",
  "description": "描述",
  "videoPath": "影片文件路徑",
  "audioPath": "音頻文件路徑"
}

# 刪除模特
DELETE /api/model/:id
```

### 文件上傳
```bash
# 上傳文件
POST /api/upload
Content-Type: multipart/form-data
{
  "file": <文件>,
  "type": "audio|video"
}
```

### 影片生成
```bash
# 提交影片生成任務
POST /api/video/submit
{
  "audioPath": "音頻文件路徑",
  "videoPath": "影片文件路徑",
  "options": {
    "chaofen": 0,
    "watermark": 0,
    "pn": 1
  }
}

# 查詢任務狀態
GET /api/video/status/:taskCode
```

### TTS 語音合成
```bash
# 生成語音
POST /api/tts/generate
{
  "text": "要合成的文本",
  "voiceConfig": {
    "reference_audio": "參考音頻路徑",
    "reference_text": "參考文本"
  }
}
```

## 🔍 故障排除

### 常見問題

1. **GPU 不可用**
```bash
# 檢查 NVIDIA 驅動
nvidia-smi

# 檢查 Docker GPU 支援
docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi
```

2. **端口衝突**
```bash
# 檢查端口使用情況
netstat -tulpn | grep :5000

# 修改 docker-compose.yml 中的端口映射
```

3. **依賴安裝失敗**
```bash
# 清理 Docker 快取
docker system prune -a

# 重新構建
docker-compose build --no-cache
```

### 日誌查看
```bash
# 查看所有服務日誌
docker-compose logs -f

# 查看特定服務日誌
docker-compose logs -f heygem-web
docker-compose logs -f tts-server
docker-compose logs -f face2face-server
```

## 🤝 開發指南

### 前端開發
```bash
# 安裝依賴
npm install

# 啟動開發服務器
npm run dev

# 構建生產版本
npm run build

# 類型檢查
npm run check
```

### 後端開發
```bash
# 啟動開發模式
npm run dev

# 構建
npm run build

# 啟動生產模式
npm start
```

### 代碼規範
- 使用 TypeScript 進行類型檢查
- 遵循 ESLint 規則
- 使用 Prettier 格式化代碼
- 編寫單元測試

## 📄 授權協議

本專案採用 MIT 授權協議。詳見 [LICENSE](LICENSE) 文件。

## 🙏 致謝

- [Fish Speech](https://github.com/fishaudio/fish-speech) - 語音合成技術
- [shadcn/ui](https://ui.shadcn.com/) - UI 組件庫
- [React](https://reactjs.org/) - 前端框架
- [Express.js](https://expressjs.com/) - 後端框架

## 📞 支援

如有問題或建議，請：
1. 查看 [常見問題](docs/FAQ.md)
2. 提交 [Issue](https://github.com/your-repo/issues)
3. 聯繫開發團隊

---

**HeyGem AI** - 讓數字人創作變得簡單而強大 🚀
