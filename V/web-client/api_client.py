"""
遠端API客戶端
"""

import requests
import time
import uuid
import os
from typing import Optional, Dict, Any, Tuple
from config import API_ENDPOINTS, APP_CONFIG, DEBUG


class HeyGemAPIClient:
    """HeyGem遠端API客戶端"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.timeout = APP_CONFIG["timeout"]
        
    def _log(self, message: str):
        """簡單的日誌輸出"""
        if DEBUG:
            print(f"[API] {message}")
    
    def upload_files_and_submit(self, audio_file, video_file) -> Tuple[bool, str, Optional[str]]:
        """
        上傳文件並提交影片生成任務
        
        Args:
            audio_file: 音頻文件對象
            video_file: 影片文件對象
            
        Returns:
            Tuple[成功狀態, 消息, 任務代碼]
        """
        try:
            # 生成唯一任務代碼
            task_code = str(uuid.uuid4())
            
            # 首先上傳文件到服務器
            audio_url = self._upload_file(audio_file, "audio")
            video_url = self._upload_file(video_file, "video")
            
            if not audio_url or not video_url:
                return False, "文件上傳失敗", None
            
            # 準備 JSON 請求參數（按照原始 API 格式）
            data = {
                'audio_url': audio_url,
                'video_url': video_url,
                'code': task_code,
                'chaofen': 0,
                'watermark_switch': 0,
                'pn': 1
            }
            
            self._log(f"提交任務，代碼: {task_code}")
            self._log(f"請求參數: {data}")
            
            # 發送 JSON 請求
            url = f"{API_ENDPOINTS['face2face']}/submit"
            headers = {'Content-Type': 'application/json'}
            response = self.session.post(url, json=data, headers=headers)
            
            self._log(f"響應狀態碼: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                self._log(f"響應內容: {result}")
                
                if result.get('code') == 10000:  # 成功
                    return True, "任務提交成功", task_code
                else:
                    return False, result.get('msg', '任務提交失敗'), None
            else:
                return False, f"HTTP錯誤: {response.status_code}", None
                
        except Exception as e:
            self._log(f"提交任務時發生錯誤: {str(e)}")
            return False, f"錯誤: {str(e)}", None
    
    def _upload_file(self, file_obj, file_type: str) -> Optional[str]:
        """
        保存文件到共享存儲並返回文件路徑
        
        Args:
            file_obj: 文件對象
            file_type: 文件類型 ("audio" 或 "video")
            
        Returns:
            共享存儲中的文件路徑，如果失敗返回 None
        """
        try:
            # 獲取文件擴展名
            file_extension = os.path.splitext(file_obj.name)[1] if hasattr(file_obj, 'name') else ''
            if not file_extension:
                file_extension = '.wav' if file_type == 'audio' else '.mp4'
            
            # 生成唯一文件名
            filename = f"{uuid.uuid4()}{file_extension}"
            
            # 使用共享存儲路徑
            shared_dir = "/app/shared"
            if not os.path.exists(shared_dir):
                os.makedirs(shared_dir, exist_ok=True)
            
            file_path = os.path.join(shared_dir, filename)
            
            # 保存文件數據
            if hasattr(file_obj, 'read'):
                file_obj.seek(0)
                file_data = file_obj.read()
            else:
                with open(file_obj, 'rb') as f:
                    file_data = f.read()
            
            # 寫入共享存儲
            with open(file_path, 'wb') as f:
                f.write(file_data)
            
            # 返回影片生成服務可訪問的路徑
            # heygem-gen-video 容器中的路徑是 /code/shared/filename
            shared_path = f"/code/shared/{filename}"
            
            self._log(f"文件已保存到共享存儲: {file_path} -> {shared_path}")
            
            return shared_path
            
        except Exception as e:
            self._log(f"保存 {file_type} 文件時發生錯誤: {str(e)}")
            return None
    
    def check_task_status(self, task_code: str) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        檢查任務狀態
        
        Args:
            task_code: 任務代碼
            
        Returns:
            Tuple[成功狀態, 消息, 狀態數據]
        """
        try:
            url = f"{API_ENDPOINTS['face2face']}/query"
            params = {'code': task_code}
            
            response = self.session.get(url, params=params)
            
            if response.status_code == 200:
                result = response.json()
                self._log(f"狀態查詢結果: {result}")
                return True, "查詢成功", result
            else:
                return False, f"HTTP錯誤: {response.status_code}", None
                
        except Exception as e:
            self._log(f"查詢狀態時發生錯誤: {str(e)}")
            return False, f"錯誤: {str(e)}", None
    
    def wait_for_completion(self, task_code: str, progress_callback=None) -> Tuple[bool, str, Optional[str]]:
        """
        等待任務完成
        
        Args:
            task_code: 任務代碼
            progress_callback: 進度回調函數
            
        Returns:
            Tuple[成功狀態, 消息, 結果URL]
        """
        max_attempts = APP_CONFIG["timeout"] // APP_CONFIG["poll_interval"]
        attempts = 0
        
        while attempts < max_attempts:
            success, message, status_data = self.check_task_status(task_code)
            
            if not success:
                return False, f"狀態查詢失敗: {message}", None
            
            # 解析狀態
            if status_data.get('code') == 10000:  # API成功響應
                data = status_data.get('data', {})
                status = data.get('status')
                progress = data.get('progress', 0)
                msg = data.get('msg', '')
                
                # 更新進度
                if progress_callback:
                    progress_callback(progress, msg)
                
                if status == 1:  # 處理中
                    self._log(f"任務處理中，進度: {progress}%")
                elif status == 2:  # 完成
                    result_url = data.get('result')
                    if result_url:
                        # 構建完整的下載URL - 使用遠端服務器地址
                        from config import REMOTE_HOST
                        download_url = f"http://{REMOTE_HOST}:8383{result_url}"
                        self._log(f"構建下載URL: {download_url}")
                        return True, "任務完成", download_url
                    else:
                        return False, "任務完成但沒有結果URL", None
                elif status == 3:  # 失敗
                    return False, f"任務失敗: {msg}", None
            else:
                error_msg = status_data.get('msg', '未知錯誤')
                return False, f"API錯誤: {error_msg}", None
            
            attempts += 1
            time.sleep(APP_CONFIG["poll_interval"])
        
        return False, "任務超時", None
    
    def generate_tts_audio(self, text: str, voice_config: Dict[str, Any]) -> Tuple[bool, str, Optional[bytes]]:
        """
        生成TTS音頻
        
        Args:
            text: 要合成的文本
            voice_config: 聲音配置
            
        Returns:
            Tuple[成功狀態, 消息, 音頻數據]
        """
        try:
            url = f"{API_ENDPOINTS['tts']}/v1/invoke"
            
            # 準備TTS參數（基於原始API結構）
            data = {
                "speaker": voice_config.get("speaker", str(uuid.uuid4())),
                "text": text,
                "format": "wav",
                "topP": 0.7,
                "max_new_tokens": 1024,
                "chunk_length": 100,
                "repetition_penalty": 1.2,
                "temperature": 0.7,
                "need_asr": False,
                "streaming": False,
                "is_fixed_seed": 0,
                "is_norm": 0,
                "reference_audio": voice_config.get("reference_audio", ""),
                "reference_text": voice_config.get("reference_text", "")
            }
            
            response = self.session.post(url, json=data)
            
            if response.status_code == 200:
                # 如果返回的是音頻二進制數據
                if response.headers.get('content-type', '').startswith('audio/'):
                    return True, "TTS生成成功", response.content
                else:
                    # 如果返回的是JSON
                    result = response.json()
                    return False, result.get('msg', 'TTS生成失敗'), None
            else:
                return False, f"HTTP錯誤: {response.status_code}", None
                
        except Exception as e:
            self._log(f"TTS生成時發生錯誤: {str(e)}")
            return False, f"錯誤: {str(e)}", None
    
    def create_model(self, model_name: str, video_file) -> Tuple[bool, str, Optional[str]]:
        """
        創建新模特
        
        Args:
            model_name: 模特名稱
            video_file: 影片文件對象
            
        Returns:
            Tuple[成功狀態, 消息, 模特ID]
        """
        try:
            # 上傳影片文件
            video_url = self._upload_file(video_file, "video")
            if not video_url:
                return False, "影片文件上傳失敗", None
            
            # 調用模特創建API（需要根據實際API調整）
            # 這裡假設有一個創建模特的API端點
            url = f"{API_ENDPOINTS['face2face']}/create_model"
            data = {
                'name': model_name,
                'video_path': video_url
            }
            
            response = self.session.post(url, json=data)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('code') == 10000:
                    return True, "模特創建成功", result.get('model_id')
                else:
                    return False, result.get('msg', '模特創建失敗'), None
            else:
                return False, f"HTTP錯誤: {response.status_code}", None
                
        except Exception as e:
            self._log(f"創建模特時發生錯誤: {str(e)}")
            return False, f"錯誤: {str(e)}", None
    
    def get_model_list(self, page: int = 1, page_size: int = 20, name: str = "") -> Tuple[bool, str, Optional[Dict]]:
        """
        獲取模特列表
        
        Args:
            page: 頁碼
            page_size: 每頁數量
            name: 搜索名稱
            
        Returns:
            Tuple[成功狀態, 消息, 模特列表數據]
        """
        try:
            url = f"{API_ENDPOINTS['face2face']}/models"
            params = {
                'page': page,
                'pageSize': page_size,
                'name': name
            }
            
            response = self.session.get(url, params=params)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('code') == 10000:
                    return True, "獲取成功", result.get('data')
                else:
                    return False, result.get('msg', '獲取模特列表失敗'), None
            else:
                return False, f"HTTP錯誤: {response.status_code}", None
                
        except Exception as e:
            self._log(f"獲取模特列表時發生錯誤: {str(e)}")
            return False, f"錯誤: {str(e)}", None
    
    def delete_model(self, model_id: str) -> Tuple[bool, str]:
        """
        刪除模特
        
        Args:
            model_id: 模特ID
            
        Returns:
            Tuple[成功狀態, 消息]
        """
        try:
            url = f"{API_ENDPOINTS['face2face']}/models/{model_id}"
            response = self.session.delete(url)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('code') == 10000:
                    return True, "模特刪除成功"
                else:
                    return False, result.get('msg', '模特刪除失敗')
            else:
                return False, f"HTTP錯誤: {response.status_code}"
                
        except Exception as e:
            self._log(f"刪除模特時發生錯誤: {str(e)}")
            return False, f"錯誤: {str(e)}"
    
    def get_video_list(self, page: int = 1, page_size: int = 20, name: str = "") -> Tuple[bool, str, Optional[Dict]]:
        """
        獲取影片作品列表
        
        Args:
            page: 頁碼
            page_size: 每頁數量
            name: 搜索名稱
            
        Returns:
            Tuple[成功狀態, 消息, 影片列表數據]
        """
        try:
            url = f"{API_ENDPOINTS['face2face']}/videos"
            params = {
                'page': page,
                'pageSize': page_size,
                'name': name
            }
            
            response = self.session.get(url, params=params)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('code') == 10000:
                    return True, "獲取成功", result.get('data')
                else:
                    return False, result.get('msg', '獲取影片列表失敗'), None
            else:
                return False, f"HTTP錯誤: {response.status_code}", None
                
        except Exception as e:
            self._log(f"獲取影片列表時發生錯誤: {str(e)}")
            return False, f"錯誤: {str(e)}", None
