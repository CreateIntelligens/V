#!/usr/bin/env python3
"""
VoAI TTS Service - 網際智慧語音合成服務
使用 voai.ai 的高品質中文 TTS 服務
"""

import requests
import io
import logging
from typing import Dict, Any, List
import tempfile
import os

logger = logging.getLogger(__name__)

class VoAIService:
    """
    VoAI TTS 服務 - 網際智慧語音合成
    使用 voai.ai 的高品質中文 TTS 服務
    """
    
    def __init__(self):
        self.name = "VoAI 語音合成"
        self.description = "網際智慧的高品質中文語音合成服務，支援多種發音人和語音風格"
        self.languages = ["zh-TW", "zh-CN"]
        self.features = ["text_to_speech", "chinese_focused", "multiple_speakers", "style_control"]
        self.is_initialized = False
        self.api_key = None
        self.base_url = "https://connect.voai.ai"
        
        # 預設的發音人和風格配置
        self.speakers = [
            {"name": "佑希", "gender": "female", "language": "zh-TW", "styles": ["預設", "可愛", "聊天"]},
            {"name": "小雅", "gender": "female", "language": "zh-TW", "styles": ["預設", "溫柔", "專業"]},
            {"name": "志明", "gender": "male", "language": "zh-TW", "styles": ["預設", "沉穩", "活潑"]},
        ]
        
        self.models = ["Classic", "Neo"]
        
    async def initialize(self, config: Dict[str, Any] = None):
        """
        初始化 VoAI 服務
        需要 API Key 進行身份驗證
        """
        try:
            logger.info("正在初始化 VoAI TTS 服務...")
            
            # 從環境變數獲取 API Key
            if not self.api_key:
                self.api_key = os.getenv('VOAI_API_KEY')
                
            if not self.api_key:
                logger.warning("VoAI API Key 未設置（環境變數 VOAI_API_KEY），將無法使用 VoAI TTS 服務")
                self.is_initialized = False
                return False
                
            # 簡化初始化，不進行實際 API 測試
            # 避免在啟動時因網路問題導致服務無法啟動
            self.is_initialized = True
            logger.info("✅ VoAI TTS 服務初始化完成（簡化模式）")
            return True
            
        except Exception as e:
            logger.error(f"VoAI TTS 服務初始化失敗: {e}")
            # 即使出錯也標記為已初始化，讓服務能正常啟動
            self.is_initialized = True
            return True
    
    async def _fetch_speakers(self) -> List[Dict]:
        """
        從 VoAI API 或本地文件獲取最新的 speaker 列表
        """
        # 首先嘗試加載本地的 speakers 文件
        try:
            import json
            speakers_file_path = os.path.join(os.path.dirname(__file__), '..', 'voai_speakers.json')
            if os.path.exists(speakers_file_path):
                with open(speakers_file_path, 'r', encoding='utf-8') as f:
                    speakers_data = json.load(f)
                    
                # 解析本地文件格式
                if 'data' in speakers_data and 'models' in speakers_data['data']:
                    all_speakers = []
                    for model in speakers_data['data']['models']:
                        for speaker in model.get('speakers', []):
                            all_speakers.append(speaker)
                    
                    if all_speakers:
                        self.speakers = all_speakers
                        logger.info(f"✅ 從本地文件加載 {len(self.speakers)} 個 VoAI 發音人")
                        return self.speakers
        except Exception as e:
            logger.warning(f"加載本地 speakers 文件失敗: {e}")
        
        # 如果本地文件不可用，嘗試從 API 獲取
        try:
            headers = {
                'x-api-key': self.api_key
            }
            
            response = requests.get(f"{self.base_url}/TTS/GetSpeaker", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.speakers = data.get('speakers', self.speakers)
                    logger.info(f"✅ 從 API 獲取 {len(self.speakers)} 個 VoAI 發音人")
                    return self.speakers
            else:
                logger.warning(f"獲取 VoAI speakers 失敗: {response.status_code}")
                
        except Exception as e:
            logger.error(f"獲取 VoAI speakers 失敗: {e}")
            
        logger.info(f"使用預設的 {len(self.speakers)} 個 VoAI 發音人")
        return self.speakers
    
    async def health_check(self) -> Dict[str, Any]:
        """健康檢查"""
        return {
            "status": "healthy" if self.is_initialized else "unhealthy",
            "name": self.name,
            "initialized": self.is_initialized,
            "api_key_configured": bool(self.api_key),
            "speakers_count": len(self.speakers),
        }
    
    async def get_info(self) -> Dict[str, Any]:
        """獲取服務資訊"""
        return {
            "name": self.name,
            "description": self.description,
            "languages": self.languages,
            "features": self.features,
            "version": "1.0.0",
            "model_type": "VoAI TTS",
            "speakers": self.speakers,
            "models": self.models,
            "api_status": "available" if self.api_key else "no_api_key"
        }
    
    async def generate_speech(
        self, 
        text: str, 
        voice_config: Dict[str, Any] = None,
        format: str = "wav",
        language: str = "zh"
    ) -> Dict[str, Any]:
        """
        生成語音 - 統一介面
        
        Args:
            text: 要合成的文本
            voice_config: 語音配置
                - voice: 發音人名稱
                - style: 語音風格
                - model: 模型版本
                - speed: 語速
                - pitch_shift: 音調調整
                - style_weight: 風格權重
                - breath_pause: 句間停頓
            format: 音頻格式 (wav)
            language: 語言
        
        Returns:
            包含音頻數據和元信息的字典
        """
        try:
            if not self.is_initialized:
                raise Exception("VoAI 服務尚未初始化")
            
            logger.info(f"VoAI 生成語音: {text[:50]}... (語言: {language})")
            
            # 解析語音配置
            if voice_config is None:
                voice_config = {}
            
            voice = voice_config.get("voice", "佑希")
            style = voice_config.get("style", "預設")
            model = voice_config.get("model", "Neo")
            speed = voice_config.get("speed", 1.0)
            pitch_shift = voice_config.get("pitch_shift", 0)
            style_weight = voice_config.get("style_weight", 0)
            breath_pause = voice_config.get("breath_pause", 0)
            
            logger.info(f"使用配置: voice={voice}, style={style}, model={model}")
            
            # 調用內部 TTS 方法
            audio_data = await self.text_to_speech(
                text=text,
                voice=voice,
                style=style,
                model=model,
                speed=speed,
                pitch_shift=pitch_shift,
                style_weight=style_weight,
                breath_pause=breath_pause
            )
            
            return {
                "success": True,
                "audio_data": audio_data,
                "duration": len(audio_data) / 16000,  # 估算時長
                "sample_rate": 24000,
                "format": format,
                "service": "voai",
                "text_length": len(text),
                "language": language,
                "voice": voice,
                "style": style,
                "model": model
            }
            
        except Exception as e:
            logger.error(f"VoAI 語音生成失敗: {e}")
            return {
                "success": False,
                "message": f"語音生成失敗: {str(e)}",
                "service": "voai"
            }
    
    async def text_to_speech(self, text: str, voice: str = "佑希", **kwargs) -> bytes:
        """
        將文本轉換為語音
        
        Args:
            text: 要轉換的文本
            voice: 發音人名稱
            **kwargs: 其他參數
                - style: 語音風格 (預設: "預設")
                - model: 模型版本 (預設: "Neo")
                - speed: 語速 (0.5-1.5, 預設: 1.0)
                - pitch_shift: 音調調整 (-5 to 5, 預設: 0)
                - style_weight: 風格權重 (0-1, 預設: 0)
                - breath_pause: 句間停頓 (0-10秒, 預設: 0)
        """
        if not self.is_initialized:
            raise Exception("VoAI 服務尚未初始化")
            
        if not text:
            raise ValueError("文本不能為空")
            
        try:
            # 準備請求參數
            style = kwargs.get('style', '預設')
            model = kwargs.get('model', 'Neo')
            speed = max(0.5, min(1.5, kwargs.get('speed', 1.0)))
            pitch_shift = max(-5, min(5, kwargs.get('pitch_shift', 0)))
            style_weight = max(0, min(1, kwargs.get('style_weight', 0)))
            breath_pause = max(0, min(10, kwargs.get('breath_pause', 0)))
            
            # 選擇 API 端點和參數格式
            if len(text) > 200 or '[:' in text:
                # 長文本使用進階 API
                url = f"{self.base_url}/TTS/generate-voice"
                data = {
                    "input": {
                        "voai_script_text": text
                    },
                    "voice": {
                        "name": voice,
                        "style": style,
                        "model": model
                    },
                    "audio_config": {
                        "speed": speed,
                        "pitch_shift": pitch_shift,
                        "style_weight": style_weight,
                        "breath_pause": breath_pause
                    }
                }
            else:
                # 短文本使用簡易 API
                url = f"{self.base_url}/TTS/Speech"
                data = {
                    "version": model,  # 必須參數：API 版本
                    "text": text,
                    "speaker": voice,  # 發音人名稱
                    "style": style,    # 語音風格
                    "speed": speed,    # 語速 [0.5, 1.5]
                    "pitch_shift": pitch_shift,    # 音調 [-5, 5]
                    "style_weight": style_weight,  # 風格權重 [0, 1] (僅 Classic)
                    "breath_pause": breath_pause   # 句間停頓 [0, 10]
                }
            
            headers = {
                'x-output-format': 'wav',
                'x-api-key': self.api_key,
                'Content-Type': 'application/json'
            }
            
            logger.info(f"正在生成語音: {text[:50]}...")
            
            response = requests.post(url, json=data, headers=headers)
            
            if response.status_code == 200:
                # 檢查回應是否為音頻文件
                content_type = response.headers.get('content-type', '')
                if 'audio' in content_type or 'wav' in content_type:
                    logger.info(f"VoAI 語音生成成功，音頻大小: {len(response.content)} bytes")
                    return response.content
                else:
                    # 可能是 JSON 錯誤回應
                    try:
                        error_data = response.json()
                        error_msg = error_data.get('message', '未知錯誤')
                        raise Exception(f"VoAI API 錯誤: {error_msg}")
                    except:
                        raise Exception(f"VoAI API 回應格式錯誤")
            else:
                try:
                    error_data = response.json()
                    error_msg = error_data.get('message', f"HTTP {response.status_code}")
                except:
                    error_msg = f"HTTP {response.status_code}"
                    
                raise Exception(f"VoAI API 請求失敗: {error_msg}")
                
        except Exception as e:
            logger.error(f"VoAI 語音生成失敗: {e}")
            raise
    
    def get_voices(self) -> List[Dict[str, Any]]:
        """
        獲取支援的音色列表
        """
        voices = []
        for speaker in self.speakers:
            for style in speaker.get('styles', ['預設']):
                voices.append({
                    'id': f"voai-{speaker['name']}-{style}",
                    'name': f"{speaker['name']} ({style})",
                    'language': speaker.get('language', 'zh-TW'),
                    'gender': speaker.get('gender', 'unknown'),
                    'speaker': speaker['name'],
                    'style': style
                })
        return voices
    
    
    async def check_quota(self) -> Dict[str, Any]:
        """
        檢查 API 使用配額
        """
        if not self.api_key:
            return {"error": "API Key 未設置"}
            
        try:
            headers = {
                'x-api-key': self.api_key
            }
            
            response = requests.get(f"{self.base_url}/Key/Usage", headers=headers)
            
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"HTTP {response.status_code}"}
                
        except Exception as e:
            logger.error(f"檢查 VoAI 配額失敗: {e}")
            return {"error": str(e)}

# 為了與其他服務保持一致的命名
VoAIService = VoAIService