# HeyGem AI 專案結構

## 📁 目錄結構

```
HeyGem/
├── 📄 配置文件
│   ├── docker-compose.yml      # Docker 服務編排
│   ├── Dockerfile              # 主應用容器配置
│   ├── package.json            # Node.js 依賴
│   ├── tsconfig.json           # TypeScript 配置
│   ├── vite.config.ts          # Vite 構建配置
│   ├── tailwind.config.ts      # Tailwind CSS 配置
│   ├── postcss.config.js       # PostCSS 配置
│   └── components.json         # shadcn/ui 組件配置
│
├── 🎨 前端應用 (client/)
│   ├── index.html              # HTML 入口
│   ├── src/
│   │   ├── main.tsx            # React 應用入口
│   │   ├── App.tsx             # 主應用組件
│   │   ├── index.css           # 全局樣式
│   │   ├── components/         # UI 組件
│   │   │   ├── navigation.tsx  # 導航組件
│   │   │   ├── model-grid.tsx  # 模特網格
│   │   │   ├── file-upload.tsx # 文件上傳
│   │   │   └── ui/             # shadcn/ui 組件
│   │   ├── pages/              # 頁面組件
│   │   │   ├── home.tsx        # 首頁
│   │   │   ├── models.tsx      # 模特管理
│   │   │   ├── video-editor.tsx# 影音生成器
│   │   │   └── gallery.tsx     # 作品庫
│   │   ├── hooks/              # React Hooks
│   │   └── lib/                # 工具函數
│
├── 🔧 後端服務 (server/)
│   ├── index.ts                # 服務器入口
│   ├── routes.ts               # API 路由 (TTS 中間層)
│   ├── storage.ts              # 存儲配置
│   └── vite.ts                 # Vite 開發服務器
│
├── 🔗 共享類型 (shared/)
│   └── schema.ts               # TypeScript 類型定義
│
├── 🎤 TTS 服務 (tts-services/)
│   ├── Dockerfile              # TTS 容器配置
│   ├── requirements.txt        # Python 依賴
│   ├── main.py                 # TTS Gateway 入口
│   ├── README.md               # TTS 服務說明
│   └── services/               # TTS 服務實現
│       ├── tts_service_1.py    # 快速合成服務
│       ├── tts_service_2.py    # 高品質合成服務
│       └── tts_service_3.py    # 情感合成服務
│
├── 📚 參考代碼 (V/)
│   ├── tts-extracted/          # Fish Speech 實現參考
│   ├── web-client/             # 舊版 Web 客戶端參考
│   └── docs/                   # 原始文檔
│
└── 💾 數據存儲
    ├── data/                   # 應用數據
    │   ├── database/           # JSON 數據庫
    │   ├── voice/              # 語音文件
    │   └── face2face/          # 影片文件
    └── uploads/                # 用戶上傳文件
```

## 🐳 Docker 服務架構

### 服務列表
1. **heygem-web** (端口 5000)
   - React 前端 + Express 後端
   - TTS 中間層路由
   - 文件上傳和管理

2. **tts-server** (端口 18180)
   - Fish Speech TTS 服務
   - 原始的語音合成功能

3. **heygem-tts-services** (端口 18200-18203)
   - 自定義 TTS 服務集合
   - 內建 Gateway 和多服務支援

### 服務通信
```
前端 (React) 
    ↓ HTTP API
後端 (Express) - TTS 中間層
    ↓ 路由分發
┌─────────────────┬─────────────────┐
│   Fish Speech   │ HeyGem TTS      │
│   tts-server    │ heygem-tts-     │
│   :18180        │ services :18200 │
└─────────────────┴─────────────────┘
```

## 🔄 開發工作流

### 1. 啟動開發環境
```bash
# 啟動所有服務
docker compose up -d

# 查看服務狀態
docker compose ps

# 查看日誌
docker compose logs -f
```

### 2. 開發 TTS 服務
```bash
# 編輯 TTS 服務代碼
vim tts-services/services/tts_service_1.py

# 代碼會自動熱重載，無需重啟容器
```

### 3. 前端開發
```bash
# 前端代碼也支援熱重載
vim client/src/pages/models.tsx
```

### 4. API 測試
```bash
# 測試 Fish Speech
curl -X POST http://localhost:5000/api/tts/generate \
  -H "Content-Type: application/json" \
  -d '{"text": "你好", "service": "fish-speech"}'

# 測試自定義 TTS
curl -X POST http://localhost:5000/api/tts/generate \
  -H "Content-Type: application/json" \
  -d '{"text": "你好", "service": "my-service1"}'
```

## 📝 重要文件說明

### 配置文件
- **docker-compose.yml**: 定義所有服務和網路配置
- **package.json**: Node.js 依賴和腳本
- **tsconfig.json**: TypeScript 編譯配置

### 核心代碼
- **server/routes.ts**: TTS 中間層路由，負責服務分發
- **tts-services/main.py**: TTS Gateway，管理多個 TTS 服務
- **client/src/App.tsx**: React 主應用組件

### 數據存儲
- **data/database/models.json**: 模特數據 (JSON 格式)
- **data/voice/**: 語音文件存儲
- **uploads/**: 用戶上傳文件

## 🎯 擴展指南

### 添加新的 TTS 服務
1. 在 `tts-services/services/` 創建新服務文件
2. 在 `tts-services/main.py` 註冊服務
3. 重啟 `heygem-tts-services` 容器

### 添加新的 API 端點
1. 在 `server/routes.ts` 添加路由
2. 在前端添加對應的 API 調用

### 修改前端界面
1. 編輯 `client/src/` 下的組件文件
2. 使用 shadcn/ui 組件保持一致性

## 🔍 故障排除

### 常見問題
1. **容器啟動失敗**: 檢查 `docker compose logs <service-name>`
2. **TTS 服務無響應**: 檢查 `docker compose logs heygem-tts-services`
3. **前端無法訪問**: 確認端口 5000 未被占用

### 調試技巧
```bash
# 進入容器調試
docker compose exec heygem-web bash
docker compose exec heygem-tts-services bash

# 查看容器資源使用
docker stats

# 重建特定服務
docker compose build heygem-tts-services
docker compose up -d heygem-tts-services
```

---

**HeyGem AI** - 模組化、可擴展的數字人生成平台 🚀
