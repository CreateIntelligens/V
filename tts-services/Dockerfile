# 使用 Python 3.10 作為基礎鏡像
FROM python:3.10-slim

# 安裝系統依賴
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# 設置工作目錄
WORKDIR /app

# 複製 requirements.txt
COPY requirements.txt .

# 安裝 Python 依賴
RUN pip install --no-cache-dir -r requirements.txt

# 複製程式碼到容器中
COPY . .

# 創建必要的目錄
RUN mkdir -p /app/data /app/models

# 設置環境變量
ENV PYTHONPATH=/app

# 暴露端口
EXPOSE 8080 8081 8082 8083

# 健康檢查
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# 啟動服務
CMD ["python", "main.py"]
