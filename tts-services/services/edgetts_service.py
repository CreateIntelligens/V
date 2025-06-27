#!/usr/bin/env python3
"""
TTS Service 1 - EdgeTTS 實現
使用微軟 Edge 瀏覽器的 TTS 服務，免費且高品質
"""

import asyncio
import edge_tts
import io
import logging
from typing import Dict, Any
import tempfile
import os

logger = logging.getLogger(__name__)

class TTSService1:
    """
    TTS 服務 1 - EdgeTTS 實現
    使用微軟 Edge 的免費 TTS 服務
    """
    
    def __init__(self):
        self.name = "EdgeTTS 語音合成"
        self.description = "微軟 Edge 瀏覽器的免費 TTS 服務，支援多種語言和音色"
        self.languages = ["zh", "en", "ja", "ko", "es", "fr", "de"]
        self.features = ["text_to_speech", "multi_language", "multi_voice", "free"]
        self.is_initialized = False
        
        # EdgeTTS 支援的中文音色
        self.zh_voices = [
            "zh-CN-XiaoxiaoNeural",  # 曉曉 (女)
            "zh-CN-YunxiNeural",     # 雲希 (男)
            "zh-CN-YunjianNeural",   # 雲健 (男)
            "zh-CN-XiaoyiNeural",    # 曉伊 (女)
            "zh-CN-YunyangNeural",   # 雲揚 (男)
            "zh-TW-HsiaoyuNeural",   # 曉雨 (女，台灣)
            "zh-TW-YunjieNeural",    # 雲傑 (男，台灣)
        ]
        
        # EdgeTTS 支援的英文音色
        self.en_voices = [
            "en-US-AriaNeural",      # Aria (女)
            "en-US-DavisNeural",     # Davis (男)
            "en-US-GuyNeural",       # Guy (男)
            "en-US-JennyNeural",     # Jenny (女)
            "en-US-JasonNeural",     # Jason (男)
        ]
        
    async def initialize(self):
        """初始化 EdgeTTS 服務"""
        try:
            logger.info(f"正在初始化 {self.name}...")
            
            # 測試 EdgeTTS 是否可用
            test_text = "Hello"
            test_voice = "en-US-AriaNeural"
            
            communicate = edge_tts.Communicate(test_text, test_voice)
            test_data = b""
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    test_data += chunk["data"]
            
            if len(test_data) > 0:
                self.is_initialized = True
                logger.info(f"✅ {self.name} 初始化完成")
            else:
                raise Exception("EdgeTTS 測試失敗")
                
        except Exception as e:
            logger.error(f"❌ {self.name} 初始化失敗: {e}")
            raise
    
    async def health_check(self) -> Dict[str, Any]:
        """健康檢查"""
        return {
            "status": "healthy" if self.is_initialized else "unhealthy",
            "name": self.name,
            "initialized": self.is_initialized,
            "memory_usage": "約 50MB",
            "supported_voices": len(self.zh_voices) + len(self.en_voices),
        }
    
    async def get_info(self) -> Dict[str, Any]:
        """獲取服務信息"""
        return {
            "name": self.name,
            "description": self.description,
            "languages": self.languages,
            "features": self.features,
            "version": "1.0.0",
            "model_type": "Microsoft Edge TTS",
            "zh_voices": self.zh_voices,
            "en_voices": self.en_voices,
        }
    
    async def generate_speech(
        self, 
        text: str, 
        voice_config: Dict[str, Any] = None,
        format: str = "wav",
        language: str = "zh"
    ) -> Dict[str, Any]:
        """
        生成語音
        
        Args:
            text: 要合成的文本
            voice_config: 語音配置
                - voice: 指定音色 (可選)
                - rate: 語速 (可選，如 "+0%", "+20%", "-10%")
                - pitch: 音調 (可選，如 "+0Hz", "+50Hz", "-20Hz")
            format: 音頻格式 (wav, mp3)
            language: 語言 (zh, en, ja 等)
        
        Returns:
            包含音頻數據和元信息的字典
        """
        try:
            if not self.is_initialized:
                raise Exception("服務尚未初始化")
            
            logger.info(f"EdgeTTS 生成語音: {text[:50]}... (語言: {language})")
            
            # 解析語音配置
            if voice_config is None:
                voice_config = {}
            
            # 選擇音色
            voice = voice_config.get("voice")
            if not voice:
                if language == "zh":
                    voice = self.zh_voices[0]  # 默認使用曉曉
                elif language == "en":
                    voice = self.en_voices[0]  # 默認使用 Aria
                else:
                    voice = "en-US-AriaNeural"  # 其他語言默認英文
            
            # 語速和音調設定
            rate = voice_config.get("rate", "+0%")
            pitch = voice_config.get("pitch", "+0Hz")
            
            logger.info(f"使用音色: {voice}, 語速: {rate}, 音調: {pitch}")
            
            # 生成語音
            audio_data = await self._generate_edge_tts(text, voice, rate, pitch, format)
            
            return {
                "success": True,
                "audio_data": audio_data,
                "duration": len(audio_data) / 16000,  # 估算時長
                "sample_rate": 24000,  # EdgeTTS 默認採樣率
                "format": format,
                "service": "edgetts",
                "text_length": len(text),
                "language": language,
                "voice": voice,
                "rate": rate,
                "pitch": pitch
            }
            
        except Exception as e:
            logger.error(f"EdgeTTS 語音生成失敗: {e}")
            return {
                "success": False,
                "message": f"語音生成失敗: {str(e)}",
                "service": "edgetts"
            }
    
    async def _generate_edge_tts(self, text: str, voice: str, rate: str, pitch: str, output_format: str = "wav") -> bytes:
        """
        使用 EdgeTTS 生成音頻
        """
        try:
            # 檢查是否需要語速或音調調整
            if rate != "+0%" or pitch != "+0Hz":
                # 如果需要調整語速或音調，使用簡化的 SSML
                # 只包含必要的 prosody 標籤，不包含完整的 speak 標籤
                ssml_text = f'<prosody rate="{rate}" pitch="{pitch}">{text}</prosody>'
                logger.info(f"使用 SSML 調整語音參數: rate={rate}, pitch={pitch}")
            else:
                # 如果不需要調整，直接使用純文本
                ssml_text = text
                logger.info("使用純文本生成語音")
            
            # 創建 EdgeTTS 通信對象
            communicate = edge_tts.Communicate(ssml_text, voice)
            
            # 收集音頻數據
            audio_data = b""
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_data += chunk["data"]
            
            if len(audio_data) == 0:
                raise Exception("EdgeTTS 返回空音頻數據")
            
            # EdgeTTS 默認輸出 MP3 格式，如果需要 WAV 格式則轉換
            if output_format.lower() == "wav":
                audio_data = await self._convert_mp3_to_wav(audio_data)
                logger.info("已將 MP3 格式轉換為 WAV 格式")
            
            return audio_data
            
        except Exception as e:
            logger.error(f"EdgeTTS 生成錯誤: {e}")
            raise
    
    async def _convert_mp3_to_wav(self, mp3_data: bytes) -> bytes:
        """
        將 MP3 音頻數據轉換為 WAV 格式
        """
        try:
            import tempfile
            import subprocess
            
            # 創建臨時檔案
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as mp3_file:
                mp3_file.write(mp3_data)
                mp3_path = mp3_file.name
            
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as wav_file:
                wav_path = wav_file.name
            
            try:
                # 使用 ffmpeg 轉換格式
                cmd = [
                    "ffmpeg", "-i", mp3_path,
                    "-acodec", "pcm_s16le",  # 16-bit PCM
                    "-ar", "44100",          # 44.1kHz 採樣率
                    "-ac", "1",              # 單聲道
                    "-y",                    # 覆蓋輸出檔案
                    wav_path
                ]
                
                result = subprocess.run(cmd, capture_output=True, text=True)
                if result.returncode != 0:
                    logger.error(f"ffmpeg 轉換失敗: {result.stderr}")
                    raise Exception(f"音頻格式轉換失敗: {result.stderr}")
                
                # 讀取轉換後的 WAV 檔案
                with open(wav_path, "rb") as f:
                    wav_data = f.read()
                
                logger.info(f"成功轉換 MP3 ({len(mp3_data)} bytes) 到 WAV ({len(wav_data)} bytes)")
                return wav_data
                
            finally:
                # 清理臨時檔案
                try:
                    os.unlink(mp3_path)
                    os.unlink(wav_path)
                except:
                    pass
                    
        except Exception as e:
            logger.error(f"MP3 到 WAV 轉換失敗: {e}")
            # 如果轉換失敗，返回原始 MP3 數據
            logger.warning("轉換失敗，返回原始 MP3 數據")
            return mp3_data
    
    async def get_available_voices(self, language: str = None) -> Dict[str, Any]:
        """
        獲取可用的音色列表
        """
        try:
            if language == "zh":
                return {"voices": self.zh_voices, "language": "zh"}
            elif language == "en":
                return {"voices": self.en_voices, "language": "en"}
            else:
                return {
                    "zh_voices": self.zh_voices,
                    "en_voices": self.en_voices,
                    "all_languages": self.languages
                }
        except Exception as e:
            logger.error(f"獲取音色列表失敗: {e}")
            return {"error": str(e)}
