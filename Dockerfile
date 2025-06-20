# 使用 Node.js 20 作為基礎鏡像
FROM node:20-alpine

# 設置工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴
RUN npm ci --only=production

# 安裝開發依賴（因為需要構建）
RUN npm ci

# 複製源代碼
COPY . .

# 創建必要的目錄
RUN mkdir -p uploads data/database

# 構建前端
RUN npm run build || echo "No build script found"

# 暴露端口
EXPOSE 5000

# 設置環境變量
ENV NODE_ENV=production
ENV PORT=5000

# 啟動應用
CMD ["npm", "run", "start"]