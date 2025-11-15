#!/bin/bash

# OpenList 服务器部署脚本
# 使用方法: bash 服务器部署脚本.sh

set -e

echo "===================================="
echo "OpenList Docker 部署脚本"
echo "===================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}建议使用 root 用户运行此脚本${NC}"
    echo "或者使用: sudo bash $0"
    echo ""
fi

# 1. 检查 Docker 和 Docker Compose
echo "[1/6] 检查 Docker 环境..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装${NC}"
    echo "请先安装 Docker: https://docs.docker.com/engine/install/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}⚠ docker-compose 未安装，尝试使用 docker compose${NC}"
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

echo -e "${GREEN}✅ Docker 环境正常${NC}"
docker --version
$DOCKER_COMPOSE --version
echo ""

# 2. 检查镜像文件
echo "[2/6] 检查镜像文件..."
if [ ! -f "openlist-backend.tar" ]; then
    echo -e "${RED}❌ 找不到 openlist-backend.tar${NC}"
    exit 1
fi

if [ ! -f "openlist-frontend.tar" ]; then
    echo -e "${RED}❌ 找不到 openlist-frontend.tar${NC}"
    exit 1
fi

if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ 找不到 docker-compose.yml${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 所有必需文件存在${NC}"
echo ""

# 3. 加载镜像
echo "[3/6] 加载 Docker 镜像..."
echo "加载后端镜像 (这可能需要几分钟)..."
docker load -i openlist-backend.tar
echo ""
echo "加载前端镜像..."
docker load -i openlist-frontend.tar
echo ""
echo -e "${GREEN}✅ 镜像加载完成${NC}"
docker images | grep openlist
echo ""

# 4. 创建数据目录
echo "[4/6] 创建数据目录..."
mkdir -p ./data

# 设置正确的权限 (容器使用 UID=1001)
chown -R 1001:1001 ./data 2>/dev/null || {
    echo -e "${YELLOW}⚠ 无法设置 UID 1001，将使用当前用户权限${NC}"
    chmod 777 ./data
}

echo -e "${GREEN}✅ 数据目录创建完成: $(pwd)/data${NC}"
echo ""

# 5. 停止旧容器 (如果存在)
echo "[5/6] 停止旧容器..."
$DOCKER_COMPOSE down 2>/dev/null || echo "没有运行中的旧容器"
echo ""

# 6. 启动服务
echo "[6/6] 启动服务..."
$DOCKER_COMPOSE up -d

# 等待服务启动
echo ""
echo "等待服务启动..."
sleep 5

# 检查容器状态
echo ""
echo "===================================="
echo "容器状态:"
echo "===================================="
$DOCKER_COMPOSE ps

echo ""
echo "===================================="
echo -e "${GREEN}✅ 部署完成！${NC}"
echo "===================================="
echo ""
echo "访问地址:"
echo "  - 前端: http://$(hostname -I | awk '{print $1}'):80"
echo "  - 后端 API: http://$(hostname -I | awk '{print $1}'):5244"
echo "  - WebDAV: http://$(hostname -I | awk '{print $1}'):5245"
echo ""
echo "常用命令:"
echo "  查看日志: $DOCKER_COMPOSE logs -f"
echo "  重启服务: $DOCKER_COMPOSE restart"
echo "  停止服务: $DOCKER_COMPOSE stop"
echo "  停止并删除: $DOCKER_COMPOSE down"
echo ""
echo "如需查看实时日志，运行:"
echo "  $DOCKER_COMPOSE logs -f"
echo ""

