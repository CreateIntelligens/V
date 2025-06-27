# HeyGem TTS 服務集合

## 概述
HeyGem TTS 服務集合包含多個語音合成引擎，提供統一的 API 介面。

## 支援的服務
- **Service 1**: EdgeTTS (免費)
- **Service 2**: MiniMax TTS (需要 API Key)
- **Service 3**: EugeneTTS (自定義)
- **Service 4**: OpenAI TTS (需要 API Key)

## MiniMax TTS 設定

### 1. 環境變數設定
複製範例檔案並填入你的 API Key：
```bash
cp .env.example .env
```

編輯 `.env` 檔案：
```bash
# MiniMax TTS API 設定
MINIMAX_API_KEY=你的_minimax_api_key
MINIMAX_GROUP_ID=你的_group_id

# MiniMax API 設定 (可選)
MINIMAX_BASE_URL=https://api.minimax.chat/v1/text_to_speech
MINIMAX_MODEL=speech-01
```

### 2. 支援的參數

#### 基本參數
- `text`: 要合成的文本
- `language`: 語言 (`zh`, `en`)
- `format`: 音頻格式 (`wav`, `mp3`)

#### 語音配置 (voice_config)
- `voice_id`: 音色 ID
  - 中文: `female-shaonv`, `male-qingshu`, `female-chengshu`, `male-chengshu`
  - 英文: `en-female-1`, `en-male-1`
- `speed`: 語速 (0.5-2.0)
- `pitch`: 音調 (-12 到 +12)

#### 進階參數
- `emotion`: 情緒
  - `neutral` (中性)
  - `happy` (開心)
  - `sad` (悲傷)
  - `angry` (憤怒)
  - `surprised` (驚訝)
  - `calm` (平靜)
- `volume`: 音量 (0.1-2.0)

### 3. API 使用範例

#### 基本調用
```bash
curl -X POST "http://localhost:18200/api/tts/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "你好，這是 MiniMax TTS 測試",
    "service": "service2",
    "language": "zh"
  }' \
  --output test.wav
```

#### 進階調用 (包含情緒和音量)
```bash
curl -X POST "http://localhost:18200/api/tts/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "我今天很開心！",
    "service": "service2",
    "language": "zh",
    "voice_config": {
      "voice_id": "female-shaonv",
      "speed": 1.2,
      "pitch": 2
    },
    "emotion": "happy",
    "volume": 1.5
  }' \
  --output happy_voice.wav
```

#### 測試 MiniMax API 連接
```bash
# 檢查服務狀態
curl "http://localhost:18200/health"

# 查看服務信息
curl "http://localhost:18200/api/services"

# 查看 MiniMax 服務詳細信息
curl "http://localhost:18200/api/tts/services/service2/info"
```

### 4. 前端整合

在前端可以這樣調用：
```javascript
const response = await fetch('/api/tts/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text: '你好世界',
    service: 'service2',
    language: 'zh',
    emotion: 'happy',
    volume: 1.2,
    voice_config: {
      voice_id: 'female-shaonv',
      speed: 1.0,
      pitch: 0
    }
  })
});

const audioBlob = await response.blob();
const audioUrl = URL.createObjectURL(audioBlob);
```

## 啟動服務

### Docker 方式 (推薦)
```bash
# 啟動所有服務
docker-compose up -d

# 只啟動 TTS 服務
docker-compose up -d heygem-tts-services
```

### 本地開發
```bash
cd tts-services
pip install -r requirements.txt
python main.py
```

## 服務端點

- **主服務**: http://localhost:18200
- **健康檢查**: http://localhost:18200/health
- **API 文檔**: http://localhost:18200/docs
- **服務列表**: http://localhost:18200/api/services

## 故障排除

### 1. API Key 問題
如果看到 "模擬模式" 訊息，檢查：
- `.env` 檔案是否存在
- `MINIMAX_API_KEY` 是否正確設定
- Docker 容器是否正確載入環境變數

### 2. 音頻品質問題
- 調整 `volume` 參數 (0.1-2.0)
- 嘗試不同的 `voice_id`
- 檢查 `emotion` 參數是否正確

### 3. 服務無法啟動
```bash
# 檢查容器狀態
docker-compose ps

# 查看日誌
docker-compose logs heygem-tts-services

# 重啟服務
docker-compose restart heygem-tts-services
```

## 開發說明

### 添加新的情緒
在 `minimax_service.py` 的 `emotion_config` 中添加：
```python
"新情緒": {"freq_mod": 1.1, "amp_mod": 1.05, "noise_level": 0.02}
```

### 添加新的音色
在 `voices` 字典中添加：
```python
{"id": "new-voice-id", "name": "新音色名稱", "gender": "female"}
```

## 注意事項

1. **API Key 安全**: 不要將 API Key 提交到版本控制
2. **音量限制**: 音量會自動限制在 0.1-2.0 範圍內
3. **模擬模式**: 沒有 API Key 時會使用模擬音頻
4. **錯誤處理**: API 調用失敗時會自動回退到模擬模式
