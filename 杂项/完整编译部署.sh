#!/bin/bash
# OpenList 完整编译部署脚本（包含自定义后端）
# 适用于修改了前端和后端的情况

set -e

SERVER_IP="70.39.205.183"
SERVER_USER="root"
PROJECT_DIR="/opt/openlist-custom"

echo "========================================="
echo "OpenList 完整编译部署脚本"
echo "========================================="
echo ""
echo "这个脚本将："
echo "1. 在服务器上编译后端（Go）"
echo "2. 在本地编译前端（Node.js）"
echo "3. 部署并启动服务"
echo ""
echo "目标服务器: $SERVER_IP"
echo ""

# 检查前端和后端目录
if [ ! -d "OpenList-Frontend-main" ] || [ ! -d "OpenList-main" ]; then
    echo "错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 步骤1: 编译前端
echo "========================================="
echo "步骤 1/4: 编译前端"
echo "========================================="
echo ""

cd OpenList-Frontend-main

if command -v pnpm &> /dev/null; then
    echo "使用 pnpm 构建前端..."
    pnpm install
    pnpm build
elif command -v npm &> /dev/null; then
    echo "使用 npm 构建前端..."
    npm install
    npm run build
else
    echo "错误: 未找到 npm 或 pnpm"
    exit 1
fi

cd ..

echo ""
echo "✅ 前端编译完成"
echo ""

# 步骤2: 打包项目
echo "========================================="
echo "步骤 2/4: 打包项目文件"
echo "========================================="
echo ""

# 复制前端到后端的 public 目录
echo "合并前后端..."
rm -rf OpenList-main/public/dist/*
cp -r OpenList-Frontend-main/dist/* OpenList-main/public/dist/

# 打包后端项目
echo "打包后端代码..."
cd OpenList-main
tar -czf ../openlist-backend.tar.gz \
    --exclude='.git' \
    --exclude='data/data.db*' \
    --exclude='data/log/*' \
    --exclude='*.exe' \
    --exclude='bin/*' \
    .
cd ..

echo ""
echo "✅ 项目打包完成"
echo ""

# 步骤3: 上传到服务器
echo "========================================="
echo "步骤 3/4: 上传到服务器"
echo "========================================="
echo ""

echo "上传代码到服务器..."
scp openlist-backend.tar.gz $SERVER_USER@$SERVER_IP:/tmp/

# 步骤4: 在服务器上编译和部署
echo ""
echo "========================================="
echo "步骤 4/4: 服务器编译和部署"
echo "========================================="
echo ""

ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
set -e

PROJECT_DIR="/opt/openlist-custom"

echo "正在准备环境..."

# 安装 Go（如果没有）
if ! command -v go &> /dev/null; then
    echo "正在安装 Go..."
    cd /tmp
    wget -q https://go.dev/dl/go1.21.0.linux-amd64.tar.gz
    tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz
    echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
    export PATH=$PATH:/usr/local/go/bin
    rm go1.21.0.linux-amd64.tar.gz
fi

# 创建项目目录
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# 解压代码
echo "解压代码..."
tar -xzf /tmp/openlist-backend.tar.gz
rm /tmp/openlist-backend.tar.gz

# 编译后端
echo "正在编译后端（可能需要几分钟）..."
bash build.sh release

# 创建 systemd 服务
echo "创建系统服务..."
cat > /etc/systemd/system/openlist-custom.service << 'EOF'
[Unit]
Description=OpenList Custom Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/openlist-custom
ExecStart=/opt/openlist-custom/bin/openlist server
Restart=on-failure
RestartSec=10s

[Install]
WantedBy=multi-user.target
EOF

# 停止旧服务（如果存在）
systemctl stop openlist-custom 2>/dev/null || true

# 启动服务
echo "启动服务..."
systemctl daemon-reload
systemctl enable openlist-custom
systemctl start openlist-custom

# 等待服务启动
sleep 3

# 检查服务状态
if systemctl is-active --quiet openlist-custom; then
    echo ""
    echo "========================================="
    echo "✅ 部署成功！"
    echo "========================================="
    echo ""
    echo "服务状态:"
    systemctl status openlist-custom --no-pager -l
else
    echo ""
    echo "❌ 服务启动失败！"
    echo ""
    echo "查看日志:"
    journalctl -u openlist-custom -n 50 --no-pager
    exit 1
fi

ENDSSH

# 清理本地打包文件
rm openlist-backend.tar.gz

echo ""
echo "========================================="
echo "🎉 部署完成！"
echo "========================================="
echo ""
echo "访问地址: http://$SERVER_IP:5244"
echo "默认账号: admin"
echo "默认密码: admin"
echo ""
echo "⚠️  请立即登录并修改密码！"
echo ""
echo "常用命令:"
echo "  查看日志: ssh $SERVER_USER@$SERVER_IP 'journalctl -u openlist-custom -f'"
echo "  重启服务: ssh $SERVER_USER@$SERVER_IP 'systemctl restart openlist-custom'"
echo "  停止服务: ssh $SERVER_USER@$SERVER_IP 'systemctl stop openlist-custom'"
echo "  查看状态: ssh $SERVER_USER@$SERVER_IP 'systemctl status openlist-custom'"
echo ""

