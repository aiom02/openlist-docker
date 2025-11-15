#!/bin/bash
################################################################################
# OpenList 问题诊断脚本
################################################################################

echo "=========================================="
echo "  OpenList 问题诊断"
echo "=========================================="
echo ""

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 1. 检查容器状态
echo -e "${YELLOW}[1] 容器状态${NC}"
docker ps -a --filter "name=openlist" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# 2. 查看后端日志
echo -e "${YELLOW}[2] 后端日志（最后 50 行）${NC}"
echo "----------------------------------------"
docker logs --tail 50 openlist-backend 2>&1
echo ""

# 3. 查看前端日志
echo -e "${YELLOW}[3] 前端日志（最后 50 行）${NC}"
echo "----------------------------------------"
docker logs --tail 50 openlist-frontend 2>&1
echo ""

# 4. 检查端口占用
echo -e "${YELLOW}[4] 端口占用情况${NC}"
echo "端口 5244:"
netstat -tulpn | grep :5244 || echo "端口 5244 未被占用"
echo ""
echo "端口 66:"
netstat -tulpn | grep :66 || echo "端口 66 未被占用"
echo ""

# 5. 检查镜像
echo -e "${YELLOW}[5] 镜像信息${NC}"
docker images | grep openlist
echo ""

# 6. 检查网络
echo -e "${YELLOW}[6] Docker 网络${NC}"
docker network ls | grep openlist
echo ""

# 7. 检查数据目录
echo -e "${YELLOW}[7] 数据目录${NC}"
ls -lah /opt/openlist/data
echo ""

# 8. 检查磁盘空间
echo -e "${YELLOW}[8] 磁盘空间${NC}"
df -h /opt/openlist
echo ""

# 9. 检查内存
echo -e "${YELLOW}[9] 内存使用${NC}"
free -h
echo ""

# 10. Docker 版本
echo -e "${YELLOW}[10] Docker 版本${NC}"
docker --version
echo ""

echo "=========================================="
echo "  诊断完成"
echo "=========================================="
echo ""
echo "请将以上信息发送给技术支持"
echo ""

