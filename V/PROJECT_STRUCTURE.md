# HeyGem.ai 專案結構說明

## 📁 目錄結構

```
Duix.Heygem/
├── 📂 web-vue/                    # 主要的 Web 應用程式
│   ├── docker-compose.yml         # Docker 編排配置 (主要使用這個)
│   ├── Dockerfile                 # Web 應用容器配置
│   ├── server.js                  # Node.js 後端服務器
│   ├── simple_audio_check.js      # 音頻檢測工具
│   └── src/                       # Vue.js 前端源碼
│       ├── views/models/           # 模特管理頁面 (支持分類顯示)
│       ├── views/video-edit/       # 影片編輯頁面
│       └── api/                    # API 接口
│
├── 📂 data/                       # 數據存儲目錄
│   ├── voice/                     # TTS 語音數據
│   └── face2face/                 # 影片生成數據
│
├── 📂 tools/                      # 開發工具
│   ├── audio-testing/             # 音頻檢測工具
│   ├── backup/                    # 備份文件
│   └── backup/original-configs/   # 原作者配置備份
│
├── 📂 docs/                       # 文檔和資源
│   ├── licenses/                  # 授權文件
│   ├── README.assets/             # README 圖片
│   └── README_zh.assets/          # 中文 README 圖片
│
├── 📂 deploy/                     # 部署配置
│   └── docker-compose.yml         # 簡化版 Docker 配置
│
├── 📂 tts-extracted/              # TTS 相關工具 (原作者)
├── 📂 web-client/                 # 客戶端版本 (原作者)
└── 📂 doc/                        # 原作者文檔
```

## 🚀 快速開始

### 方法1: 使用主要的 Docker Compose (推薦)

```bash
cd web-vue
docker-compose up -d
```

### 方法2: 使用簡化版 Docker Compose 

```bash
cd deploy
docker-compose up -d
```

## 📋 服務端口

- **Web 界面**: http://localhost:3000
- **TTS 服務**: http://localhost:18180 
- **ASR 服務**: http://localhost:10095
- **影片生成**: http://localhost:8383

## 新功能特色

### 智能雙模特系統
- **人物模特**: 用於影片生成
- **🎤 聲音模特**: 用於語音合成
- **自動檢測**: 根據音頻質量智能創建

### 模特管理頁面
- 分類顯示人物和聲音模特
- 清晰的類型標識和圖標
- 音頻質量評估和檢測報告

### 影片編輯頁面
- 只顯示人物模特（用於影片生成）
- 自動選擇可用模特
- 支持文字轉語音和音頻上傳

## 🔧 開發模式

Web 應用支持掛載模式，修改代碼會自動更新：

```yaml
volumes:
  - .:/app                    # 掛載源碼
  - /app/node_modules         # 排除 node_modules
  - ../data:/code/data        # 數據目錄
```

## 📝 技術棧

- **前端**: Vue.js + TDesign UI
- **後端**: Node.js + Express
- **容器**: Docker + Docker Compose
- **AI 服務**: 
  - TTS: Fish Speech
  - ASR: Fun ASR
  - Video: HeyGem.ai

## 🗂️ 文件說明

### 主要文件
- `web-vue/server.js` - 修復後的主服務器
- `web-vue/simple_audio_check.js` - 無依賴音頻檢測
- `web-vue/docker-compose.yml` - 完整的 Docker 配置

### 備份文件
- `tools/backup/server_fixed.js` - 服務器修復版本
- `tools/backup/original-configs/` - 原作者配置
- `tools/audio-testing/` - 音頻檢測開發工具

## 🌟 使用建議

1. **開發**: 使用 `web-vue/docker-compose.yml`
2. **生產**: 可以根據需要調整環境變數
3. **備份**: 重要修改前先備份到 `tools/backup/`
4. **清理**: 可以移除 `src/`, `build/` 等原作者 Electron 相關文件

---

**最後更新**: 2025-06-20
**維護者**: AI Assistant
