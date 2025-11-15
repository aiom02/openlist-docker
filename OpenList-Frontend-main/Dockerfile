# 前端 Dockerfile - 使用 nginx 部署静态文件
# 
# 支持两种模式：
# 1. 使用已构建的 dist 目录（默认，快速）
# 2. 从源码构建（取消注释 builder 阶段）

# ========== 方式一：使用已构建的 dist 目录（默认） ==========
FROM nginx:alpine

# 复制构建产物到 nginx
COPY dist /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]

# ========== 方式二：从源码构建（可选） ==========
# 如需从源码构建，将下面的内容替换到上面
# 
# FROM node:20-alpine AS builder
# WORKDIR /app
# COPY package.json pnpm-lock.yaml ./
# RUN npm install -g pnpm && pnpm install --frozen-lockfile
# COPY . .
# RUN pnpm build
# 
# FROM nginx:alpine
# COPY --from=builder /app/dist /usr/share/nginx/html
# COPY nginx.conf /etc/nginx/conf.d/default.conf
# EXPOSE 80
# CMD ["nginx", "-g", "daemon off;"]

