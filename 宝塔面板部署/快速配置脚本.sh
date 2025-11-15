#!/bin/bash
################################################################################
# OpenList 宝塔环境快速配置脚本
# 适用于：已安装宝塔面板的服务器
# 用途：自动创建目录、配置文件等
################################################################################

set -e

echo "=========================================="
echo "  OpenList 宝塔环境配置脚本"
echo "=========================================="
echo ""

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 配置变量
INSTALL_DIR="/opt/openlist"
BACKEND_PORT=5244

# 检查是否为 root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}请使用 root 权限运行此脚本${NC}"
    exit 1
fi

# 检查宝塔是否安装
if ! command -v bt &> /dev/null; then
    echo -e "${RED}未检测到宝塔面板！${NC}"
    echo "请先安装宝塔面板："
    echo "  wget -O install.sh https://download.bt.cn/install/install-ubuntu_6.0.sh"
    echo "  bash install.sh ed8484bec"
    exit 1
fi

echo -e "${GREEN}检测到宝塔面板${NC}"
echo ""

# 步骤1：创建目录结构
echo -e "${YELLOW}[1/5] 创建目录结构...${NC}"
mkdir -p $INSTALL_DIR
mkdir -p $INSTALL_DIR/data/temp
mkdir -p $INSTALL_DIR/data/log
mkdir -p $INSTALL_DIR/public/dist
echo -e "${GREEN}[✓] 目录创建完成${NC}"
echo ""

# 步骤2：创建配置文件
echo -e "${YELLOW}[2/5] 创建配置文件...${NC}"
cat > $INSTALL_DIR/data/config.json << EOF
{
  "force": false,
  "address": "0.0.0.0",
  "port": $BACKEND_PORT,
  "assets": "$INSTALL_DIR/public/dist",
  "database": {
    "type": "sqlite3",
    "host": "",
    "port": 0,
    "user": "",
    "password": "",
    "name": "",
    "db_file": "$INSTALL_DIR/data/data.db",
    "table_prefix": "x_",
    "ssl_mode": "",
    "dsn": ""
  },
  "scheme": {
    "https": false,
    "cert_file": "",
    "key_file": ""
  },
  "temp_dir": "$INSTALL_DIR/data/temp",
  "log": {
    "enable": true,
    "name": "$INSTALL_DIR/data/log/log.log",
    "max_size": 50,
    "max_backups": 30,
    "max_age": 28,
    "compress": false
  }
}
EOF
echo -e "${GREEN}[✓] 配置文件创建完成${NC}"
echo ""

# 步骤3：创建 systemd 服务
echo -e "${YELLOW}[3/5] 创建 systemd 服务...${NC}"
cat > /etc/systemd/system/openlist.service << EOF
[Unit]
Description=OpenList Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
ExecStart=$INSTALL_DIR/openlist server
Restart=on-failure
RestartSec=5s
LimitNOFILE=65536

StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
echo -e "${GREEN}[✓] 服务文件创建完成${NC}"
echo ""

# 步骤4：创建备份脚本
echo -e "${YELLOW}[4/5] 创建备份脚本...${NC}"
mkdir -p /www/backup/openlist

cat > $INSTALL_DIR/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/www/backup/openlist"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份数据库和配置
tar -czf $BACKUP_DIR/openlist-data-$DATE.tar.gz \
    /opt/openlist/data/data.db \
    /opt/openlist/data/config.json

# 只保留最近 7 天的备份
find $BACKUP_DIR -name "openlist-data-*.tar.gz" -mtime +7 -delete

echo "备份完成: $BACKUP_DIR/openlist-data-$DATE.tar.gz"
EOF

chmod +x $INSTALL_DIR/backup.sh
echo -e "${GREEN}[✓] 备份脚本创建完成${NC}"
echo ""

# 步骤5：创建 Nginx 配置模板
echo -e "${YELLOW}[5/5] 创建 Nginx 配置模板...${NC}"
cat > $INSTALL_DIR/nginx-config-template.conf << 'EOF'
server {
    listen 80;
    server_name _;  # 修改为你的域名
    
    # 日志
    access_log /www/wwwlogs/openlist_access.log;
    error_log /www/wwwlogs/openlist_error.log;
    
    # 前端静态文件
    location / {
        root /opt/openlist/public/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # 静态文件缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # 后端 API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:5244;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket 支持
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 3600s;
        proxy_read_timeout 3600s;
    }
    
    # WebDAV 支持
    location /dav/ {
        proxy_pass http://127.0.0.1:5244;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_request_buffering off;
        client_max_body_size 0;
    }
    
    # 文件上传大小限制
    client_max_body_size 10G;
    
    # 禁止访问隐藏文件
    location ~ /\. {
        deny all;
    }
}
EOF
echo -e "${GREEN}[✓] Nginx 配置模板创建完成${NC}"
echo ""

# 获取服务器信息
SERVER_IP=$(curl -s ifconfig.me || echo "未知IP")

# 完成提示
echo ""
echo "=========================================="
echo -e "  ${GREEN}环境配置完成！${NC}"
echo "=========================================="
echo ""
echo "接下来的步骤："
echo ""
echo -e "${YELLOW}1. 上传文件${NC}"
echo "   - 上传 openlist 可执行文件到: $INSTALL_DIR/"
echo "   - 上传前端 dist/* 到: $INSTALL_DIR/public/dist/"
echo ""
echo -e "${YELLOW}2. 设置权限${NC}"
echo "   chmod +x $INSTALL_DIR/openlist"
echo ""
echo -e "${YELLOW}3. 启动服务${NC}"
echo "   systemctl start openlist"
echo "   systemctl enable openlist"
echo ""
echo -e "${YELLOW}4. 在宝塔面板配置网站${NC}"
echo "   - 网站 → 添加站点"
echo "   - 根目录: $INSTALL_DIR/public/dist"
echo "   - 配置反向代理（参考模板）"
echo "   - Nginx 配置模板位置: $INSTALL_DIR/nginx-config-template.conf"
echo ""
echo -e "${YELLOW}5. 配置防火墙${NC}"
echo "   - 在宝塔安全面板开放 80 和 443 端口"
echo "   - 在云服务商安全组开放相同端口"
echo ""
echo "有用的命令："
echo "  查看服务状态: systemctl status openlist"
echo "  查看日志:     journalctl -u openlist -f"
echo "  手动备份:     $INSTALL_DIR/backup.sh"
echo "  查看宝塔信息: bt info"
echo ""
echo "服务器信息："
echo "  IP 地址: $SERVER_IP"
echo "  后端端口: $BACKEND_PORT"
echo ""

