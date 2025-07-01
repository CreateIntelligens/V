# 優生學 TTS API 串接說明

## 概述

本專案已成功串接優生學 (ATEN AIVoice) TTS API，提供高品質的中文、英文、台語語音合成服務。

## 功能特色

- ✅ **多語言支援**: 中文 (zh-TW)、英文 (en)、台語 (TL、TB)
- ✅ **SSML 支援**: 完整的 SSML 標籤支援
- ✅ **語音參數調整**: 音調、語速、音量、停頓時間
- ✅ **多聲優模型**: 動態載入可用聲優
- ✅ **特殊字符處理**: 自動轉義 SSML 保留字符
- ✅ **速率限制**: 遵循 API 120/分鐘限制
- ✅ **錯誤處理**: 完善的錯誤處理和重試機制

## 環境設定

### 1. 獲取 API Token

1. 前往優生學官網: https://www.aivoice.com.tw
2. 註冊並登入帳號
3. 在 User Settings 中獲取 Access Token

### 2. 設定環境變數

複製 `.env.example` 為 `.env` 並設定：

```bash
# 優生學 TTS API 設定
EUGENES_API_TOKEN=your_api_token_here
EUGENES_BASE_URL=https://www.aivoice.com.tw/business/enterprise

# 如果是綠界付款客戶，改用:
# EUGENES_BASE_URL=https://www.aivoice.com.tw/atzone
```

### 3. 安裝依賴

```bash
pip install -r requirements.txt
```

## 使用方法

### 1. 基本語音合成

```python
from services.eugenes_service import EugenesService

# 初始化服務
service = EugenesService()
await service.initialize()

# 基本合成
result = await service.generate_speech(
    text="你好，這是優生學語音合成測試。",
    language="zh-TW"
)

if result["success"]:
    # 保存音頻
    with open("output.wav", "wb") as f:
        f.write(result["audio_data"])
```

### 2. 進階語音配置

```python
# 語音配置
voice_config = {
    "voice_name": "Aaron",        # 聲優名稱
    "pitch": 0.5,                 # 音調 (-2st ~ +2st)
    "rate": 1.1,                  # 語速 (0.8 ~ 1.2)
    "volume": 2.0,                # 音量 (-6dB ~ +6dB)
    "silence_scale": 1.0,         # 停頓時間 (0.8 ~ 1.2)
    "use_custom_poly": False      # 是否使用自定義多音字
}

result = await service.generate_speech(
    text="這是進階語音合成範例。",
    voice_config=voice_config,
    language="zh-TW"
)
```

### 3. 獲取可用聲優

```python
# 獲取所有可用聲優
voices = await service.get_available_voices()
print(f"可用聲優數量: {voices['total_count']}")

for voice in voices['voices']:
    print(f"聲優: {voice['name']} (ID: {voice['model_id']})")
```

### 4. 通過 HTTP API 使用

```bash
# 啟動服務
python main.py

# 發送 TTS 請求
curl -X POST "http://localhost:8080/api/tts/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "你好，這是優生學語音合成測試。",
    "service": "service3",
    "voice_config": {
      "voice_name": "Aaron",
      "pitch": 0.5,
      "rate": 1.1,
      "volume": 2.0
    },
    "language": "zh-TW"
  }' \
  --output output.wav
```

## 支援的 SSML 標籤

### 基本結構

```xml
<speak xmlns="http://www.w3.org/2001/10/synthesis" version="1.5" xml:lang="zh-TW">
  <voice name="Aaron">
    <prosody pitch="+0.5st" volume="+2dB" rate="1.1">
      你好，這是 SSML 範例。
    </prosody>
  </voice>
</speak>
```

### 支援的標籤

