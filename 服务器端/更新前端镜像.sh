#!/bin/bash
################################################################################
# 快速更新前端镜像脚本
# 用于修复音频播放问题
################################################################################

set -e

echo "=========================================="
echo "  更新前端镜像（修复音频播放）"
echo "=========================================="
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 检查镜像文件
if [ ! -f "/opt/openlist/openlist-frontend.tar" ]; then
    echo -e "${RED}错误：未找到 openlist-frontend.tar${NC}"
    echo "请先上传新的前端镜像文件到 /opt/openlist/"
    exit 1
fi

echo -e "${YELLOW}[1/5] 停止前端容器...${NC}"
docker stop openlist-frontend 2>/dev/null || echo "容器未运行"
docker rm openlist-frontend 2>/dev/null || echo "容器不存在"
echo -e "${GREEN}[✓] 前端容器已停止${NC}"
echo ""

echo -e "${YELLOW}[2/5] 删除旧镜像...${NC}"
docker rmi openlist-frontend:latest 2>/dev/null || echo "镜像不存在"
echo -e "${GREEN}[✓] 旧镜像已删除${NC}"
echo ""

echo -e "${YELLOW}[3/5] 加载新镜像...${NC}"
cd /opt/openlist
docker load -i openlist-frontend.tar
echo -e "${GREEN}[✓] 新镜像已加载${NC}"
echo ""

echo -e "${YELLOW}[4/5] 启动前端容器...${NC}"
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
echo -e "${GREEN}[✓] 前端容器已启动${NC}"
echo ""

sleep 3

echo -e "${YELLOW}[5/5] 验证部署...${NC}"
docker ps --filter "name=openlist-frontend" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# 验证 Nginx 配置
echo "验证 Nginx 配置..."
docker exec openlist-frontend cat /etc/nginx/conf.d/default.conf | grep -A 5 "location /d/"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}[✓] Nginx 配置包含 /d/ 代理${NC}"
else
    echo -e "${RED}[✗] 警告：Nginx 配置可能不正确${NC}"
fi
echo ""

echo "=========================================="
echo -e "  ${GREEN}✨ 更新完成！${NC}"
echo "=========================================="
echo ""
echo "请测试音频播放："
echo "  1. 打开浏览器：http://70.39.205.183:66"
echo "  2. 播放音频文件"
echo "  3. 应该能正常播放了"
echo ""
echo "如果还是不能播放，查看日志："
echo "  docker logs -f openlist-frontend"
echo "  docker logs -f openlist-backend"
echo ""

