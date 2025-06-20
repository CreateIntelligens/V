# HeyGem TTS 服務備份與修復

## 📋 完成的工作

### 1. TTS 服務代碼提取 ✅
- **提取位置**: `./tts-extracted/`
- **原始服務**: Docker 容器 `heygem-tts` 
- **提取內容**: 完整的 Fish Speech TTS 服務代碼

### 2. 問題診斷與修復 🔧
- **發現問題**: 原始 TTS 服務在處理 `None` 值時出錯
- **錯誤位置**: `views_guiji.py` 第 160 行
- **修復文件**: `./tts-extracted/server/views_guiji_fixed.py`

### 3. 簡化 TTS 服務器 🚀
- **文件**: `./tts-extracted/simple_tts_server.py`
- **功能**: FastAPI 基礎 TTS 服務器，用於開發測試
- **端口**: 8080
- **特色**: 
  - 生成測試音頻文件
  - 完整的 API 文檔
  - CORS 支援

### 4. Express API 修復 🔗
- **文件**: `./web-vue/server.js`
- **修復內容**: TTS API 調用格式
- **改進**:
  - 正確的請求參數格式
  - 完善的錯誤處理
  - 音頻文件保存機制

### 5. 測試界面 🎯
- **文件**: `./tts-test.html`
- **功能**: 完整的 TTS 測試界面
- **支援**: 多種 API 端點測試

## 🏗️ 架構說明

```
前端測試頁面 (tts-test.html)
       ↓
Express API 層 (web-vue/server.js:3000)
       ↓
TTS 服務選擇:
├── 原始服務 (Docker:18180) - 需修復
├── 簡化服務 (simple_tts_server.py:8080) - 測試用
└── 修復版本 (views_guiji_fixed.py) - 生產用
```

## 🚀 使用方法

### 方法一：測試簡化服務
```bash
# 1. 安裝依賴
cd tts-extracted
pip install -r requirements.txt

# 2. 啟動簡化 TTS 服務
python simple_tts_server.py

# 3. 打開測試頁面
open tts-test.html
# 選擇 "簡化 TTS 服務 (端口 8080)"
```

### 方法二：修復原始服務
```bash
# 1. 停止原始容器
docker stop heygem-tts

# 2. 替換修復文件
docker cp ./tts-extracted/server/views_guiji_fixed.py heygem-tts:/code/tools/server/views_guiji.py

# 3. 重啟容器
docker start heygem-tts
```

### 方法三：完整 Web 應用
```bash
# 1. 啟動 Vue 應用
cd web-vue
npm install
npm run dev

# 2. 打開測試頁面
open tts-test.html
# 選擇 "Express API (端口 3000)"
```

## 📁 文件結構

```
./
├── tts-extracted/                 # TTS 服務備份
│   ├── server/
│   │   ├── views_guiji.py        # 原始文件
│   │   └── views_guiji_fixed.py  # 修復版本
│   ├── simple_tts_server.py      # 簡化服務器
│   ├── requirements.txt          # Python 依賴
│   └── [其他 TTS 相關文件]
├── web-vue/
│   └── server.js                 # 修復後的 Express API
├── tts-test.html                 # 測試界面
└── TTS_BACKUP_README.md          # 本文檔
```

## 🔧 主要修復內容

### 1. views_guiji.py 修復
```python
# 原始代碼 (有問題)
if '|||' in reference_audio:  # reference_audio 可能是 None

# 修復後
if reference_audio is None or reference_text is None:
    return []
if not reference_audio.strip() or not reference_text.strip():
    return []
if '|||' in reference_audio:
    # 處理邏輯...
```

### 2. Express API 修復
```javascript
// 修復前：錯誤的參數格式
const data = {
  speaker: voiceConfig.speaker || uuidv4(),
  // ... 錯誤格式
};

// 修復後：正確的參數格式
const data = {
  text: text.trim(),
  format: 'wav',
  chunk_length: 200,
  // ... 正確格式
};
```

## 🎯 下一步計劃

### 優先級 1: TTS 功能完善
- [ ] 聲音克隆功能 (參考音頻上傳)
- [ ] 語調控制 (情感、語速)
- [ ] 多語言支援
- [ ] 批次處理

### 優先級 2: 前端整合
- [ ] Vue 組件開發
- [ ] TTS 頁面設計
- [ ] 音頻播放器組件
- [ ] 進度顯示

### 優先級 3: 系統優化
- [ ] 音頻文件清理機制
- [ ] 錯誤處理優化
- [ ] 性能監控
- [ ] 日誌記錄

## 🐛 已知問題

1. **原始 TTS 服務**: 需要參考音頻才能正常工作
2. **簡化服務**: 只生成測試音頻，非真實語音
3. **Express API**: 需要 TTS 服務正常運行

## 💡 技術要點

### TTS API 正確格式
```json
{
  "text": "要轉換的文本",
  "format": "wav",
  "chunk_length": 200,
  "max_new_tokens": 1024,
  "top_p": 0.7,
  "repetition_penalty": 1.2,
  "temperature": 0.7,
  "streaming": false,
  "normalize": true
}
```

### 聲音克隆格式
```json
{
  "text": "要轉換的文本",
  "reference_audio": "參考音頻路徑或URL",
  "reference_text": "參考音頻對應的文本",
  "format": "wav"
}
```

## 📞 聯繫方式

如有問題或需要進一步開發，請參考：
- TTS 服務文檔: `./tts-extracted/`
- 測試界面: `./tts-test.html`
- API 文檔: http://localhost:8080/docs (簡化服務)
