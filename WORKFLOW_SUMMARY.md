# AI Model Studio - 視頻生成工作流程

## 重新設計的視頻生成流程

### 1. 聲音來源選擇（三種模式）

#### A. 預設聲音模式 (default)
- **使用場景**: 快速生成，無需特殊聲音要求
- **技術實現**: 自動使用 EdgeTTS 默認中文女聲
- **用戶操作**: 只需選擇人物模特，無需額外配置
- **優點**: 操作簡單，生成速度快

#### B. 聲音模特模式 (model)
- **使用場景**: 需要特定聲音風格或品質
- **技術實現**: 
  - 自訓練模特: HeyGem 平台訓練的個人化聲音
  - EdgeTTS 預設: Microsoft 提供的多種語言聲音
  - MiniMax 選項: 既有預設也可自訓練
- **用戶操作**: 
  1. 選擇供應商標籤 (自訓練/EdgeTTS/MiniMax)
  2. 從對應列表選擇具體模特
- **優點**: 聲音選擇豐富，品質可控

#### C. 參考音頻模式 (reference)
- **使用場景**: 需要克隆特定人物聲音
- **技術實現**: 上傳參考音頻，AI 分析聲音特徵並應用到生成中
- **用戶操作**: 上傳 3-10 秒清晰音頻文件
- **優點**: 最高的聲音個人化程度

### 2. 人物模特選擇
- **必須項**: 視頻生成必須選擇人物模特
- **目前支持**: HeyGem 平台的數字人角色
- **未來擴展**: 可支持其他平台的人物模特

### 3. 生成邏輯驗證
```javascript
// 音頻生成 - 必須有聲音模特
if (!selectedVoiceModelId) return error;

// 視頻生成 - 人物模特必須，聲音來源靈活
if (!selectedCharacterModelId) return error;
if (voiceSource === "model" && !selectedVoiceModelId) return error;
if (voiceSource === "reference" && !referenceAudio) return error;
// voiceSource === "default" 無需額外驗證
```

### 4. 模型供應商分類

#### HeyGem
- **聲音模特**: 支持自訓練（需要訓練文件）
- **人物模特**: 目前唯一支持的數字人平台
- **特點**: 高度客製化，需要訓練時間

#### EdgeTTS
- **聲音模特**: 微軟預設聲音（無需訓練）
- **人物模特**: 不支持
- **特點**: 即用即得，多語言支持

#### MiniMax
- **聲音模特**: 既有預設也可自訓練
- **人物模特**: 不支持
- **特點**: 平衡性能和客製化

### 5. 用戶界面設計

#### 聲音來源選擇區
- 三個並排卡片，清楚顯示選項
- 選中狀態有視覺反饋（邊框高亮）
- 動態顯示對應的詳細配置

#### 模特選擇區
- 標籤分類顯示不同供應商
- 每個選項都有供應商標識
- 預設選項和自訓練模特混合顯示

#### 生成按鈕
- 音頻生成：檢查聲音模特
- 視頻生成：檢查人物模特 + 聲音來源配置
- 即時禁用狀態反饋

### 6. 數據流設計
```typescript
interface VideoGenerationRequest {
  modelId: number;           // 人物模特ID
  inputText: string;         // 文本內容
  emotion: string;           // 情感設置
  type: "video";
  voiceSource: "default" | "model" | "reference";
  voiceModelId?: number;     // 聲音模特ID（當 voiceSource = "model"）
  referenceAudio?: File;     // 參考音頻（當 voiceSource = "reference"）
}
```

這個重新設計的流程讓視頻生成更加靈活，用戶可以根據需求選擇最適合的聲音來源，同時保持界面的清晰和操作的簡便性。