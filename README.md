# OpenList - 完整版（前后端 + Docker）

> 一个功能完整的文件管理和音频播放系统，支持 Docker 一键部署

## ✨ 新增功能

### 🎵 音频播放器
- ✅ 全局播放列表管理
- ✅ 播放控制（播放/暂停/上一曲/下一曲/快进/快退）
- ✅ 播放模式（列表循环/随机播放/单曲循环）
- ✅ 睡眠定时功能
- ✅ 音频收藏和标记
- ✅ 后台播放支持（锁屏/切换应用继续播放）
- ✅ 暗黑模式完整适配

### 🎨 UI/UX 优化
- ✅ 简化版工具栏
- ✅ 底部主题切换按钮
- ✅ 播放器布局优化
- ✅ 中英文翻译支持

## 🚀 快速开始

### 方式1: 一键部署（推荐）

```bash
# 1. 克隆项目
git clone https://github.com/YOUR_USERNAME/openlist-docker.git
cd openlist-docker

# 2. 一键部署
chmod +x deploy.sh
./deploy.sh
```

### 方式2: 手动部署

```bash
# 1. 构建镜像
docker-compose build

# 2. 启动服务
docker-compose up -d

# 3. 查看状态
docker-compose ps
```

## 🌐 访问地址

- **前端**: http://your-server-ip:66
- **后端 API**: http://your-server-ip:5244
- **后端管理**: http://your-server-ip:5245

## 📁 项目结构

```
openList__Tag_Synchronization/
├── OpenList-main/              # 后端代码
├── OpenList-Frontend-main/     # 前端代码（含新功能）
├── docker-compose.yml          # Docker Compose 配置
├── deploy.sh                   # 一键部署脚本
├── README.md                   # 本文件
├── README_DEPLOYMENT.md        # 详细部署文档
└── data/                       # 数据目录
```

## 🔧 常用命令

```bash
# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 重新构建
docker-compose up -d --build
```

## 📊 系统要求

### 最低配置
- CPU: 1 核
- 内存: 1GB
- 磁盘: 10GB

### 推荐配置
- CPU: 2 核
- 内存: 2GB
- 磁盘: 20GB+

## 📝 详细文档

- [完整部署指南](README_DEPLOYMENT.md)
- [功能说明](COMMIT_MESSAGE.md)

## 🎯 技术栈

### 后端
- Go
- Gin Framework
- SQLite/MySQL

### 前端
- Solid.js
- Hope UI
- APlayer
- Vite

### 部署
- Docker
- Docker Compose
- Nginx

## 📸 截图

（添加你的截图）

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

- [OpenList](https://github.com/OpenListTeam/OpenList) - 原始项目
- [APlayer](https://github.com/DIYgod/APlayer) - 音频播放器

---

**Made with ❤️ by Your Name**
