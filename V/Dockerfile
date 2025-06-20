# 使用 Node.js 18 作為基礎鏡像
FROM node:18-alpine

# 設置工作目錄
WORKDIR /app

# 複製 web-vue 目錄的 package.json
COPY web-vue/package*.json ./

# 安裝所有依賴
RUN npm install

# 複製 web-vue 源代碼
COPY web-vue/ ./

# 構建前端（如果有 build 腳本）
RUN npm run build 2>/dev/null || echo "No build script found, skipping..."

# 創建必要的目錄
RUN mkdir -p uploads data/database

# 暴露端口
EXPOSE 3000

# 設置環境變量
ENV NODE_ENV=development
ENV PORT=3000

# 啟動應用
CMD ["npm", "start"]
