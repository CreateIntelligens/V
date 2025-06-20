#!/usr/bin/env python3
"""
簡化的 TTS API 服務器
用於測試和開發 TTS 功能
"""

import os
import sys
import json
import uuid
import tempfile
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# 添加當前目錄到 Python 路徑
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

app = FastAPI(title="HeyGem TTS API", version="1.0.0")

# 添加 CORS 支援
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TTSRequest(BaseModel):
    text: str
    reference_audio: Optional[str] = None
    reference_text: Optional[str] = None
    format: str = "wav"
    chunk_length: int = 200
    max_new_tokens: int = 1024
    top_p: float = 0.7
    repetition_penalty: float = 1.2
    temperature: float = 0.7
    streaming: bool = False
    normalize: bool = True

@app.get("/")
async def root():
    return {"message": "HeyGem TTS API Server", "status": "running"}

@app.get("/v1/health")
async def health():
    return {"status": "ok"}

@app.post("/v1/invoke")
async def tts_invoke(request: TTSRequest):
    """
    TTS 語音合成 API
    """
    try:
        print(f"收到 TTS 請求: {request.text[:50]}...")
        
        # 檢查文本長度
        if len(request.text) > 1000:
            raise HTTPException(status_code=400, detail="文本太長，最大支援 1000 字符")
        
        # 模擬音頻生成（實際應該調用真正的 TTS 引擎）
        # 這裡我們創建一個簡單的音頻文件作為測試
        audio_data = generate_test_audio(request.text)
        
        # 返回音頻數據
        return Response(
            content=audio_data,
            media_type="audio/wav",
            headers={
                "Content-Disposition": f"attachment; filename=tts_output.{request.format}",
                "Content-Length": str(len(audio_data))
            }
        )
        
    except Exception as e:
        print(f"TTS 錯誤: {str(e)}")
        raise HTTPException(status_code=500, detail=f"TTS 生成失敗: {str(e)}")

def generate_test_audio(text: str) -> bytes:
    """
    生成測試音頻數據
    實際使用時應該替換為真正的 TTS 引擎
    """
    # 創建一個簡單的 WAV 文件頭
    # 這是一個最小的 WAV 文件，包含靜音
    sample_rate = 22050
    duration = min(len(text) * 0.1, 10.0)  # 根據文本長度計算時長，最大 10 秒
    num_samples = int(sample_rate * duration)
    
    # WAV 文件頭
    wav_header = bytearray()
    wav_header.extend(b'RIFF')  # ChunkID
    wav_header.extend((36 + num_samples * 2).to_bytes(4, 'little'))  # ChunkSize
    wav_header.extend(b'WAVE')  # Format
    wav_header.extend(b'fmt ')  # Subchunk1ID
    wav_header.extend((16).to_bytes(4, 'little'))  # Subchunk1Size
    wav_header.extend((1).to_bytes(2, 'little'))   # AudioFormat (PCM)
    wav_header.extend((1).to_bytes(2, 'little'))   # NumChannels (Mono)
    wav_header.extend(sample_rate.to_bytes(4, 'little'))  # SampleRate
    wav_header.extend((sample_rate * 2).to_bytes(4, 'little'))  # ByteRate
    wav_header.extend((2).to_bytes(2, 'little'))   # BlockAlign
    wav_header.extend((16).to_bytes(2, 'little'))  # BitsPerSample
    wav_header.extend(b'data')  # Subchunk2ID
    wav_header.extend((num_samples * 2).to_bytes(4, 'little'))  # Subchunk2Size
    
    # 音頻數據（靜音）
    audio_data = bytearray(num_samples * 2)  # 16-bit samples
    
    return bytes(wav_header + audio_data)

@app.get("/v1/models")
async def list_models():
    """
    列出可用的 TTS 模型
    """
    return {
        "models": [
            {
                "id": "fish-speech-1.4",
                "name": "Fish Speech 1.4",
                "description": "高質量中英文語音合成模型"
            }
        ]
    }

if __name__ == "__main__":
    print("🎤 啟動 HeyGem TTS API 服務器...")
    print("📍 服務地址: http://localhost:8080")
    print("📖 API 文檔: http://localhost:8080/docs")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8080,
        log_level="info"
    )
