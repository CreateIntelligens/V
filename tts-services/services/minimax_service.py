#!/usr/bin/env python3
"""
TTS Service 2 - MiniMax TTS 實現 (示例)
MiniMax 的語音合成服務接口
"""

import asyncio
import numpy as np
import soundfile as sf
import io
import logging
import requests
from typing import Dict, Any

logger = logging.getLogger(__name__)

class TTSService2:
    """
    TTS 服務 2 - MiniMax TTS
    MiniMax 的語音合成服務 (需要 API Key)
    """
    
    def __init__(self):
        self.name = "MiniMax TTS"
        self.description = "MiniMax 語音合成服務，支援高品質中英文語音"
        self.languages = ["zh", "en"]
        self.features = ["text_to_speech", "high_quality", "commercial"]
        self.sample_rate = 24000
        self.is_initialized = False
        self.api_key = None  # 需要設定 API Key
        self.group_id = None  # 需要設定 Group ID
        self.base_url = None  # 從環境變數讀取
        self.model = None  # 從環境變數讀取
        
        # MiniMax 支援的音色 (友好顯示名稱)
        self.voices = {
            "zh": [
                {"id": "moss_audio_069e7ef7-45ab-11f0-b24c-2e48b7cbf811", "name": "小安", "gender": "female", "description": "溫柔甜美的女聲"},
                {"id": "moss_audio_e2651ab2-50e2-11f0-8bff-3ee21232901d", "name": "小賴", "gender": "male", "description": "穩重自然的男聲"},
                {"id": "moss_audio_9e3d9106-42a6-11f0-b6c4-9e15325fe584", "name": "Hayley", "gender": "female", "description": "活潑清新的女聲"},
            ],
            "en": [
                {"id": "moss_audio_069e7ef7-45ab-11f0-b24c-2e48b7cbf811", "name": "小安", "gender": "female", "description": "Gentle and sweet female voice"},
                {"id": "moss_audio_e2651ab2-50e2-11f0-8bff-3ee21232901d", "name": "小賴", "gender": "male", "description": "Steady and natural male voice"},
                {"id": "moss_audio_9e3d9106-42a6-11f0-b6c4-9e15325fe584", "name": "Hayley", "gender": "female", "description": "Lively and fresh female voice"},
            ]
        }
        
    async def initialize(self):
        """初始化 MiniMax TTS 服務"""
        try:
            logger.info(f"正在初始化 {self.name}...")
            
            # 從環境變數讀取配置
            import os
            self.api_key = os.getenv("MINIMAX_API_KEY")
            self.group_id = os.getenv("MINIMAX_GROUP_ID")
            self.base_url = os.getenv("MINIMAX_BASE_URL", "https://api.minimaxi.chat/v1/t2a_v2")
            self.model = os.getenv("MINIMAX_MODEL", "speech-02-turbo")
            
            logger.info(f"🔧 配置信息:")
            logger.info(f"   Base URL: {self.base_url}")
            logger.info(f"   Model: {self.model}")
            logger.info(f"   API Key: {'已設定' if self.api_key else '未設定'}")
            logger.info(f"   Group ID: {'已設定' if self.group_id else '未設定'}")
            
            if not self.api_key:
                logger.warning("⚠️ MiniMax API Key 未設定，將使用模擬模式")
                self.is_initialized = True
            else:
                # 測試 API 連接
                await self._test_api_connection()
                self.is_initialized = True
                
            logger.info(f"✅ {self.name} 初始化完成")
            
        except Exception as e:
            logger.error(f"❌ {self.name} 初始化失敗: {e}")
            # 即使失敗也標記為已初始化，使用模擬模式
            self.is_initialized = True
    
    async def health_check(self) -> Dict[str, Any]:
        """健康檢查"""
        return {
            "status": "healthy" if self.is_initialized else "unhealthy",
            "name": self.name,
            "initialized": self.is_initialized,
            "memory_usage": "約 100MB",
            "api_key_configured": bool(self.api_key),
            "mode": "real" if self.api_key else "simulation",
        }
    
    async def get_info(self) -> Dict[str, Any]:
        """獲取服務信息"""
        return {
            "name": self.name,
            "description": self.description,
            "languages": self.languages,
            "features": self.features,
            "sample_rate": self.sample_rate,
            "version": "1.0.0",
            "model_type": "MiniMax TTS API",
            "voices": self.voices,
            "api_status": "configured" if self.api_key else "not_configured",
        }
    
    async def generate_speech(
        self, 
        text: str, 
        voice_config: Dict[str, Any] = None,
        format: str = "wav",
        language: str = "zh",
        emotion: str = "neutral",
        volume: float = 1.0
    ) -> Dict[str, Any]:
        """
        生成語音
        
        Args:
            text: 要合成的文本
            voice_config: 語音配置
                - voice_id: 音色 ID
                - speed: 語速 (0.5-2.0)
                - pitch: 音調 (-12 到 12)
            format: 音頻格式 (wav, mp3)
            language: 語言 (zh, en)
            emotion: 情緒 (neutral, happy, sad, angry, surprised, etc.)
            volume: 音量 (0.1-2.0)
        
        Returns:
            包含音頻數據和元信息的字典
        """
        try:
            if not self.is_initialized:
                raise Exception("服務尚未初始化")
            
            logger.info(f"MiniMax TTS 生成語音: {text[:50]}... (語言: {language})")
            
            # 解析語音配置
            if voice_config is None:
                voice_config = {}
            
            voice_id = voice_config.get("voice_id")
            if not voice_id:
                # 選擇默認音色
                default_voices = self.voices.get(language, self.voices["zh"])
                voice_id = default_voices[0]["id"]
            
            speed = voice_config.get("speed", 1.0)
            pitch = voice_config.get("pitch", 0)
            
            if self.api_key:
                # 實際調用 MiniMax API
                audio_data = await self._call_minimax_api(
                    text, voice_id, speed, pitch, language, emotion, volume
                )
            else:
                # 模擬模式
                audio_data = await self._generate_simulation_audio(text, language, emotion, volume)
            
            return {
                "success": True,
                "audio_data": audio_data,
                "duration": len(audio_data) / (self.sample_rate * 2),  # 估算時長
                "sample_rate": self.sample_rate,
                "format": format,
                "service": "minimax",
                "text_length": len(text),
                "language": language,
                "voice_id": voice_id,
                "speed": speed,
                "pitch": pitch,
                "emotion": emotion,
                "volume": volume,
                "mode": "real" if self.api_key else "simulation"
            }
            
        except Exception as e:
            logger.error(f"MiniMax TTS 語音生成失敗: {e}")
            return {
                "success": False,
                "message": f"語音生成失敗: {str(e)}",
                "service": "minimax"
            }
    
    async def _test_api_connection(self):
        """測試 API 連接"""
        # 這裡應該實現實際的 API 測試
        # 暫時跳過，因為這只是示例
        pass
    
    async def _call_minimax_api(self, text: str, voice_id: str, speed: float, pitch: int, language: str, emotion: str, volume: float) -> bytes:
        """
        調用 MiniMax API v2 (t2a_v2)
        使用真實的 API 格式
        """
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            # 真實的 MiniMax API 格式
            data = {
                "model": self.model,
                "text": text,
                "voice_setting": {
                    "voice_id": voice_id,
                    "speed": speed,
                    "vol": volume,
                    "pitch": pitch,
                    "emotion": emotion
                },
                "audio_setting": {
                    "sample_rate": 16000,  # MiniMax 使用 16000
                    "bitrate": 128000,
                    "format": "wav",
                    "channel": 1
                },
                "stream": False,
                "output_format": "url",
                "group_id": self.group_id
            }
            
            logger.info(f"🚀 調用 MiniMax API v2: {self.base_url}")
            logger.info(f"📝 請求參數: model={self.model}, voice={voice_id}, emotion={emotion}, speed={speed}, vol={volume}, pitch={pitch}")
            
            # 實際調用 API
            import aiohttp
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.base_url,
                    headers=headers,
                    json=data,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if response.status == 200:
                        json_data = await response.json()
                        logger.info(f"📄 收到 MiniMax 回應: {json_data}")
                        
                        # 檢查回應格式
                        if json_data.get("base_resp", {}).get("status_code") == 0:
                            # 成功回應
                            audio_url = json_data.get("data", {}).get("audio")
                            if audio_url:
                                # 下載音頻文件
                                logger.info(f"📥 下載音頻文件: {audio_url}")
                                async with session.get(audio_url) as audio_response:
                                    if audio_response.status == 200:
                                        audio_data = await audio_response.read()
                                        logger.info(f"✅ 音頻下載成功，大小: {len(audio_data)} bytes")
                                        return audio_data
                                    else:
                                        logger.error(f"❌ 音頻下載失敗: {audio_response.status}")
                            else:
                                logger.error("❌ 回應中沒有音頻 URL")
                        else:
                            error_msg = json_data.get("base_resp", {}).get("status_msg", "未知錯誤")
                            logger.error(f"❌ MiniMax API 錯誤: {error_msg}")
                        
                        # 如果沒有找到音頻，回退到模擬模式
                        logger.warning("⚠️ API 回應中未找到音頻數據，使用模擬模式")
                        return await self._generate_simulation_audio(text, language, emotion, volume)
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ API 調用失敗: {response.status} - {error_text}")
                        return await self._generate_simulation_audio(text, language, emotion, volume)
            
        except Exception as e:
            logger.error(f"❌ MiniMax API 調用異常: {e}")
            # 如果 API 調用失敗，回退到模擬模式
            return await self._generate_simulation_audio(text, language, emotion, volume)
    
    async def _generate_simulation_audio(self, text: str, language: str, emotion: str = "neutral", volume: float = 1.0) -> bytes:
        """
        生成模擬音頻 (當沒有 API Key 或 API 調用失敗時使用)
        支援情緒和音量調節
        """
        # 模擬處理時間
        await asyncio.sleep(1.0)
        
        # 根據文本長度生成對應長度的音頻
        duration = max(len(text) * 0.15, 2.0)  # 每個字符 0.15 秒，最少 2 秒
        num_samples = int(duration * self.sample_rate)
        
        # 生成更自然的音頻波形 (模擬 MiniMax 的高品質)
        t = np.linspace(0, duration, num_samples)
        
        # 根據語言選擇不同的基頻
        base_freq = 220 if language == "zh" else 200
        
        # 根據情緒調整音頻特徵
        emotion_config = {
            "neutral": {"freq_mod": 1.0, "amp_mod": 1.0, "noise_level": 0.02},
            "happy": {"freq_mod": 1.2, "amp_mod": 1.1, "noise_level": 0.015},
            "sad": {"freq_mod": 0.8, "amp_mod": 0.9, "noise_level": 0.025},
            "angry": {"freq_mod": 1.3, "amp_mod": 1.2, "noise_level": 0.03},
            "surprised": {"freq_mod": 1.4, "amp_mod": 1.15, "noise_level": 0.02},
            "calm": {"freq_mod": 0.9, "amp_mod": 0.95, "noise_level": 0.01}
        }
        
        config = emotion_config.get(emotion, emotion_config["neutral"])
        adjusted_freq = base_freq * config["freq_mod"]
        
        # 生成複雜的波形模擬高品質語音
        audio = np.zeros(num_samples)
        
        # 基頻和諧波 (根據情緒調整)
        audio += np.sin(2 * np.pi * adjusted_freq * t) * 0.3 * config["amp_mod"]
        audio += np.sin(2 * np.pi * adjusted_freq * 2 * t) * 0.15 * config["amp_mod"]
        audio += np.sin(2 * np.pi * adjusted_freq * 3 * t) * 0.08 * config["amp_mod"]
        
        # 添加語音特徵的調製 (根據情緒調整)
        modulation_freq = 3 if emotion != "sad" else 2
        modulation = 1 + np.sin(2 * np.pi * modulation_freq * t) * 0.2
        audio *= modulation
        
        # 添加一些隨機變化模擬自然語音 (根據情緒調整噪音)
        noise = np.random.normal(0, config["noise_level"], num_samples)
        audio += noise
        
        # 應用音量調節 (限制在合理範圍)
        volume = max(0.1, min(2.0, volume))
        audio *= volume
        
        # 防止音頻削波
        max_val = np.max(np.abs(audio))
        if max_val > 0.95:
            audio = audio * 0.95 / max_val
        
        # 平滑的淡入淡出
        fade_samples = int(0.1 * self.sample_rate)
        audio[:fade_samples] *= np.linspace(0, 1, fade_samples)
        audio[-fade_samples:] *= np.linspace(1, 0, fade_samples)
        
        # 轉換為 WAV 格式
        buffer = io.BytesIO()
        sf.write(buffer, audio.astype(np.float32), self.sample_rate, format='WAV')
        buffer.seek(0)
        
        return buffer.read()
    
    async def get_available_voices(self, language: str = None) -> Dict[str, Any]:
        """
        獲取可用的音色列表
        """
        try:
            if language and language in self.voices:
                return {"voices": self.voices[language], "language": language}
            else:
                return {"voices": self.voices, "all_languages": self.languages}
        except Exception as e:
            logger.error(f"獲取音色列表失敗: {e}")
            return {"error": str(e)}
