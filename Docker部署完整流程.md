# OpenList Docker 部署完整流程

> 📦 **从构建到部署的完整指南**

---

## 🎯 部署流程概览

```
本地 Windows          →          服务器 Linux
┌─────────────┐                 ┌──────────────┐
│ 1. 构建镜像  │                 │ 4. 加载镜像   │
│ 2. 导出 tar │    ──上传──→    │ 5. 运行容器   │
│ 3. 上传文件  │                 │ 6. 访问服务   │
└─────────────┘                 └──────────────┘
```

---

## 📦 第一步：本地构建镜像（已完成 ✅）

你已经完成了以下步骤：

### 1. 构建镜像
```batch
运行了：1-构建镜像-清理版.bat
生成了：
  - openlist-backend:latest
  - openlist-frontend:latest
```

### 2. 导出镜像
```batch
运行了：2-导出镜像.bat
生成了：
  - docker-images\openlist-backend.tar
  - docker-images\openlist-frontend.tar
```

---

## 📤 第二步：上传文件到服务器

### 方法一：使用 SCP（推荐）

在 **本地 PowerShell** 中运行：

```powershell
# 进入镜像目录
cd docker-images

# 上传两个 tar 文件到服务器
scp openlist-backend.tar root@你的服务器IP:/root/
scp openlist-frontend.tar root@你的服务器IP:/root/

# 或者一次性上传
scp openlist-*.tar root@你的服务器IP:/root/
```

**示例**：
```powershell
# 假设服务器 IP 是 192.168.1.100
scp openlist-backend.tar root@192.168.1.100:/root/
scp openlist-frontend.tar root@192.168.1.100:/root/
```

上传时会提示输入服务器密码。

### 方法二：使用 FTP/SFTP 工具

推荐工具：
- **WinSCP**（Windows）
- **FileZilla**（跨平台）

步骤：
1. 打开 FTP 工具
2. 连接到服务器（SFTP 协议，端口 22）
3. 将两个 tar 文件拖拽上传到 `/root/` 目录

### 方法三：使用宝塔面板

如果服务器安装了宝塔面板：
1. 登录宝塔面板
2. 文件管理 → `/root/` 目录
3. 点击上传，选择两个 tar 文件

---

## 🚀 第三步：服务器端加载和运行

### 自动化方案（推荐）

#### 1. 上传运行脚本

在本地 PowerShell 中：

```powershell
# 上传运行脚本
scp 3-服务器加载并运行.sh root@你的服务器IP:/root/
```

#### 2. 连接到服务器

```bash
ssh root@你的服务器IP
```

#### 3. 运行部署脚本

```bash
cd /root

# 给脚本执行权限
chmod +x 3-服务器加载并运行.sh

# 运行脚本
./3-服务器加载并运行.sh
```

脚本会自动完成：
- ✅ 检查 Docker 环境
- ✅ 加载镜像
- ✅ 创建网络和数据目录
- ✅ 启动容器
- ✅ 显示访问地址

### 手动部署方案

如果喜欢手动操作，SSH 连接到服务器后执行：

#### 1. 检查文件

```bash
cd /root
ls -lh openlist-*.tar
# 应该看到两个 tar 文件
```

#### 2. 安装 Docker（如果未安装）

```bash
# 检查是否已安装
docker --version

# 如果未安装，执行：
curl -fsSL https://get.docker.com | sh

# 启动 Docker
systemctl start docker
systemctl enable docker
```

#### 3. 加载镜像

```bash
# 加载后端镜像（需要几分钟）
docker load -i openlist-backend.tar

# 加载前端镜像
docker load -i openlist-frontend.tar

# 验证镜像
docker images | grep openlist
```

应该看到：
```
REPOSITORY           TAG       IMAGE ID       CREATED        SIZE
openlist-backend     latest    xxxxxxxxxxxx   1 hour ago     xxx MB
openlist-frontend    latest    xxxxxxxxxxxx   1 hour ago     xxx MB
```

#### 4. 创建数据目录

```bash
mkdir -p /root/data
```

#### 5. 创建 Docker 网络

```bash
docker network create openlist-network
```

#### 6. 启动后端容器

```bash
docker run -d \
  --name openlist-backend \
  --network openlist-network \
  -p 5244:5244 \
  -v /root/data:/app/data \
  --restart unless-stopped \
  openlist-backend:latest
```

#### 7. 启动前端容器

```bash
docker run -d \
  --name openlist-frontend \
  --network openlist-network \
  -p 80:80 \
  --restart unless-stopped \
  openlist-frontend:latest
```

#### 8. 验证部署

```bash
# 查看容器状态
docker ps

# 应该看到两个容器都在运行：
# openlist-backend   Up 10 seconds
# openlist-frontend  Up 5 seconds

# 查看后端日志
docker logs openlist-backend

# 测试后端 API
curl http://localhost:5244/api/public/settings
```

---

## ✅ 第四步：访问服务

### 1. 获取服务器 IP

```bash
# 在服务器上执行
curl ifconfig.me
```

### 2. 配置防火墙

确保开放必要端口：

**使用 UFW（Ubuntu/Debian）**：
```bash
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

**使用 firewalld（CentOS）**：
```bash
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload
```

**云服务器安全组**：
- 阿里云/腾讯云：在控制台的安全组中开放 80 和 443 端口

### 3. 访问网站

在浏览器中打开：
```
http://你的服务器IP
```

### 4. 首次登录

首次访问会提示创建管理员账号：
- 设置用户名和密码
- 记住这些信息

---

## 🔧 日常管理命令

### 查看容器状态

```bash
docker ps
```

### 查看日志

```bash
# 查看后端日志（实时）
docker logs -f openlist-backend

