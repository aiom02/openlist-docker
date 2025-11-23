# 🚀 快速启动指南

## 📋 准备工作

### 1. 上传到 GitHub

```bash
# 进入项目目录
cd d:\SoftwareDevelopment\Project\openList__Tag_Synchronization

# 初始化 Git（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "feat: OpenList 完整项目 - 前后端 + Docker 一键部署"

# 创建 GitHub 仓库后，添加远程地址
git remote add origin https://github.com/YOUR_USERNAME/openlist-docker.git

# 推送
git push -u origin main
```

## 🐧 Linux 服务器部署

### 一行命令部署

```bash
git clone https://github.com/YOUR_USERNAME/openlist-docker.git && cd openlist-docker && chmod +x deploy.sh && ./deploy.sh
```

### 分步部署

```bash
# 1. 克隆项目
git clone https://github.com/YOUR_USERNAME/openlist-docker.git

# 2. 进入目录
cd openlist-docker

# 3. 赋予执行权限
chmod +x deploy.sh

# 4. 运行部署脚本
./deploy.sh
```

## ✅ 部署完成后

访问以下地址：

- **前端**: http://你的服务器IP:66
- **后端**: http://你的服务器IP:5244

## 🔧 常用操作

### 查看日志
```bash
docker-compose logs -f
```

### 停止服务
```bash
docker-compose down
```

### 重启服务
```bash
docker-compose restart
```

### 更新代码
```bash
git pull
docker-compose up -d --build
```

## 🎉 完成！

现在你可以开始使用 OpenList 了！
