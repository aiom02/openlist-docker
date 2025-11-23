# 前端 Dockerfile - 多阶段构建
# 第一阶段：构建前端代码
FROM node:20-alpine AS builder

WORKDIR /app

# 复制 package 文件
COPY package.json pnpm-lock.yaml ./

# 安装 pnpm 和依赖
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# 复制源码
COPY . .

# 构建
RUN pnpm build

# 第二阶段：使用 nginx 部署
FROM nginx:alpine

# 从构建阶段复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]

