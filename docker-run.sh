#!/bin/bash

# AI Model Studio Docker 運行腳本

echo "🚀 啟動 AI Model Studio..."

# 創建必要的目錄
mkdir -p data/voice data/database uploads

# 設置權限
chmod 755 data uploads

# 停止並移除現有容器
echo "📦 清理現有容器..."
docker-compose down

# 構建並啟動服務
echo "🔨 構建並啟動服務..."
docker-compose up --build -d

# 等待服務啟動
echo "⏳ 等待服務啟動..."
sleep 10

# 檢查服務狀態
echo "🔍 檢查服務狀態..."
docker-compose ps

echo "✅ 部署完成！"
echo ""
echo "📱 Web界面: http://localhost:5000"
echo "🎙️ TTS服務: http://localhost:8080"
echo "🗄️ 數據庫: localhost:5432"
echo ""
echo "📝 查看日誌: docker-compose logs -f"
echo "🛑 停止服務: docker-compose down"