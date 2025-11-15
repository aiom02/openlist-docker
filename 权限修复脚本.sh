#!/bin/bash
################################################################################
# OpenList 权限修复脚本
# 用于修复 "Current user does not have write permissions" 错误
################################################################################

echo "=========================================="
echo "  OpenList 权限修复"
echo "=========================================="
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

DATA_DIR="/opt/openlist/data"

# 1. 停止容器
echo -e "${YELLOW}[1/4] 停止容器...${NC}"
docker stop openlist-backend openlist-frontend 2>/dev/null || true
docker rm openlist-backend openlist-frontend 2>/dev/null || true
echo -e "${GREEN}[✓] 容器已停止${NC}"
echo ""

# 2. 修复权限
echo -e "${YELLOW}[2/4] 修复数据目录权限...${NC}"
echo "数据目录: $DATA_DIR"

# 确保目录存在
mkdir -p $DATA_DIR

# 设置所有者为 UID 1001（OpenList 容器内的用户）
echo "设置所有者为 UID 1001..."
chown -R 1001:1001 $DATA_DIR 2>/dev/null || chown -R 1001:0 $DATA_DIR

# 设置权限
echo "设置权限为 755..."
chmod -R 755 $DATA_DIR

echo -e "${GREEN}[✓] 权限修复完成${NC}"
echo ""

# 3. 验证权限
echo -e "${YELLOW}[3/4] 验证权限...${NC}"
ls -la $DATA_DIR
echo ""

# 4. 重新启动容器
echo -e "${YELLOW}[4/4] 重新启动容器...${NC}"

# 启动后端
echo "启动后端..."
docker run -d \
  --name openlist-backend \
  --network openlist-network \
  -p 5244:5244 \
  -v /opt/openlist/data:/app/data \
  --restart unless-stopped \
  openlist-backend:latest

if [ $? -eq 0 ]; then
    echo -e "${GREEN}[✓] 后端已启动${NC}"
else
    echo -e "${RED}[✗] 后端启动失败${NC}"
    exit 1
fi

# 等待后端启动
sleep 3

# 启动前端
echo "启动前端..."
docker run -d \
  --name openlist-frontend \
  --network openlist-network \
  -p 66:80 \
  --restart unless-stopped \
  openlist-frontend:latest

if [ $? -eq 0 ]; then
    echo -e "${GREEN}[✓] 前端已启动${NC}"
else
    echo -e "${RED}[✗] 前端启动失败${NC}"
    exit 1
fi

echo ""
echo "=========================================="
echo -e "  ${GREEN}修复完成！${NC}"
echo "=========================================="
echo ""

# 检查状态
echo "容器状态："
docker ps --filter "name=openlist" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "访问地址: http://70.39.205.183:66"
echo ""

