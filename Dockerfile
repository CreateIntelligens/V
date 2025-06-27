# 使用 Node.js 20 作為基礎鏡像
FROM node:20-alpine

# 安裝系統依賴
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    ffmpeg \
    curl

# 設置工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝 Node.js 依賴
RUN npm install

# 創建必要的目錄結構（程式碼會通過掛載提供）
RUN mkdir -p uploads \
             data/{audios,videos,database,temp}

# 設置目錄權限
RUN chmod -R 755 uploads data

# 暴露端口
EXPOSE 5000

# 設置環境變量
ENV NODE_ENV=development
ENV PORT=5000
ENV TTS_URL=http://tts-server:18180

# 健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# 啟動開發模式（支援熱重載）
CMD ["npm", "run", "dev"]
