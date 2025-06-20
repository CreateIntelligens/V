# AI Model Studio

一個用於創建和管理AI模特（聲音和人物模特）並生成音頻和視頻內容的Web應用程序。

## 功能特點

- 🎤 **聲音模特創建**: 支持多語言聲音模型訓練
- 👤 **人物模特創建**: 支持個性化角色模型訓練  
- 🎵 **音頻生成**: 基於訓練的聲音模特生成語音
- 🎬 **視頻生成**: 結合聲音和人物模特創建動態視頻
- 📁 **文件管理**: 支持多種格式的訓練素材上傳
- 🎛️ **實時預覽**: 音頻播放器和進度跟踪

## 技術棧

- **前端**: React + TypeScript + Vite + Tailwind CSS
- **後端**: Node.js + Express + TypeScript
- **UI組件**: Shadcn/ui + Radix UI
- **狀態管理**: TanStack Query
- **路由**: Wouter
- **文件上傳**: Multer
- **容器化**: Docker + Docker Compose

## 快速開始

### 本地開發

1. 安裝依賴:
```bash
npm install
```

2. 啟動開發服務器:
```bash
npm run dev
```

3. 打開瀏覽器訪問 `http://localhost:5000`

### Docker 部署

1. 構建並啟動所有服務:
```bash
docker-compose up -d
```

2. 訪問應用:
- Web界面: `http://localhost:5000`
- TTS服務: `http://localhost:8080`

### 生產部署

1. 構建項目:
```bash
npm run build
```

2. 啟動生產服務器:
```bash
npm start
```

## 項目結構

```
├── client/                 # 前端源碼
│   ├── src/
│   │   ├── components/     # UI組件
│   │   ├── pages/          # 頁面組件
│   │   └── lib/           # 工具函數
├── server/                 # 後端源碼
│   ├── index.ts           # 服務器入口
│   ├── routes.ts          # API路由
│   ├── storage.ts         # 數據存儲
│   └── vite.ts           # Vite配置
├── shared/                 # 共享類型定義
│   └── schema.ts          # 數據模型
├── uploads/               # 文件上傳目錄
├── data/                  # 數據存儲目錄
├── Dockerfile             # 主應用容器
├── Dockerfile.tts         # TTS服務容器
└── docker-compose.yml     # Docker編排配置
```

## API 接口

### 模特管理
- `GET /api/models` - 獲取模特列表
- `POST /api/models` - 創建新模特
- `GET /api/models/:id` - 獲取模特詳情
- `PATCH /api/models/:id` - 更新模特
- `DELETE /api/models/:id` - 刪除模特

### 內容生成
- `POST /api/generate/audio` - 生成音頻
- `POST /api/generate/video` - 生成視頻
- `GET /api/content` - 獲取生成內容列表

### 文件上傳
- `POST /api/upload` - 上傳訓練素材

## 環境變量

```bash
NODE_ENV=development          # 運行環境
PORT=5000                    # 服務端口
TTS_URL=http://localhost:8080 # TTS服務地址
VIDEO_GEN_URL=http://localhost:8383 # 視頻生成服務地址
```

## 開發說明

### 添加新功能

1. 在 `shared/schema.ts` 中定義數據模型
2. 在 `server/storage.ts` 中實現存儲接口
3. 在 `server/routes.ts` 中添加API路由
4. 在 `client/src/components/` 中創建UI組件

### 代碼規範

- 使用 TypeScript 進行類型檢查
- 遵循 ESLint 代碼規範
- 使用 Prettier 進行代碼格式化
- 組件使用函數式組件和 React Hooks

## 許可證

MIT License