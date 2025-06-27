#!/usr/bin/env python3
"""
HeyGem 自定義 TTS 服務集合
包含多個 TTS 服務的統一入口和內建 Gateway
"""

import os
import sys
import asyncio
import uvicorn
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import logging

# 載入環境變數
try:
    from dotenv import load_dotenv
    load_dotenv()  # 載入 .env 文件
    logger = logging.getLogger(__name__)
    logger.info("✅ 環境變數已載入")
except ImportError:
    logger = logging.getLogger(__name__)
    logger.warning("⚠️ python-dotenv 未安裝，跳過 .env 文件載入")

# 設置日誌
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 導入自定義 TTS 服務
from services.edgetts_service import TTSService1
from services.minimax_service import TTSService2
from services.eugenes_service import TTSService3
from services.openai_service import TTSService4

app = FastAPI(
    title="HeyGem Custom TTS Services",
    description="自定義 TTS 服務集合，包含多個 TTS 引擎",
    version="1.0.0"
)

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
    service: Optional[str] = "service1"  # service1, service2, service3
    voice_config: Optional[dict] = {}
    format: str = "wav"
    language: Optional[str] = "zh"

class TTSResponse(BaseModel):
    success: bool
    service: str
    message: str
    audio_url: Optional[str] = None
    duration: Optional[float] = None

class ServiceInfo(BaseModel):
    id: str
    name: str
    description: str
    status: str
    languages: List[str]
    features: List[str]

# 初始化 TTS 服務
tts_services = {}

@app.on_event("startup")
async def startup_event():
    """啟動時初始化所有 TTS 服務"""
    global tts_services
    
    logger.info("🚀 初始化 HeyGem TTS 服務...")
    
    try:
        # 初始化服務 1
        tts_services["service1"] = TTSService1()
        await tts_services["service1"].initialize()
        logger.info("✅ TTS Service 1 初始化完成")
        
        # 初始化服務 2
        tts_services["service2"] = TTSService2()
        await tts_services["service2"].initialize()
        logger.info("✅ TTS Service 2 初始化完成")
        
        # 初始化服務 3
        tts_services["service3"] = TTSService3()
        await tts_services["service3"].initialize()
        logger.info("✅ TTS Service 3 初始化完成")
        
        # 初始化服務 4
        tts_services["service4"] = TTSService4()
        await tts_services["service4"].initialize()
        logger.info("✅ TTS Service 4 初始化完成")
        
        logger.info("🎉 所有 TTS 服務初始化完成！")
        
    except Exception as e:
        logger.error(f"❌ TTS 服務初始化失敗: {e}")
        raise

@app.get("/")
async def root():
    """根路徑"""
    return {
        "message": "HeyGem Custom TTS Services",
        "version": "1.0.0",
        "services": list(tts_services.keys()),
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """健康檢查"""
    service_status = {}
    
    for service_id, service in tts_services.items():
        try:
            status = await service.health_check()
            service_status[service_id] = status
        except Exception as e:
            service_status[service_id] = {"status": "unhealthy", "error": str(e)}
    
    all_healthy = all(status.get("status") == "healthy" for status in service_status.values())
    
    return {
        "status": "healthy" if all_healthy else "degraded",
        "services": service_status,
        "timestamp": asyncio.get_event_loop().time()
    }

@app.get("/api/services", response_model=List[ServiceInfo])
async def list_services():
    """列出所有可用的 TTS 服務"""
    services_info = []
    
    for service_id, service in tts_services.items():
        try:
            info = await service.get_info()
            services_info.append(ServiceInfo(
                id=service_id,
                name=info.get("name", f"TTS Service {service_id}"),
                description=info.get("description", "自定義 TTS 服務"),
                status="healthy",
                languages=info.get("languages", ["zh", "en"]),
                features=info.get("features", ["text_to_speech"])
            ))
        except Exception as e:
            logger.error(f"獲取服務 {service_id} 信息失敗: {e}")
            services_info.append(ServiceInfo(
                id=service_id,
                name=f"TTS Service {service_id}",
                description="服務暫時不可用",
                status="unhealthy",
                languages=[],
                features=[]
            ))
    
    return services_info

@app.post("/api/tts/generate")
async def generate_tts(request: TTSRequest):
    """
    TTS 語音合成統一入口
    根據 service 參數路由到對應的 TTS 服務
    """
    try:
        logger.info(f"收到 TTS 請求: service={request.service}, text={request.text[:50]}...")
        
        # 檢查服務是否存在
        if request.service not in tts_services:
            raise HTTPException(
                status_code=400, 
                detail=f"服務 '{request.service}' 不存在。可用服務: {list(tts_services.keys())}"
            )
        
        # 獲取對應的 TTS 服務
        tts_service = tts_services[request.service]
        
        # 調用 TTS 服務生成音頻
        result = await tts_service.generate_speech(
            text=request.text,
            voice_config=request.voice_config,
            format=request.format,
            language=request.language
        )
        
        if result["success"]:
            # 保存音頻文件到共享目錄
            import uuid
            import datetime
            
            audio_data = result["audio_data"]
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"tts_{request.service}_{timestamp}_{uuid.uuid4().hex[:8]}.{request.format}"
            
            # 確保音頻目錄存在
            audio_dir = "/app/data/audios"
            os.makedirs(audio_dir, exist_ok=True)
            
            # 保存音頻文件
            audio_path = os.path.join(audio_dir, filename)
            with open(audio_path, "wb") as f:
                f.write(audio_data)
            
            logger.info(f"✅ 音頻文件已保存: {audio_path}")
            
            # 返回音頻數據
            return Response(
                content=audio_data,
                media_type=f"audio/{request.format}",
                headers={
                    "Content-Disposition": f"attachment; filename={filename}",
                    "X-Service": request.service,
                    "X-Duration": str(result.get("duration", 0)),
                    "X-Filename": filename,
                    "X-Audio-Path": f"/data/audios/{filename}"
                }
            )
        else:
            raise HTTPException(status_code=500, detail=result["message"])
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"TTS 生成錯誤: {e}")
        raise HTTPException(status_code=500, detail=f"TTS 生成失敗: {str(e)}")

@app.get("/api/tts/services/{service_id}/info")
async def get_service_info(service_id: str):
    """獲取特定服務的詳細信息"""
    if service_id not in tts_services:
        raise HTTPException(status_code=404, detail=f"服務 '{service_id}' 不存在")
    
    try:
        service = tts_services[service_id]
        info = await service.get_info()
        return info
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"獲取服務信息失敗: {str(e)}")

if __name__ == "__main__":
    print("🎤 啟動 HeyGem 自定義 TTS 服務集合...")
    print("📍 主服務地址: http://localhost:8080")
    print("📖 API 文檔: http://localhost:8080/docs")
    print("🔍 健康檢查: http://localhost:8080/health")
    
    uvicorn.run(
        "main:app",  # 使用字符串導入而不是直接傳遞 app 對象
        host="0.0.0.0",
        port=8080,
        log_level="info",
        reload=False  # 在容器中關閉 reload 避免問題
    )
