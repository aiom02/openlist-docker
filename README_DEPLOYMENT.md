# OpenList 一键部署指南

## 📦 项目结构

```
openList__Tag_Synchronization/
├── OpenList-main/              # 后端代码
├── OpenList-Frontend-main/     # 前端代码
├── docker-compose.yml          # Docker Compose 配置
├── deploy.sh                   # 一键部署脚本
└── data/                       # 数据目录（自动创建）
```

## 🚀 快速部署（推荐）

### 方式1: GitHub + 一键部署脚本

#### 1. 上传到 GitHub

```bash
# 在项目根目录
cd d:\SoftwareDevelopment\Project\openList__Tag_Synchronization

# 初始化 Git（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "feat: 完整的 OpenList 项目（前后端 + Docker 配置）"

# 添加远程仓库（替换为你的 GitHub 仓库地址）
git remote add origin https://github.com/YOUR_USERNAME/openlist-docker.git

# 推送到 GitHub
git push -u origin main
```

#### 2. 在 Linux 服务器上一键部署

```bash
# 克隆项目
git clone https://github.com/YOUR_USERNAME/openlist-docker.git
cd openlist-docker

# 一键部署
chmod +x deploy.sh
./deploy.sh
```

### 方式2: 手动部署

#### 1. 上传文件到服务器

```bash
# 使用 scp 上传整个项目
scp -r d:\SoftwareDevelopment\Project\openList__Tag_Synchronization/ user@your-server:/opt/openlist/

# 或使用 rsync（更快）
rsync -avz --progress d:\SoftwareDevelopment\Project\openList__Tag_Synchronization/ user@your-server:/opt/openlist/
```

#### 2. 在服务器上运行

```bash
ssh user@your-server
cd /opt/openlist
chmod +x deploy.sh
./deploy.sh
```

## 📋 部署脚本说明

`deploy.sh` 脚本会自动完成以下操作：

1. ✅ 检查 Docker 和 Docker Compose 是否安装
2. ✅ 创建必要的目录
3. ✅ 构建前后端 Docker 镜像
4. ✅ 启动所有服务
5. ✅ 显示服务状态和访问地址

## 🔧 手动操作（如果需要）

### 构建并启动服务

```bash
# 构建镜像
docker-compose build

# 启动服务（后台运行）
docker-compose up -d

# 查看日志
docker-compose logs -f

# 查看服务状态
docker-compose ps
```

### 停止和重启

```bash
# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 重新构建并启动
docker-compose up -d --build
```

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看后端日志
docker-compose logs -f openlist-backend

# 查看前端日志
docker-compose logs -f openlist-frontend
```

## 🌐 访问地址

部署成功后，可以通过以下地址访问：

- **前端**: http://your-server-ip:66
- **后端 API**: http://your-server-ip:5244
- **后端管理**: http://your-server-ip:5245

## 📁 数据持久化

数据存储在 `./data` 目录中，包括：
- 配置文件
- 数据库
- 上传的文件

**重要**: 定期备份 `./data` 目录！

## 🔒 安全建议

### 1. 修改默认端口

编辑 `docker-compose.yml`：

```yaml
ports:
  - "8080:80"      # 前端改为 8080
  - "8244:5244"    # 后端 API 改为 8244
  - "8245:5245"    # 后端管理改为 8245
```

### 2. 使用 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:66;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://localhost:5244/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. 配置 HTTPS

使用 Let's Encrypt：

```bash
# 安装 certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com
```

## 🐛 故障排查

### 问题1: 端口被占用

```bash
# 查看端口占用
sudo netstat -tulpn | grep :66
sudo netstat -tulpn | grep :5244

# 修改 docker-compose.yml 中的端口
```

### 问题2: 容器无法启动

```bash
# 查看详细日志
docker-compose logs openlist-backend
docker-compose logs openlist-frontend

# 重新构建
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 问题3: 前端无法连接后端

检查 `OpenList-Frontend-main/.env` 或构建配置，确保 API 地址正确：

```env
VITE_API_URL=http://your-server-ip:5244
```

## 📊 资源要求

### 最低配置
- CPU: 1 核
- 内存: 1GB
- 磁盘: 10GB

### 推荐配置
- CPU: 2 核
- 内存: 2GB
- 磁盘: 20GB+

## 🔄 更新部署

### 从 GitHub 更新

```bash
cd /opt/openlist
git pull
./deploy.sh
```

### 手动更新

```bash
# 停止服务
docker-compose down

# 更新代码
git pull

# 重新构建并启动
docker-compose up -d --build
```

## 📝 环境变量配置

创建 `.env` 文件（可选）：

```env
# 后端配置
BACKEND_PORT=5244
BACKEND_ADMIN_PORT=5245

# 前端配置
FRONTEND_PORT=66

# 时区
TZ=Asia/Shanghai

# 数据目录
DATA_DIR=./data
```

然后修改 `docker-compose.yml` 使用环境变量：

```yaml
ports:
  - "${FRONTEND_PORT}:80"
```

## 🎯 完整部署流程

### 1. 准备工作

```bash
# 确保 Docker 已安装
docker --version
docker-compose --version

# 如果未安装，执行安装
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

### 2. 克隆项目

```bash
git clone https://github.com/YOUR_USERNAME/openlist-docker.git
cd openlist-docker
```

### 3. 一键部署

```bash
chmod +x deploy.sh
./deploy.sh
```

### 4. 验证部署

```bash
# 检查服务状态
docker-compose ps

# 检查日志
docker-compose logs -f

# 访问前端
curl http://localhost:66

# 访问后端 API
curl http://localhost:5244/api/health
```

## 🎉 部署成功！

现在你可以通过浏览器访问：
- **前端**: http://your-server-ip:66
- **后端**: http://your-server-ip:5244

享受你的 OpenList 应用！

---

## 📞 支持

如有问题，请查看：
- [GitHub Issues](https://github.com/YOUR_USERNAME/openlist-docker/issues)
- [Docker 文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
