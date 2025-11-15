#!/bin/bash
################################################################################
# OpenList 最终修复脚本
# 解决 5245 端口导致宝塔面板崩溃的问题
################################################################################

set -e

echo "=========================================="
echo "  OpenList 最终修复（完整端口映射）"
echo "=========================================="
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 配置
DEPLOY_DIR="/opt/openlist"
SERVER_IP="70.39.205.183"

echo -e "${YELLOW}[1/5] 停止并删除旧容器...${NC}"
docker stop openlist-backend openlist-frontend 2>/dev/null || true
docker rm openlist-backend openlist-frontend 2>/dev/null || true
echo -e "${GREEN}[✓] 完成${NC}"
echo ""

echo -e "${YELLOW}[2/5] 设置数据目录权限...${NC}"
mkdir -p $DEPLOY_DIR/data
chown -R 1001:1001 $DEPLOY_DIR/data
chmod -R 755 $DEPLOY_DIR/data
echo -e "${GREEN}[✓] 权限已设置${NC}"
echo ""

echo -e "${YELLOW}[3/5] 创建 Docker 网络...${NC}"
docker network create openlist-network 2>/dev/null || echo "网络已存在"
echo -e "${GREEN}[✓] 网络准备完成${NC}"
echo ""

echo -e "${YELLOW}[4/5] 启动后端服务（映射完整端口）...${NC}"
docker run -d \
  --name openlist-backend \
  --network openlist-network \
  -p 5244:5244 \
  -p 5245:5245 \
  -v $DEPLOY_DIR/data:/opt/openlist/data \
  -e UMASK=022 \
  --restart unless-stopped \
  openlist-backend:latest

if [ $? -ne 0 ]; then
    echo -e "${RED}[✗] 后端启动失败${NC}"
    docker logs openlist-backend
    exit 1
fi
echo -e "${GREEN}[✓] 后端已启动（端口 5244, 5245）${NC}"
echo ""

sleep 5

echo -e "${YELLOW}[5/5] 启动前端服务...${NC}"
docker run -d \
  --name openlist-frontend \
  --network openlist-network \
  -p 66:80 \
  --restart unless-stopped \
  openlist-frontend:latest

if [ $? -ne 0 ]; then
    echo -e "${RED}[✗] 前端启动失败${NC}"
    docker logs openlist-frontend
    exit 1
fi
echo -e "${GREEN}[✓] 前端已启动（端口 66）${NC}"
echo ""

sleep 3

echo ""
echo "=========================================="
echo -e "  ${GREEN}✨ 部署成功！${NC}"
echo "=========================================="
echo ""

echo "📊 容器状态："
docker ps --filter "name=openlist" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "📍 访问地址："
echo -e "  前端:    ${GREEN}http://$SERVER_IP:66${NC}"
echo -e "  后端:    ${GREEN}http://$SERVER_IP:5244${NC}"
echo -e "  WebDAV:  ${GREEN}http://$SERVER_IP:5245${NC}"
echo ""

echo "🔐 首次访问："
echo "  1. 浏览器打开 http://$SERVER_IP:66"
echo "  2. 创建管理员账号"
echo "  3. 开始使用"
echo ""

echo "⚠️  安全组提醒："
echo "  请在云服务商控制台开放以下端口："
echo "  - 66    (前端)"
echo "  - 5244  (后端 API)"
echo "  - 5245  (WebDAV，可选)"
echo ""

echo "📋 端口说明："
echo "  5244 - HTTP API 和管理界面"
echo "  5245 - WebDAV 文件同步服务"
echo "  66   - 前端 Web 界面"
echo ""

echo "🔧 常用命令："
echo "  查看日志:  docker logs -f openlist-backend"
echo "  重启服务:  docker restart openlist-backend openlist-frontend"
echo "  停止服务:  docker stop openlist-backend openlist-frontend"
echo ""

echo "✅ 宝塔面板现在应该能正常显示容器信息了！"
echo ""

