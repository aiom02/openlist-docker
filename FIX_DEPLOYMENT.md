# 部署问题修复

## 🐛 问题

在 Linux 服务器上运行 `./deploy.sh` 时出现错误：

```
ERROR [openlist-frontend 2/3] COPY dist /usr/share/nginx/html:
failed to compute cache key: "/dist": not found
```

## 🔍 原因

前端 Dockerfile 尝试复制 `dist` 目录，但该目录不存在，因为：
1. 前端代码需要先构建才能生成 `dist` 目录
2. 原 Dockerfile 假设 `dist` 已经存在

## ✅ 解决方案

修改前端 Dockerfile 为**多阶段构建**，在容器内从源码构建前端：

### 修改前（旧版）
```dockerfile
FROM nginx:alpine
COPY dist /usr/share/nginx/html  # ❌ dist 不存在
```

### 修改后（新版）
```dockerfile
# 第一阶段：构建前端代码
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build  # ✅ 在容器内构建

# 第二阶段：使用 nginx 部署
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html  # ✅ 从构建阶段复制
```

## 🚀 现在可以重新部署

### 在服务器上执行

```bash
# 1. 拉取最新代码
cd ~/openlist-docker
git pull

# 2. 重新运行部署脚本
./deploy.sh
```

或者一行命令：

```bash
cd ~/openlist-docker && git pull && ./deploy.sh
```

## ⏱️ 预期构建时间

- **第一次构建**: 约 5-10 分钟（需要下载 Node.js 镜像和依赖）
- **后续构建**: 约 2-3 分钟（使用缓存）

## 📊 构建过程

部署脚本会显示构建进度：

```
[INFO] 开始构建 Docker 镜像...
[WARNING] 这可能需要几分钟时间，请耐心等待...

Building openlist-frontend...
Step 1/12 : FROM node:20-alpine AS builder
Step 2/12 : WORKDIR /app
Step 3/12 : COPY package.json pnpm-lock.yaml ./
Step 4/12 : RUN npm install -g pnpm && pnpm install
Step 5/12 : COPY . .
Step 6/12 : RUN pnpm build
...
```

## ✨ 优势

使用多阶段构建的好处：

1. **无需本地构建** - 不需要在本地机器上构建前端
2. **环境一致** - 构建环境完全一致
3. **镜像更小** - 最终镜像只包含构建产物，不包含 Node.js 和依赖
4. **自动化** - 一键完成所有步骤

## 🔄 已推送到 GitHub

修复已推送到仓库：
- Repository: https://github.com/aiom02/openlist-docker.git
- Commit: `fix: 修改前端 Dockerfile 为多阶段构建，从源码构建前端代码`

## 📝 下次部署

以后在服务器上部署时，只需：

```bash
git clone https://github.com/aiom02/openlist-docker.git
cd openlist-docker
chmod +x deploy.sh
./deploy.sh
```

一切都会自动完成！🎉
