#!/bin/bash
################################################################################
# OpenList 服务器端加载和运行脚本（定制版）
# 服务器 IP: 70.39.205.183
# 前端端口: 66
# 部署目录: /opt/openlist
################################################################################

set -e

echo "=========================================="
echo "  OpenList 服务器部署脚本（定制版）"
echo "=========================================="
echo ""
echo "服务器 IP: 70.39.205.183"
echo "前端端口: 66"
echo "部署目录: /opt/openlist"
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 配置变量
DEPLOY_DIR="/opt/openlist"
SERVER_IP="70.39.205.183"
FRONTEND_PORT=66
BACKEND_PORT=5244

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker 未安装！${NC}"
    echo "正在安装 Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl start docker
    systemctl enable docker
    echo -e "${GREEN}[✓] Docker 安装完成${NC}"
else
    echo -e "${GREEN}[✓] Docker 已安装${NC}"
fi
echo ""

# 进入部署目录
cd $DEPLOY_DIR

# 检查镜像文件是否存在
echo -e "${YELLOW}[1/6] 检查镜像文件...${NC}"
if [ ! -f "openlist-backend.tar" ]; then
    echo -e "${RED}错误：未找到 openlist-backend.tar${NC}"
    echo "当前目录: $(pwd)"
    echo "请确保文件已上传到 $DEPLOY_DIR"
    ls -lh
    exit 1
fi

if [ ! -f "openlist-frontend.tar" ]; then
    echo -e "${RED}错误：未找到 openlist-frontend.tar${NC}"
    echo "当前目录: $(pwd)"
    echo "请确保文件已上传到 $DEPLOY_DIR"
    ls -lh
    exit 1
fi

echo -e "${GREEN}[✓] 镜像文件检查完成${NC}"
echo "  - openlist-backend.tar: $(du -h openlist-backend.tar | cut -f1)"
echo "  - openlist-frontend.tar: $(du -h openlist-frontend.tar | cut -f1)"
echo ""

# 加载 Docker 镜像
echo -e "${YELLOW}[2/6] 加载 Docker 镜像...${NC}"
echo "正在加载后端镜像（可能需要几分钟，请耐心等待）..."
docker load -i openlist-backend.tar
if [ $? -ne 0 ]; then
    echo -e "${RED}后端镜像加载失败${NC}"
    exit 1
fi
echo ""

echo "正在加载前端镜像..."
docker load -i openlist-frontend.tar
if [ $? -ne 0 ]; then
    echo -e "${RED}前端镜像加载失败${NC}"
    exit 1
fi
echo -e "${GREEN}[✓] 镜像加载完成${NC}"
echo ""

# 验证镜像
echo "已加载的镜像："
docker images | grep openlist
echo ""

# 停止并删除旧容器
echo -e "${YELLOW}[3/6] 清理旧容器...${NC}"
docker stop openlist-backend openlist-frontend 2>/dev/null || true
docker rm openlist-backend openlist-frontend 2>/dev/null || true
echo -e "${GREEN}[✓] 清理完成${NC}"
echo ""

# 创建数据目录并设置权限
echo -e "${YELLOW}[4/6] 创建数据目录并设置权限...${NC}"
mkdir -p $DEPLOY_DIR/data
# OpenList v4.1.0+ 使用 UID 1001 运行，需要正确的权限
chown -R 1001:1001 $DEPLOY_DIR/data 2>/dev/null || chown -R 1001:0 $DEPLOY_DIR/data
chmod -R 755 $DEPLOY_DIR/data
echo -e "${GREEN}[✓] 数据目录: $DEPLOY_DIR/data${NC}"
echo -e "${GREEN}[✓] 权限已设置为 UID:1001${NC}"
echo ""

# 创建 Docker 网络
echo -e "${YELLOW}[5/6] 创建 Docker 网络...${NC}"
docker network create openlist-network 2>/dev/null && echo "网络已创建" || echo "网络已存在"
echo -e "${GREEN}[✓] 网络准备完成${NC}"
echo ""

# 启动容器
echo -e "${YELLOW}[6/6] 启动服务...${NC}"
echo ""

# 启动后端
echo "正在启动后端服务（端口 $BACKEND_PORT）..."
docker run -d \
  --name openlist-backend \
  --network openlist-network \
  -p $BACKEND_PORT:5244 \
  -v $DEPLOY_DIR/data:/app/data \
  --restart unless-stopped \
  openlist-backend:latest

if [ $? -ne 0 ]; then
    echo -e "${RED}[✗] 后端启动失败${NC}"
    echo "查看错误日志："
    docker logs openlist-backend
    exit 1
fi
echo -e "${GREEN}[✓] 后端服务已启动${NC}"
echo ""

# 等待后端启动
echo "等待后端初始化（5秒）..."
sleep 5

# 启动前端
echo "正在启动前端服务（端口 $FRONTEND_PORT）..."
docker run -d \
  --name openlist-frontend \
  --network openlist-network \
  -p $FRONTEND_PORT:80 \
  --restart unless-stopped \
  openlist-frontend:latest

if [ $? -ne 0 ]; then
    echo -e "${RED}[✗] 前端启动失败${NC}"
    echo "查看错误日志："
    docker logs openlist-frontend
    exit 1
fi
echo -e "${GREEN}[✓] 前端服务已启动${NC}"
echo ""

# 配置防火墙
echo -e "${YELLOW}配置防火墙...${NC}"
if command -v ufw &> /dev/null; then
    ufw allow $FRONTEND_PORT/tcp 2>/dev/null || true
    ufw allow $BACKEND_PORT/tcp 2>/dev/null || true
    echo "UFW 防火墙已配置"
elif command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-port=$FRONTEND_PORT/tcp 2>/dev/null || true
    firewall-cmd --permanent --add-port=$BACKEND_PORT/tcp 2>/dev/null || true
    firewall-cmd --reload 2>/dev/null || true
    echo "Firewalld 防火墙已配置"
else
    echo -e "${YELLOW}未检测到防火墙工具，请手动开放端口 $FRONTEND_PORT 和 $BACKEND_PORT${NC}"
fi
echo ""

# 等待服务启动
echo "等待服务完全启动（3秒）..."
sleep 3

# 完成提示
echo ""
echo "=========================================="
echo -e "  ${GREEN}✨ 部署完成！${NC}"
echo "=========================================="
echo ""
echo "📍 访问地址："
echo -e "  ${GREEN}前端: http://$SERVER_IP:$FRONTEND_PORT${NC}"
echo -e "  后端 API: http://$SERVER_IP:$BACKEND_PORT${NC}"
echo ""
echo "🔍 容器状态："
docker ps --filter "name=openlist" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "📁 数据目录: $DEPLOY_DIR/data"
echo ""
echo "📋 常用命令："
echo "  查看后端日志: docker logs -f openlist-backend"
echo "  查看前端日志: docker logs -f openlist-frontend"
echo "  重启后端:     docker restart openlist-backend"
echo "  重启前端:     docker restart openlist-frontend"
echo "  停止所有:     docker stop openlist-backend openlist-frontend"
echo "  启动所有:     docker start openlist-backend openlist-frontend"
echo ""
echo "🔥 下一步："
echo "  1. 在浏览器打开: http://$SERVER_IP:$FRONTEND_PORT"
echo "  2. 首次访问时创建管理员账号"
echo "  3. 开始使用 OpenList"
echo ""
echo -e "${YELLOW}⚠️  提示：${NC}"
echo "  - 如果无法访问，请检查云服务商的安全组是否开放了端口 $FRONTEND_PORT"
echo "  - 数据保存在 $DEPLOY_DIR/data，请定期备份"
echo ""

