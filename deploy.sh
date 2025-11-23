#!/bin/bash

# OpenList 一键部署脚本
# 用途: 在 Linux 服务器上一键部署前后端服务

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 打印横幅
print_banner() {
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════════════╗"
    echo "║                                                       ║"
    echo "║           OpenList 一键部署脚本                      ║"
    echo "║                                                       ║"
    echo "║   前后端 Docker 容器自动化部署                       ║"
    echo "║                                                       ║"
    echo "╚═══════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 未安装"
        return 1
    else
        print_success "$1 已安装"
        return 0
    fi
}

# 检查 Docker
check_docker() {
    print_info "检查 Docker 环境..."
    
    if ! check_command docker; then
        print_error "Docker 未安装！"
        print_info "请运行以下命令安装 Docker:"
        echo "  curl -fsSL https://get.docker.com | sh"
        echo "  sudo usermod -aG docker \$USER"
        exit 1
    fi
    
    if ! check_command docker-compose; then
        print_error "Docker Compose 未安装！"
        print_info "请运行以下命令安装 Docker Compose:"
        echo "  sudo curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose"
        echo "  sudo chmod +x /usr/local/bin/docker-compose"
        exit 1
    fi
    
    print_success "Docker 环境检查通过"
}

# 创建必要的目录
create_directories() {
    print_info "创建必要的目录..."
    
    mkdir -p data
    mkdir -p logs
    
    print_success "目录创建完成"
}

# 检查端口占用
check_ports() {
    print_info "检查端口占用..."
    
    PORTS=(66 5244 5245)
    OCCUPIED_PORTS=()
    
    for port in "${PORTS[@]}"; do
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            OCCUPIED_PORTS+=($port)
            print_warning "端口 $port 已被占用"
        fi
    done
    
    if [ ${#OCCUPIED_PORTS[@]} -gt 0 ]; then
        print_warning "以下端口被占用: ${OCCUPIED_PORTS[*]}"
        read -p "是否继续部署？(y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "部署已取消"
            exit 0
        fi
    else
        print_success "端口检查通过"
    fi
}

# 停止旧容器
stop_old_containers() {
    print_info "停止旧容器..."
    
    if docker-compose ps -q 2>/dev/null | grep -q .; then
        docker-compose down
        print_success "旧容器已停止"
    else
        print_info "没有运行中的容器"
    fi
}

# 构建镜像
build_images() {
    print_info "开始构建 Docker 镜像..."
    print_warning "这可能需要几分钟时间，请耐心等待..."
    
    if docker-compose build --no-cache; then
        print_success "镜像构建成功"
    else
        print_error "镜像构建失败"
        exit 1
    fi
}

# 启动服务
start_services() {
    print_info "启动服务..."
    
    if docker-compose up -d; then
        print_success "服务启动成功"
    else
        print_error "服务启动失败"
        exit 1
    fi
}

# 等待服务就绪
wait_for_services() {
    print_info "等待服务就绪..."
    
    # 等待后端服务
    print_info "等待后端服务启动..."
    for i in {1..30}; do
        if curl -s http://localhost:5244 > /dev/null 2>&1; then
            print_success "后端服务已就绪"
            break
        fi
        if [ $i -eq 30 ]; then
            print_warning "后端服务启动超时，请检查日志"
        fi
        sleep 2
    done
    
    # 等待前端服务
    print_info "等待前端服务启动..."
    for i in {1..30}; do
        if curl -s http://localhost:66 > /dev/null 2>&1; then
            print_success "前端服务已就绪"
            break
        fi
        if [ $i -eq 30 ]; then
            print_warning "前端服务启动超时，请检查日志"
        fi
        sleep 2
    done
}

# 显示服务状态
show_status() {
    print_info "服务状态:"
    echo ""
    docker-compose ps
    echo ""
}

# 显示访问信息
show_access_info() {
    # 获取服务器 IP
    SERVER_IP=$(hostname -I | awk '{print $1}')
    if [ -z "$SERVER_IP" ]; then
        SERVER_IP="localhost"
    fi
    
    echo ""
    print_success "部署完成！"
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                       ║${NC}"
    echo -e "${GREEN}║                   访问地址                            ║${NC}"
    echo -e "${GREEN}║                                                       ║${NC}"
    echo -e "${GREEN}╠═══════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║                                                       ║${NC}"
    echo -e "${GREEN}║  前端:   http://${SERVER_IP}:66                    ║${NC}"
    echo -e "${GREEN}║  后端:   http://${SERVER_IP}:5244                  ║${NC}"
    echo -e "${GREEN}║  管理:   http://${SERVER_IP}:5245                  ║${NC}"
    echo -e "${GREEN}║                                                       ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    print_info "常用命令:"
    echo "  查看日志:    docker-compose logs -f"
    echo "  停止服务:    docker-compose down"
    echo "  重启服务:    docker-compose restart"
    echo "  查看状态:    docker-compose ps"
    echo ""
}

# 主函数
main() {
    print_banner
    
    # 检查是否在正确的目录
    if [ ! -f "docker-compose.yml" ]; then
        print_error "未找到 docker-compose.yml 文件"
        print_error "请在项目根目录运行此脚本"
        exit 1
    fi
    
    # 执行部署步骤
    check_docker
    create_directories
    check_ports
    stop_old_containers
    build_images
    start_services
    wait_for_services
    show_status
    show_access_info
    
    print_success "🎉 部署成功！"
}

# 运行主函数
main
