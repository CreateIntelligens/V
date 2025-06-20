# HeyGem 數字人生成器 - Web版本

基於 Node.js + Express + Vue 3 的 Web 版本，提供與 Electron 版本相同的功能。

## 🚀 功能特色

- **模特管理**：創建、預覽、管理數字人模特
- **影片生成**：選擇模特，輸入文字或上傳音頻，生成數字人影片
- **作品管理**：查看、編輯、下載生成的影片作品
- **語音合成**：支援 TTS 文字轉語音功能
- **響應式設計**：支援桌面和移動設備

## 📋 系統要求

- Node.js 16+ 
- npm 或 yarn
- 運行中的 HeyGem 後端服務（Docker 容器）

## 🛠 安裝和運行

### 方式一：Docker 運行（推薦）

```bash
cd web-vue

# 構建並啟動所有服務（包含 TTS、ASR、影片生成和 Web 前端）
docker-compose up -d

# 查看服務狀態
docker-compose ps

# 查看日誌
docker-compose logs -f heygem-web-vue

# 停止服務
docker-compose down
```

### 方式二：本地開發

#### 1. 安裝依賴

```bash
cd web-vue
npm install
```

#### 2. 開發模式運行

```bash
# 同時啟動前端和後端
npm run dev

# 或分別啟動
npm run server:dev  # 啟動 Express 後端 (端口 3000)
npm run client:dev  # 啟動 Vite 前端 (端口 5173)
```

#### 3. 生產模式運行

```bash
# 構建前端
npm run build

# 啟動生產服務器
npm start
```

## 🔧 配置

### 環境變量

創建 `.env` 文件來配置 API 端點：

```env
# API 服務端點
FACE2FACE_URL=http://localhost:8383/easy
TTS_URL=http://localhost:18180
ASR_URL=http://localhost:10095

# 服務器端口
PORT=3000
```

### Docker 服務

確保以下 Docker 服務正在運行：

```bash
# 檢查服務狀態
docker ps

# 應該看到以下容器：
# - heygem-gen-video (端口 8383)
# - heygem-tts (端口 18180)
# - heygem-asr (端口 10095)
```

## 📁 項目結構

```
web-vue/
├── server.js              # Express 後端服務器
├── vite.config.js         # Vite 配置
├── package.json           # 依賴和腳本
├── src/                   # Vue 前端源碼
│   ├── main.js           # 應用入口
│   ├── App.vue           # 根組件
│   ├── router/           # 路由配置
│   ├── views/            # 頁面組件
│   ├── components/       # 通用組件
│   ├── stores/           # 狀態管理
│   ├── api/              # API 客戶端
│   ├── i18n/             # 國際化
│   └── assets/           # 靜態資源
├── uploads/              # 上傳文件目錄
└── dist/                 # 構建輸出目錄
```

## 🌐 訪問地址

- **開發模式**：http://localhost:5173
- **生產模式**：http://localhost:3000

## 📖 使用說明

### 1. 創建模特

1. 點擊首頁的「創建模特」按鈕
2. 輸入模特名稱
3. 上傳包含人物的影片文件
4. 等待模特創建完成（包含語音訓練）

### 2. 生成影片

1. 點擊「創建影片」進入編輯頁面
2. 選擇一個已創建的模特
3. 選擇內容類型：
   - **文字轉語音**：輸入文字，使用模特的聲音
   - **上傳音頻**：直接上傳音頻文件
4. 設置項目名稱和高級選項
5. 點擊「生成影片」開始處理
6. 等待生成完成並下載結果

### 3. 管理作品

- 在首頁查看所有創建的影片和模特
- 點擊「編輯」重新編輯影片項目
- 點擊「刪除」移除不需要的內容

## 🔍 故障排除

### 常見問題

1. **無法連接到後端服務**
   - 檢查 Docker 容器是否正在運行
   - 確認端口配置是否正確

2. **文件上傳失敗**
   - 檢查文件大小是否超過限制（100MB）
   - 確認文件格式是否支援

3. **影片生成失敗**
   - 檢查 TTS 服務是否正常
   - 確認模特是否創建成功
   - 查看瀏覽器控制台錯誤信息

### 日誌查看

```bash
# 查看 Express 服務器日誌
npm run server:dev

# 查看 Docker 容器日誌
docker logs heygem-gen-video
docker logs heygem-tts
```

## 🤝 開發

### 添加新功能

1. 在 `src/views/` 添加新頁面
2. 在 `src/router/index.js` 添加路由
3. 在 `server.js` 添加 API 端點
4. 在 `src/api/index.js` 添加客戶端方法

### 技術棧

- **後端**：Node.js + Express + Multer
- **前端**：Vue 3 + Vite + TDesign
- **狀態管理**：Pinia
- **路由**：Vue Router
- **國際化**：Vue I18n
- **HTTP 客戶端**：Axios

## 📄 授權

與主項目相同的授權協議。
