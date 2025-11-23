# 🐳 Docker Hub 部署方案

## 📋 方案说明

使用 Docker Hub 预构建镜像，避免服务器内存不足的问题。

**优势**:
- ✅ 服务器无需构建（节省内存和时间）
- ✅ 部署速度快（直接拉取镜像）
- ✅ 适合低配服务器

## 🔧 步骤1: 在本地构建镜像

### 在 Windows 电脑上执行

```bash
# 进入项目目录
cd d:\SoftwareDevelopment\Project\openList__Tag_Synchronization

# 登录 Docker Hub
docker login
# 输入用户名: aiom02
# 输入密码: (你的密码)

# 构建后端镜像
docker build -t aiom02/openlist-backend:latest ./OpenList-main

# 构建前端镜像
docker build -t aiom02/openlist-frontend:latest ./OpenList-Frontend-main

# 推送到 Docker Hub
docker push aiom02/openlist-backend:latest
docker push aiom02/openlist-frontend:latest
```

## 📝 步骤2: 创建新的 docker-compose 文件

创建 `docker-compose.hub.yml`：

```yaml
version: '3.8'

services:
  # 后端服务
  openlist-backend:
    image: aiom02/openlist-backend:latest
    container_name: openlist-backend
    restart: always
    ports:
      - "5244:5244"
      - "5245:5245"
    volumes:
      - ./data:/opt/openlist/data
    environment:
      - UMASK=022
      - TZ=Asia/Shanghai
    networks:
      - openlist-network

  # 前端服务
  openlist-frontend:
    image: aiom02/openlist-frontend:latest
    container_name: openlist-frontend
    restart: always
    ports:
      - "66:80"
    depends_on:
      - openlist-backend
    environment:
      - TZ=Asia/Shanghai
    networks:
      - openlist-network

networks:
  openlist-network:
    driver: bridge

volumes:
  openlist-data:
    driver: local
```

## 🚀 步骤3: 在服务器上部署

```bash
# 1. 克隆项目
git clone https://github.com/aiom02/openlist-docker.git
cd openlist-docker

# 2. 拉取镜像
docker-compose -f docker-compose.hub.yml pull

# 3. 启动服务
docker-compose -f docker-compose.hub.yml up -d

# 4. 查看状态
docker-compose -f docker-compose.hub.yml ps
```

## 🔄 更新部署

### 当你修改代码后

**在本地（Windows）**:
```bash
# 1. 重新构建镜像
docker build -t aiom02/openlist-backend:latest ./OpenList-main
docker build -t aiom02/openlist-frontend:latest ./OpenList-Frontend-main

# 2. 推送到 Docker Hub
docker push aiom02/openlist-backend:latest
docker push aiom02/openlist-frontend:latest
```

**在服务器上**:
```bash
cd ~/openlist-docker

# 1. 拉取最新镜像
docker-compose -f docker-compose.hub.yml pull

# 2. 重启服务
docker-compose -f docker-compose.hub.yml up -d
```

## 📊 构建时间对比

| 方案 | 本地构建时间 | 服务器部署时间 | 总时间 |
|------|------------|--------------|--------|
| 服务器构建 | 0 分钟 | 15-30 分钟 | 15-30 分钟 |
| Docker Hub | 10-15 分钟 | 2-5 分钟 | 12-20 分钟 |

## 💡 提示

1. **首次构建**: 在本地构建可能需要 10-15 分钟
2. **镜像大小**: 
   - 后端镜像: ~200-300MB
   - 前端镜像: ~50-100MB
3. **网络速度**: 推送和拉取速度取决于网络

## 🎯 推荐工作流程

```
本地开发 → 测试 → 构建镜像 → 推送到 Docker Hub → 服务器拉取 → 部署
```

这样服务器只需要拉取镜像，不需要构建，节省资源！
