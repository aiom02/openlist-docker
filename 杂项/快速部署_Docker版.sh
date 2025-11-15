#!/bin/bash
# OpenList Docker 快速部署脚本
# 服务器: 70.39.205.183

set -e

echo "========================================="
echo "OpenList Docker 快速部署脚本"
echo "========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 服务器信息
SERVER_IP="70.39.205.183"
INSTALL_DIR="/opt/openlist"

echo -e "${YELLOW}这个脚本将在服务器 $SERVER_IP 上部署 OpenList${NC}"
echo ""
echo "请选择部署方式："
echo "1. 仅部署 Docker 版本（使用官方镜像）"
echo "2. 部署 Docker + 上传自定义前端"
echo ""
read -p "请输入选项 (1/2): " DEPLOY_OPTION

if [ "$DEPLOY_OPTION" == "1" ]; then
    echo ""
    echo -e "${GREEN}开始部署 Docker 版本...${NC}"
    echo ""
    
    # 生成部署命令
    cat > /tmp/deploy_openlist.sh << 'DEPLOY_SCRIPT'
#!/bin/bash
set -e

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "正在安装 Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl start docker
    systemctl enable docker
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "正在安装 Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# 创建安装目录
mkdir -p /opt/openlist
cd /opt/openlist

# 创建 docker-compose.yml
cat > docker-compose.yml << 'EOF'
services:
  openlist:
    restart: always
    volumes:
      - './data:/opt/openlist/data'
    ports:
      - '5244:5244'
      - '5245:5245'
    user: '0:0'
    environment:
      - UMASK=022
      - TZ=Asia/Shanghai
    container_name: openlist
    image: 'openlistteam/openlist:latest'
EOF

echo "正在启动 OpenList..."
docker-compose up -d

echo ""
echo "========================================="
echo "部署完成！"
echo "========================================="
echo ""
echo "访问地址: http://$(curl -s ifconfig.me):5244"
echo "默认账号: admin"
echo "默认密码: admin"
echo ""
echo "⚠️  请立即登录并修改密码！"
echo ""
echo "常用命令："
echo "  查看日志: docker logs -f openlist"
echo "  重启服务: docker restart openlist"
echo "  停止服务: docker stop openlist"
echo ""
DEPLOY_SCRIPT

    echo "正在连接到服务器并部署..."
    echo ""
    echo "请输入服务器密码（SSH）:"
    
    # 上传脚本并执行
    scp /tmp/deploy_openlist.sh root@$SERVER_IP:/tmp/
    ssh root@$SERVER_IP "bash /tmp/deploy_openlist.sh"
    
    rm /tmp/deploy_openlist.sh
    
elif [ "$DEPLOY_OPTION" == "2" ]; then
    echo ""
    echo -e "${GREEN}开始构建前端并部署...${NC}"
    echo ""
    
    # 检查前端目录
    if [ ! -d "OpenList-Frontend-main" ]; then
        echo -e "${RED}错误: 找不到 OpenList-Frontend-main 目录${NC}"
        echo "请在项目根目录运行此脚本"
        exit 1
    fi
    
    # 构建前端
    echo "正在构建前端..."
    cd OpenList-Frontend-main
    
    # 检查包管理器
    if command -v pnpm &> /dev/null; then
        echo "使用 pnpm 构建..."
        pnpm install
        pnpm build
    elif command -v npm &> /dev/null; then
        echo "使用 npm 构建..."
        npm install
        npm run build
    else
        echo -e "${RED}错误: 未找到 npm 或 pnpm${NC}"
        exit 1
    fi
    
    cd ..
    
    echo ""
    echo "前端构建完成！"
    echo ""
    
    # 生成部署脚本
    cat > /tmp/deploy_openlist_custom.sh << 'DEPLOY_SCRIPT'
#!/bin/bash
set -e

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "正在安装 Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl start docker
    systemctl enable docker
fi

if ! command -v docker-compose &> /dev/null; then
    echo "正在安装 Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# 创建目录结构
mkdir -p /opt/openlist/data
mkdir -p /opt/openlist/public/dist

cd /opt/openlist

# 创建 docker-compose.yml
cat > docker-compose.yml << 'EOF'
services:
  openlist:
    restart: always
    volumes:
      - './data:/opt/openlist/data'
      - './public:/opt/openlist/public'
    ports:
      - '5244:5244'
      - '5245:5245'
    user: '0:0'
    environment:
      - UMASK=022
      - TZ=Asia/Shanghai
    container_name: openlist
    image: 'openlistteam/openlist:latest'
EOF

echo "正在启动 OpenList..."
docker-compose up -d

echo ""
echo "========================================="
echo "部署完成！"
echo "========================================="
DEPLOY_SCRIPT

    echo "正在上传前端文件到服务器..."
    echo "请输入服务器密码（SSH）:"
    
    # 上传部署脚本
    scp /tmp/deploy_openlist_custom.sh root@$SERVER_IP:/tmp/
    
    # 执行部署脚本
    ssh root@$SERVER_IP "bash /tmp/deploy_openlist_custom.sh"
    
    # 上传前端文件
    echo ""
    echo "正在上传前端文件（可能需要一些时间）..."
    ssh root@$SERVER_IP "mkdir -p /opt/openlist/public/dist"
    rsync -avz --progress OpenList-Frontend-main/dist/ root@$SERVER_IP:/opt/openlist/public/dist/
    
    # 重启容器以加载新的前端
    echo ""
    echo "正在重启服务..."
    ssh root@$SERVER_IP "docker restart openlist"
    
    rm /tmp/deploy_openlist_custom.sh
    
    echo ""
    echo -e "${GREEN}自定义前端部署完成！${NC}"
    echo ""
    echo "访问地址: http://$SERVER_IP:5244"
    echo "默认账号: admin"
    echo "默认密码: admin"
    echo ""
    echo "⚠️  请立即登录并修改密码！"
    echo ""
else
    echo -e "${RED}无效的选项${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}部署完成！${NC}"
echo ""

