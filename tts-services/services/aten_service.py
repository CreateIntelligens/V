#!/usr/bin/env python3
"""
ATEN AIVoice TTS 服務實現
基於 ATEN AIVoice API v1.1.108
"""

import asyncio
import aiohttp
import json
import logging
import time
import os
from typing import Dict, Any, Optional, List
import xml.etree.ElementTree as ET

logger = logging.getLogger(__name__)

class ATENService:
    """
    ATEN AIVoice TTS 服務
    實現 ATEN AIVoice API 串接
    """
    
    def __init__(self):
        self.name = "ATEN AIVoice TTS"
        self.description = "ATEN AIVoice 語音合成服務，支援中文、英文、台語"
        self.languages = ["zh-TW", "en", "TL", "TB"]
        self.features = ["text_to_speech", "ssml_support", "voice_models", "streaming"]
        self.sample_rate = 22050
        self.is_initialized = False
        
        # API 配置
        self.api_token = None
        self.base_url = "https://www.aivoice.com.tw/business/enterprise"  # 企業版URL
        # 如果是綠界付款客戶，改用: https://www.aivoice.com.tw/atzone
        
        # 支援的聲優模型 (從API動態獲取)
        self.available_models = []
        
        # API 限制
        self.rate_limit = 120  # 120 requests per minute
        self.last_request_time = 0
        
    async def initialize(self):
        """初始化 ATEN AIVoice TTS 服務"""
        try:
            logger.info(f"正在初始化 {self.name}...")
            
            # 從環境變數獲取 API Token (優先使用新名稱，向後兼容舊名稱)
            self.api_token = os.getenv("ATEN_API_TOKEN") or os.getenv("EUGENES_API_TOKEN")
            
            # 獲取 Base URL (優先使用新名稱，向後兼容舊名稱)
            base_url_env = os.getenv("ATEN_BASE_URL") or os.getenv("EUGENES_BASE_URL")
            if base_url_env:
                self.base_url = base_url_env
            
            if not self.api_token:
                logger.warning("⚠️ ATEN API Token 未設定，請設定 ATEN_API_TOKEN 或 EUGENES_API_TOKEN 環境變數")
                self.is_initialized = False
                return
            
            # 測試 API 連接並獲取可用模型
            await self._load_available_models()
            self.is_initialized = True
            
            logger.info(f"✅ {self.name} 初始化完成，載入 {len(self.available_models)} 個聲優模型")
            
        except Exception as e:
            logger.error(f"❌ {self.name} 初始化失敗: {e}")
            self.is_initialized = False
    
    async def health_check(self) -> Dict[str, Any]:
        """健康檢查"""
        return {
            "status": "healthy" if self.is_initialized else "unhealthy",
            "name": self.name,
            "initialized": self.is_initialized,
            "api_token_configured": bool(self.api_token),
            "available_models": len(self.available_models),
            "rate_limit": f"{self.rate_limit}/min",
        }
    
    async def get_info(self) -> Dict[str, Any]:
        """獲取服務信息"""
        return {
            "name": self.name,
            "description": self.description,
            "languages": self.languages,
            "features": self.features,
            "sample_rate": self.sample_rate,
            "version": "1.1.108",
            "model_type": "ATEN AIVoice API",
            "available_models": self.available_models,
            "api_status": "configured" if self.api_token else "not_configured",
        }
    
    async def _load_available_models(self):
        """載入可用的聲優模型"""
        try:
            url = f"{self.base_url}/api/v1/models/api_token"
            headers = {
                "Authorization": self.api_token,
                "Content-Type": "application/json"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        # 處理不同的回應格式
                        if isinstance(data, dict):
                            self.available_models = data.get("data", [])
                        elif isinstance(data, list):
                            self.available_models = data
                        else:
                            self.available_models = []
                        
                        logger.info(f"成功載入 {len(self.available_models)} 個聲優模型")
                        logger.debug(f"聲優模型資料: {self.available_models}")
                    else:
                        error_text = await response.text()
                        logger.error(f"載入聲優模型失敗: {response.status} - {error_text}")
                        raise Exception(f"API 請求失敗: {response.status}")
                        
        except Exception as e:
            logger.error(f"載入聲優模型失敗: {e}")
            raise
    
    async def get_available_voices(self, language: str = None) -> Dict[str, Any]:
        """獲取可用的音色列表"""
        try:
            if not self.is_initialized:
                return {"error": "服務尚未初始化"}
            
            # 根據語言過濾模型
            filtered_models = self.available_models
            if language:
                # 這裡可以根據需要實現語言過濾邏輯
                pass
            
            return {
                "voices": filtered_models,
                "total_count": len(filtered_models),
                "languages": self.languages
            }
            
        except Exception as e:
            logger.error(f"獲取音色列表失敗: {e}")
            return {"error": str(e)}
    
    async def generate_speech(
        self, 
        text: str, 
        voice_config: Dict[str, Any] = None,
        format: str = "wav",
        language: str = "zh-TW"
    ) -> Dict[str, Any]:
        """
        生成語音
        
        Args:
            text: 要合成的文本
            voice_config: 語音配置
                - voice_name: 聲優名稱 (必須)
                - pitch: 音調調整 (-2st ~ +2st)
                - rate: 語速調整 (0.8 ~ 1.2)
                - volume: 音量調整 (-6dB ~ +6dB)
                - silence_scale: 停頓時間調整 (0.8 ~ 1.2)
                - use_custom_poly: 是否使用自定義多音字
            format: 音頻格式 (wav)
            language: 語言 (zh-TW, en, TL, TB)
        
        Returns:
            包含音頻數據和元信息的字典
        """
        try:
            if not self.is_initialized:
                raise Exception("服務尚未初始化")
            
            # 檢查 rate limit
            await self._check_rate_limit()
            
            logger.info(f"優生學 TTS 生成語音: {text[:50]}... (語言: {language})")
            
            # 解析語音配置
            if voice_config is None:
                voice_config = {}
            
            voice_name = voice_config.get("voice_name")
            if not voice_name:
                # 使用第一個可用的聲優
                if self.available_models:
                    voice_name = self.available_models[0]["model_id"]
                else:
                    raise Exception("沒有可用的聲優模型")
            
            # 構建 SSML
            ssml = self._build_ssml(text, voice_name, voice_config, language)
            
            # 發送合成請求
            synthesis_result = await self._synthesize_ssml(ssml, voice_config)
            
            if not synthesis_result["success"]:
                return synthesis_result
            
            synthesis_id = synthesis_result["synthesis_id"]
            
            # 等待合成完成
            audio_url = await self._wait_for_synthesis(synthesis_id)
            
            # 下載音頻文件
            audio_data = await self._download_audio(audio_url)
            
            return {
                "success": True,
                "audio_data": audio_data,
                "synthesis_id": synthesis_id,
                "sample_rate": self.sample_rate,
                "format": format,
                "service": "eugenes",
                "text_length": len(text),
                "language": language,
                "voice_name": voice_name,
                "ssml": ssml
            }
            
        except Exception as e:
            logger.error(f"優生學 TTS 語音生成失敗: {e}")
            return {
                "success": False,
                "message": f"語音生成失敗: {str(e)}",
                "service": "eugenes"
            }
    
    def _build_ssml(self, text: str, voice_name: str, voice_config: Dict[str, Any], language: str) -> str:
        """構建 SSML 格式的文本"""
        try:
            # 轉義特殊字符
            text = self._escape_ssml_text(text)
            
            # 獲取語音參數
            pitch = voice_config.get("pitch", 0)  # -2st ~ +2st
            rate = voice_config.get("rate", 1.0)  # 0.8 ~ 1.2
            volume = voice_config.get("volume", 0)  # -6dB ~ +6dB
            
            # 限制參數範圍
            pitch = max(-2, min(2, pitch))
            rate = max(0.8, min(1.2, rate))
            volume = max(-6, min(6, volume))
            
            # 構建 SSML
            ssml_parts = [
                f'<speak xmlns="http://www.w3.org/2001/10/synthesis" version="1.5" xml:lang="{language}">',
                f'<voice name="{voice_name}">',
                f'<prosody pitch="{pitch:+.1f}st" volume="{volume:+.1f}dB" rate="{rate:.1f}">',
                text,
                '</prosody>',
                '</voice>',
                '</speak>'
            ]
            
            ssml = ''.join(ssml_parts)
            logger.debug(f"構建的 SSML: {ssml}")
            
            return ssml
            
        except Exception as e:
            logger.error(f"構建 SSML 失敗: {e}")
            raise
    
    def _escape_ssml_text(self, text: str) -> str:
        """轉義 SSML 中的特殊字符"""
        escape_map = {
            '"': '&quot;',
            '&': '&amp;',
            "'": '&apos;',
            '<': '&lt;',
            '>': '&gt;'
        }
        
        for char, escape in escape_map.items():
            text = text.replace(char, escape)
        
        return text
    
    async def _synthesize_ssml(self, ssml: str, voice_config: Dict[str, Any]) -> Dict[str, Any]:
        """發送 SSML 合成請求"""
        try:
            url = f"{self.base_url}/api/v1/syntheses/api_token"
            headers = {
                "Authorization": self.api_token,
                "Content-Type": "application/json"
            }
            
            # 構建請求數據
            data = {
                "ssml": ssml
            }
            
            # 可選參數
            if "silence_scale" in voice_config:
                silence_scale = voice_config["silence_scale"]
                data["silence_scale"] = max(0.8, min(1.2, silence_scale))
            
            if voice_config.get("use_custom_poly", False):
                data["is_customized_poly_list_used"] = True
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, json=data) as response:
                    if response.status == 200:
                        result = await response.json()
                        return {
                            "success": True,
                            "synthesis_id": result["synthesis_id"],
                            "synthesis_path": result.get("synthesis_path"),
                            "srt_path": result.get("srt_path")
                        }
                    else:
                        error_text = await response.text()
                        logger.error(f"合成請求失敗: {response.status} - {error_text}")
                        return {
                            "success": False,
                            "message": f"合成請求失敗: {response.status} - {error_text}"
                        }
                        
        except Exception as e:
            logger.error(f"發送合成請求失敗: {e}")
            return {
                "success": False,
                "message": f"發送合成請求失敗: {str(e)}"
            }
    
    async def _wait_for_synthesis(self, synthesis_id: str, max_wait_time: int = 300) -> str:
        """等待合成完成並返回音頻URL"""
        try:
            url = f"{self.base_url}/api/v1/syntheses/{synthesis_id}/api_token"
            headers = {
                "Authorization": self.api_token
            }
            
            start_time = time.time()
            
            while time.time() - start_time < max_wait_time:
                async with aiohttp.ClientSession() as session:
                    async with session.get(url, headers=headers) as response:
                        if response.status == 200:
                            result = await response.json()
                            status = result.get("status")
                            
                            if status == "Success":
                                synthesis_path = result.get("synthesis_path")
                                if synthesis_path:
                                    logger.info(f"合成完成: {synthesis_id}")
                                    return synthesis_path
                                else:
                                    raise Exception("合成完成但未獲得音頻路徑")
                            
                            elif status == "Error":
                                error_msg = result.get("message") or result.get("error") or "未知錯誤"
                                logger.error(f"ATEN API 合成錯誤: {result}")
                                raise Exception(f"合成失敗: {error_msg}")
                            
                            elif status in ["Waiting", "Processing"]:
                                logger.debug(f"合成中... 狀態: {status}")
                                await asyncio.sleep(2)  # 等待2秒後重試
                                continue
                            
                            else:
                                raise Exception(f"未知狀態: {status}")
                        
                        else:
                            error_text = await response.text()
                            logger.error(f"查詢合成狀態失敗: {response.status} - {error_text}")
                            await asyncio.sleep(2)
            
            raise Exception(f"合成超時 (超過 {max_wait_time} 秒)")
            
        except Exception as e:
            logger.error(f"等待合成完成失敗: {e}")
            raise
    
    async def _download_audio(self, audio_url: str) -> bytes:
        """下載音頻文件"""
        try:
            headers = {
                "Authorization": self.api_token
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(audio_url, headers=headers) as response:
                    if response.status == 200:
                        audio_data = await response.read()
                        logger.info(f"成功下載音頻文件，大小: {len(audio_data)} bytes")
                        return audio_data
                    else:
                        error_text = await response.text()
                        raise Exception(f"下載音頻失敗: {response.status} - {error_text}")
                        
        except Exception as e:
            logger.error(f"下載音頻文件失敗: {e}")
            raise
    
    async def _check_rate_limit(self):
        """檢查 API 速率限制"""
        current_time = time.time()
        time_since_last_request = current_time - self.last_request_time
        
        # 如果距離上次請求不到 0.5 秒，等待一下 (120/min = 0.5s間隔)
        if time_since_last_request < 0.5:
            wait_time = 0.5 - time_since_last_request
            await asyncio.sleep(wait_time)
        
        self.last_request_time = time.time()
    
    async def get_synthesis_status(self, synthesis_id: str) -> Dict[str, Any]:
        """查詢合成狀態"""
        try:
            url = f"{self.base_url}/api/v1/syntheses/{synthesis_id}/api_token"
            headers = {
                "Authorization": self.api_token
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers) as response:
                    if response.status == 200:
                        result = await response.json()
                        return {
                            "success": True,
                            "data": result
                        }
                    else:
                        error_text = await response.text()
                        return {
                            "success": False,
                            "message": f"查詢失敗: {response.status} - {error_text}"
                        }
                        
        except Exception as e:
            logger.error(f"查詢合成狀態失敗: {e}")
            return {
                "success": False,
                "message": f"查詢失敗: {str(e)}"
            }

# 為了向後兼容，保留舊的類名
TTSService3 = ATENService
EugenesService = ATENService