# 查看前端日志
docker logs -f openlist-frontend

# 查看最近 100 行日志
docker logs --tail 100 openlist-backend
```

### 重启服务

```bash
# 重启后端
docker restart openlist-backend

# 重启前端
docker restart openlist-frontend

# 重启所有
docker restart openlist-backend openlist-frontend
```

### 停止服务

```bash
# 停止服务
docker stop openlist-backend openlist-frontend

# 启动服务
docker start openlist-backend openlist-frontend
```

### 进入容器调试

```bash
# 进入后端容器
docker exec -it openlist-backend sh

# 进入前端容器
docker exec -it openlist-frontend sh

# 退出容器
exit
```

---

## 📊 数据管理

### 数据位置

所有数据都保存在：
```
/root/data/
├── data.db          # SQLite 数据库
├── config.json      # 配置文件
├── temp/            # 临时文件
└── log/             # 日志文件
```

### 备份数据

```bash
# 方法一：打包备份
cd /root
tar -czf openlist-backup-$(date +%Y%m%d).tar.gz data/

# 方法二：下载到本地（在本地执行）
scp -r root@服务器IP:/root/data ./backup/
```

### 恢复数据

```bash
# 停止服务
docker stop openlist-backend openlist-frontend

# 恢复备份
tar -xzf openlist-backup-20250115.tar.gz

# 启动服务
docker start openlist-backend openlist-frontend
```

---

## 🔄 更新部署

### 方法一：更新镜像

1. 在本地重新构建镜像
2. 导出新的 tar 文件
3. 上传到服务器
4. 在服务器执行：

```bash
# 停止并删除旧容器
docker stop openlist-backend openlist-frontend
docker rm openlist-backend openlist-frontend

# 删除旧镜像
docker rmi openlist-backend:latest openlist-frontend:latest

# 加载新镜像
docker load -i openlist-backend.tar
docker load -i openlist-frontend.tar

# 重新启动（使用第三步的启动命令）
```

### 方法二：使用脚本更新

创建更新脚本 `update.sh`：

```bash
#!/bin/bash
echo "停止服务..."
docker stop openlist-backend openlist-frontend
docker rm openlist-backend openlist-frontend

echo "删除旧镜像..."
docker rmi openlist-backend:latest openlist-frontend:latest

echo "加载新镜像..."
docker load -i openlist-backend.tar
docker load -i openlist-frontend.tar

echo "启动服务..."
docker run -d \
  --name openlist-backend \
  --network openlist-network \
  -p 5244:5244 \
  -v $(pwd)/data:/app/data \
  --restart unless-stopped \
  openlist-backend:latest

docker run -d \
  --name openlist-frontend \
  --network openlist-network \
  -p 80:80 \
  --restart unless-stopped \
  openlist-frontend:latest

echo "更新完成！"
docker ps
```

使用：
```bash
chmod +x update.sh
./update.sh
```

---

## 🔐 配置 HTTPS

### 使用 Nginx 反向代理（推荐）

#### 1. 安装 Nginx

```bash
# Ubuntu/Debian
apt update && apt install nginx -y

# CentOS
yum install nginx -y
```

#### 2. 配置 Nginx

创建配置文件 `/etc/nginx/sites-available/openlist`：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 修改为你的域名
    
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用配置：
```bash
ln -s /etc/nginx/sites-available/openlist /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

#### 3. 申请 SSL 证书

```bash
# 安装 certbot
apt install certbot python3-certbot-nginx -y

# 申请证书
certbot --nginx -d your-domain.com

# 证书会自动续期
```

---

## ❓ 常见问题

### Q1: 端口被占用怎么办？

```bash
# 查看端口占用
netstat -tulpn | grep :80
netstat -tulpn | grep :5244

# 修改容器端口映射
docker run -d \
  --name openlist-frontend \
  -p 8080:80 \  # 改为其他端口
  openlist-frontend:latest
```

### Q2: 容器无法启动？

```bash
# 查看详细错误日志
docker logs openlist-backend

# 检查镜像是否加载成功
docker images | grep openlist

# 删除容器重新创建
docker rm openlist-backend
# 然后重新运行启动命令
```

### Q3: 无法访问网站？

检查清单：
1. ✅ 容器是否在运行：`docker ps`
2. ✅ 防火墙是否开放端口
3. ✅ 云服务器安全组是否配置
4. ✅ 本地能否访问：`curl http://localhost`

### Q4: 数据会丢失吗？

不会！只要使用了 `-v /root/data:/app/data` 挂载，数据就持久化到了宿主机。
即使删除容器，数据也不会丢失。

### Q5: 如何查看占用的磁盘空间？

```bash
# 查看数据目录大小
du -sh /root/data

# 查看 Docker 占用
docker system df

# 清理无用的镜像和容器
docker system prune -a
```

---

## 📞 获取帮助

- **项目文档**: `README.md`
- **查看日志**: `docker logs -f openlist-backend`
- **GitHub Issues**: https://github.com/OpenListTeam/OpenList/issues

---

## 🎉 部署完成检查清单

- [ ] 镜像成功加载
- [ ] 容器正常运行（`docker ps` 显示 Up）
- [ ] 可以通过浏览器访问
- [ ] 创建了管理员账号
- [ ] 防火墙和安全组已配置
- [ ] 数据目录已挂载
- [ ] 容器设置了自动重启

**恭喜！你的 OpenList 已经成功部署！** 🚀

