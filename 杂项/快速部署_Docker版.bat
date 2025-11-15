@echo off
chcp 65001 >nul
REM OpenList Docker 快速部署脚本 (Windows版本)
REM 服务器: 70.39.205.183

echo =========================================
echo OpenList Docker 快速部署脚本 (Windows)
echo =========================================
echo.

set SERVER_IP=70.39.205.183
set SERVER_USER=root

echo 这个脚本将在服务器 %SERVER_IP% 上部署 OpenList
echo.
echo 请选择部署方式：
echo 1. 仅部署 Docker 版本（使用官方镜像）
echo 2. 部署 Docker + 上传自定义前端
echo.

set /p DEPLOY_OPTION="请输入选项 (1/2): "

if "%DEPLOY_OPTION%"=="1" goto DEPLOY_DOCKER
if "%DEPLOY_OPTION%"=="2" goto DEPLOY_CUSTOM
echo 无效的选项！
pause
exit /b 1

:DEPLOY_DOCKER
echo.
echo 开始部署 Docker 版本...
echo.

REM 创建临时部署脚本
echo 正在创建部署脚本...
(
echo #!/bin/bash
echo set -e
echo.
echo # 检查 Docker
echo if ! command -v docker ^&^> /dev/null; then
echo     echo "正在安装 Docker..."
echo     curl -fsSL https://get.docker.com ^| sh
echo     systemctl start docker
echo     systemctl enable docker
echo fi
echo.
echo if ! command -v docker-compose ^&^> /dev/null; then
echo     echo "正在安装 Docker Compose..."
echo     curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s^)-$(uname -m^)" -o /usr/local/bin/docker-compose
echo     chmod +x /usr/local/bin/docker-compose
echo fi
echo.
echo mkdir -p /opt/openlist
echo cd /opt/openlist
echo.
echo cat ^> docker-compose.yml ^<^< 'EOF'
echo services:
echo   openlist:
echo     restart: always
echo     volumes:
echo       - './data:/opt/openlist/data'
echo     ports:
echo       - '5244:5244'
echo       - '5245:5245'
echo     user: '0:0'
echo     environment:
echo       - UMASK=022
echo       - TZ=Asia/Shanghai
echo     container_name: openlist
echo     image: 'openlistteam/openlist:latest'
echo EOF
echo.
echo echo "正在启动 OpenList..."
echo docker-compose up -d
echo.
echo echo "========================================="
echo echo "部署完成！"
echo echo "========================================="
echo echo ""
echo echo "访问地址: http://$(curl -s ifconfig.me^):5244"
echo echo "默认账号: admin"
echo echo "默认密码: admin"
) > "%TEMP%\deploy_openlist.sh"

echo.
echo 正在连接到服务器并部署...
echo 请输入服务器密码进行部署
echo.

REM 使用 scp 上传脚本
scp "%TEMP%\deploy_openlist.sh" %SERVER_USER%@%SERVER_IP%:/tmp/deploy_openlist.sh

REM 执行部署脚本
ssh %SERVER_USER%@%SERVER_IP% "bash /tmp/deploy_openlist.sh"

del "%TEMP%\deploy_openlist.sh"

echo.
echo 部署完成！
echo 访问地址: http://%SERVER_IP%:5244
echo 默认账号: admin
echo 默认密码: admin
echo.
echo ⚠️  请立即登录并修改密码！
echo.
pause
exit /b 0

:DEPLOY_CUSTOM
echo.
echo 开始构建前端并部署...
echo.

REM 检查是否在项目根目录
if not exist "OpenList-Frontend-main" (
    echo 错误: 找不到 OpenList-Frontend-main 目录
    echo 请在项目根目录运行此脚本
    pause
    exit /b 1
)

REM 构建前端
echo 正在构建前端...
cd OpenList-Frontend-main

REM 检查包管理器
where pnpm >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo 使用 pnpm 构建...
    call pnpm install
    call pnpm build
) else (
    where npm >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo 使用 npm 构建...
        call npm install
        call npm run build
    ) else (
        echo 错误: 未找到 npm 或 pnpm
        cd ..
        pause
        exit /b 1
    )
)

cd ..

echo.
echo 前端构建完成！
echo.

REM 创建部署脚本
(
echo #!/bin/bash
echo set -e
echo.
echo if ! command -v docker ^&^> /dev/null; then
echo     curl -fsSL https://get.docker.com ^| sh
echo     systemctl start docker
echo     systemctl enable docker
echo fi
echo.
echo if ! command -v docker-compose ^&^> /dev/null; then
echo     curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s^)-$(uname -m^)" -o /usr/local/bin/docker-compose
echo     chmod +x /usr/local/bin/docker-compose
echo fi
echo.
echo mkdir -p /opt/openlist/data
echo mkdir -p /opt/openlist/public/dist
echo cd /opt/openlist
echo.
echo cat ^> docker-compose.yml ^<^< 'EOF'
echo services:
echo   openlist:
echo     restart: always
echo     volumes:
echo       - './data:/opt/openlist/data'
echo       - './public:/opt/openlist/public'
echo     ports:
echo       - '5244:5244'
echo       - '5245:5245'
echo     user: '0:0'
echo     environment:
echo       - UMASK=022
echo       - TZ=Asia/Shanghai
echo     container_name: openlist
echo     image: 'openlistteam/openlist:latest'
echo EOF
echo.
echo docker-compose up -d
) > "%TEMP%\deploy_openlist_custom.sh"

echo 正在上传并部署...
echo.

REM 上传部署脚本
scp "%TEMP%\deploy_openlist_custom.sh" %SERVER_USER%@%SERVER_IP%:/tmp/

REM 执行部署脚本
ssh %SERVER_USER%@%SERVER_IP% "bash /tmp/deploy_openlist_custom.sh"

REM 创建远程目录
ssh %SERVER_USER%@%SERVER_IP% "mkdir -p /opt/openlist/public/dist"

REM 上传前端文件
echo.
echo 正在上传前端文件（可能需要一些时间）...
scp -r OpenList-Frontend-main\dist\* %SERVER_USER%@%SERVER_IP%:/opt/openlist/public/dist/

REM 重启服务
echo.
echo 正在重启服务...
ssh %SERVER_USER%@%SERVER_IP% "docker restart openlist"

del "%TEMP%\deploy_openlist_custom.sh"

echo.
echo 自定义前端部署完成！
echo.
echo 访问地址: http://%SERVER_IP%:5244
echo 默认账号: admin
echo 默认密码: admin
echo.
echo ⚠️  请立即登录并修改密码！
echo.
pause
exit /b 0

