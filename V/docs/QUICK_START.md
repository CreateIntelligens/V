# 🚀 HeyGem.ai 快速開始指南

## 一鍵啟動

```bash
# 從專案根目錄啟動
docker-compose up -d
```

## 訪問服務

- 🌐 **主界面**: http://localhost:3000
- 🎤 **TTS API**: http://localhost:18180
- 👂 **ASR API**: http://localhost:10095  
- 🎬 **影片生成**: http://localhost:8383

## 新功能亮點

### 智能雙模特系統
- 上傳一個影片 → 自動創建人物模特 + 聲音模特
- 智能音頻檢測，避免創建無用的聲音模特
- 清晰的分類管理界面

### 🎨 優化的用戶界面
- **模特管理**: 分類顯示，類型一目了然
- **影片編輯**: 只顯示可用的人物模特
- **響應式設計**: 支持各種屏幕尺寸

### 🔧 開發者友好
- **掛載模式**: 修改代碼立即生效
- **無依賴**: 音頻檢測不需要 ffmpeg
- **完整日誌**: 詳細的操作記錄

## 目錄說明

```
📁 專案根目錄
├── 🔥 web-vue/           # 主要應用 (這裡開始)
├── 📊 data/              # 數據存儲
├── 🛠️  tools/            # 開發工具
├── 📚 docs/              # 文檔資源
└── 🚀 deploy/            # 部署配置
```

## 故障排除

### 容器問題
```bash
# 重新構建
docker-compose build --no-cache

# 查看日誌
docker-compose logs heygem-web-vue
```

### GPU 問題
```bash
# 檢查 NVIDIA 運行時
docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi
```

### 端口衝突
```bash
# 檢查端口使用
netstat -tulpn | grep :3000
```

## 更多資訊

- 📋 **詳細結構**: 查看 `PROJECT_STRUCTURE.md`
- 📖 **原始文檔**: 查看 `README.md` 和 `README_zh.md`
- 🔧 **工具說明**: 查看 `tools/` 目錄

---
**快速上手，立即開始您的 AI 影片創作！** 🎉
