#!/bin/bash
################################################################################
# OpenList 服务器端加载和运行脚本
# 前提：已上传 openlist-backend.tar 和 openlist-frontend.tar 到当前目录
################################################################################

set -e

echo "=========================================="
echo "  OpenList 服务器部署脚本"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker 未安装！${NC}"
    echo "请先安装 Docker："
    echo "  curl -fsSL https://get.docker.com | sh"
    exit 1
fi

echo -e "${GREEN}[✓] Docker 已安装${NC}"
echo ""

# 检查镜像文件是否存在
echo -e "${YELLOW}[1/6] 检查镜像文件...${NC}"
if [ ! -f "openlist-backend.tar" ]; then
    echo -e "${RED}错误：未找到 openlist-backend.tar${NC}"
    echo "请确保文件已上传到当前目录"
    exit 1
fi

if [ ! -f "openlist-frontend.tar" ]; then
    echo -e "${RED}错误：未找到 openlist-frontend.tar${NC}"
    echo "请确保文件已上传到当前目录"
    exit 1
fi

echo -e "${GREEN}[✓] 镜像文件检查完成${NC}"
echo ""

# 加载 Docker 镜像
echo -e "${YELLOW}[2/6] 加载 Docker 镜像...${NC}"
echo "正在加载后端镜像（可能需要几分钟）..."
docker load -i openlist-backend.tar
echo ""
echo "正在加载前端镜像..."
docker load -i openlist-frontend.tar
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

# 创建数据目录
echo -e "${YELLOW}[4/6] 创建数据目录...${NC}"
mkdir -p ./data
echo -e "${GREEN}[✓] 数据目录创建完成${NC}"
echo ""

# 创建 Docker 网络
echo -e "${YELLOW}[5/6] 创建 Docker 网络...${NC}"
docker network create openlist-network 2>/dev/null || echo "网络已存在"
echo -e "${GREEN}[✓] 网络准备完成${NC}"
echo ""

# 启动容器
echo -e "${YELLOW}[6/6] 启动服务...${NC}"
echo ""

# 启动后端
echo "正在启动后端服务..."
docker run -d \
  --name openlist-backend \
  --network openlist-network \
  -p 5244:5244 \
  -v $(pwd)/data:/app/data \
  --restart unless-stopped \
  openlist-backend:latest

if [ $? -ne 0 ]; then
    echo -e "${RED}[✗] 后端启动失败${NC}"
    exit 1
fi
echo -e "${GREEN}[✓] 后端服务已启动${NC}"
echo ""

# 等待后端启动
echo "等待后端启动（5秒）..."
sleep 5

# 启动前端
echo "正在启动前端服务..."
docker run -d \
  --name openlist-frontend \
  --network openlist-network \
  -p 80:80 \
  --restart unless-stopped \
  openlist-frontend:latest

if [ $? -ne 0 ]; then
    echo -e "${RED}[✗] 前端启动失败${NC}"
    exit 1
fi
echo -e "${GREEN}[✓] 前端服务已启动${NC}"
echo ""

# 获取服务器 IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')

# 完成提示
echo ""
echo "=========================================="
echo -e "  ${GREEN}部署完成！${NC}"
echo "=========================================="
echo ""
echo "访问地址："
echo -e "  前端: ${GREEN}http://${SERVER_IP}${NC}"
echo -e "  后端: ${GREEN}http://${SERVER_IP}:5244${NC}"
echo ""
echo "容器状态："
docker ps | grep openlist
echo ""
echo "常用命令："
echo "  查看日志:"
echo "    docker logs -f openlist-backend   # 后端日志"
echo "    docker logs -f openlist-frontend  # 前端日志"
echo ""
echo "  重启服务:"
echo "    docker restart openlist-backend"
echo "    docker restart openlist-frontend"
echo ""
echo "  停止服务:"
echo "    docker stop openlist-backend openlist-frontend"
echo ""
echo "  启动服务:"
echo "    docker start openlist-backend openlist-frontend"
echo ""
echo "数据位置: $(pwd)/data"
echo ""
echo -e "${YELLOW}提示：首次访问请创建管理员账号${NC}"
echo ""