| 標籤 | 功能 | 範例 |
|------|------|------|
| `<speak>` | 根元素 | `<speak version="1.5" xml:lang="zh-TW">` |
| `<voice>` | 指定聲優 | `<voice name="Aaron">` |
| `<prosody>` | 調整音調、語速、音量 | `<prosody pitch="+1st" rate="1.2">` |
| `<break>` | 插入停頓 | `<break time="500ms"/>` |
| `<phoneme>` | 指定發音 | `<phoneme alphabet="bopomo" ph="ㄏㄨㄢˊ">` |
| `<lang>` | 指定語言 | `<lang lang_type="TW">` |
| `<say-as>` | 指定讀法 | `<say-as interpret-as="date">2023-12-19</say-as>` |

### 特殊字符轉義

| 字符 | 轉義 |
|------|------|
| `"` | `&quot;` |
| `&` | `&amp;` |
| `'` | `&apos;` |
| `<` | `&lt;` |
| `>` | `&gt;` |

## 測試

### 運行測試腳本

```bash
cd tts-services
python test_eugenes.py
```

測試腳本會執行以下測試：
1. 服務初始化測試
2. 健康檢查測試
3. 獲取服務信息測試
4. 獲取可用聲優測試
5. 語音合成測試
6. SSML 特殊字符處理測試

### 預期輸出

```
📖 優生學 TTS API 測試腳本
==================================================
🔗 測試 API 連接...
✅ API Token 已設定 (長度: 32)
✅ API 連接成功，獲得 X 個聲優模型

🧪 開始測試優生學 TTS 服務...
1️⃣ 測試服務初始化...
✅ 服務初始化成功
...
🎉 優生學 TTS 服務測試完成！
```

## API 限制

- **速率限制**: 120 請求/分鐘
- **文本長度**: 根據您的方案而定
- **音調範圍**: -2st ~ +2st
- **語速範圍**: 0.8 ~ 1.2
- **音量範圍**: -6dB ~ +6dB
- **停頓時間**: 最大 5000ms

## 錯誤處理

### 常見錯誤

1. **API Token 無效**
   ```
   ❌ 載入聲優模型失敗: API 請求失敗: 401
   ```
   解決方案: 檢查 API Token 是否正確

2. **網絡連接問題**
   ```
   ❌ API 連接測試失敗: Cannot connect to host
   ```
   解決方案: 檢查網絡連接和防火牆設定

3. **SSML 格式錯誤**
   ```
   ❌ 合成請求失敗: 400 - SSML 格式錯誤
   ```
   解決方案: 檢查 SSML 語法和特殊字符轉義

4. **聲優不存在**
   ```
   ❌ 語音生成失敗: 沒有可用的聲優模型
   ```
   解決方案: 檢查聲優名稱或使用 `get_available_voices()` 獲取可用聲優

## 整合到現有專案

### 1. Docker 整合

服務已整合到 `docker-compose.yml` 中：

```yaml
tts-services:
  build: ./tts-services
  ports:
    - "8080:8080"
  environment:
    - EUGENES_API_TOKEN=${EUGENES_API_TOKEN}
  volumes:
    - ./data/audios:/app/data/audios
```

### 2. 前端整合

在前端可以通過 HTTP API 調用：

```javascript
const response = await fetch('/api/tts/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text: '你好，世界！',
    service: 'service3',
    voice_config: {
      voice_name: 'Aaron',
      pitch: 0.5,
      rate: 1.1
    },
    language: 'zh-TW'
  })
});

const audioBlob = await response.blob();
const audioUrl = URL.createObjectURL(audioBlob);
```

## 支援與文檔

- **API 文檔**: 參考 `.clinerules/優生學tts_api_doc.md`
- **官方網站**: https://www.aivoice.com.tw
- **API 版本**: v1.1.108

## 更新日誌

### v1.0.0 (2025-06-27)
- ✅ 完成優生學 TTS API 串接
- ✅ 支援 SSML 格式
- ✅ 實現語音參數調整
- ✅ 添加錯誤處理和重試機制
- ✅ 創建測試腳本和文檔
