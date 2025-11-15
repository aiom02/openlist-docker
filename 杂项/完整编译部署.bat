@echo off
chcp 65001 >nul
REM OpenList 完整编译部署脚本（包含自定义后端）
REM 适用于修改了前端和后端的情况

echo =========================================
echo OpenList 完整编译部署脚本
echo =========================================
echo.
echo 这个脚本将：
echo 1. 在本地编译前端（Node.js）
echo 2. 打包项目文件
echo 3. 上传到服务器
echo 4. 在服务器上编译后端（Go）并部署
echo.

set SERVER_IP=70.39.205.183
set SERVER_USER=root

echo 目标服务器: %SERVER_IP%
echo.

REM 检查目录
if not exist "OpenList-Frontend-main" (
    echo 错误: 找不到 OpenList-Frontend-main 目录
    echo 请在项目根目录运行此脚本
    pause
    exit /b 1
)

if not exist "OpenList-main" (
    echo 错误: 找不到 OpenList-main 目录
    echo 请在项目根目录运行此脚本
    pause
    exit /b 1
)

REM 步骤1: 编译前端
echo =========================================
echo 步骤 1/4: 编译前端
echo =========================================
echo.

cd OpenList-Frontend-main

where pnpm >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo 使用 pnpm 构建前端...
    call pnpm install
    call pnpm build
) else (
    where npm >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo 使用 npm 构建前端...
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
echo ✅ 前端编译完成
echo.

REM 步骤2: 合并前后端
echo =========================================
echo 步骤 2/4: 合并前后端文件
echo =========================================
echo.

echo 复制前端到后端的 public 目录...
if exist "OpenList-main\public\dist" (
    rmdir /s /q "OpenList-main\public\dist"
)
mkdir "OpenList-main\public\dist"
xcopy /e /i /y "OpenList-Frontend-main\dist\*" "OpenList-main\public\dist\"

echo.
echo ✅ 文件合并完成
echo.

REM 步骤3: 打包后端
echo =========================================
echo 步骤 3/4: 打包后端项目
echo =========================================
echo.

echo 正在打包...
REM 使用 tar (Windows 10+ 自带)
cd OpenList-main
tar -czf ..\openlist-backend.tar.gz ^
    --exclude=".git" ^
    --exclude="data\data.db*" ^
    --exclude="data\log" ^
    --exclude="*.exe" ^
    --exclude="bin" ^
    .
cd ..

if not exist "openlist-backend.tar.gz" (
    echo 错误: 打包失败
    pause
    exit /b 1
)

echo.
echo ✅ 项目打包完成
echo.

REM 步骤4: 上传并部署
echo =========================================
echo 步骤 4/4: 上传到服务器并部署
echo =========================================
echo.

echo 上传代码到服务器（可能需要一些时间）...
echo 请输入服务器密码:
scp openlist-backend.tar.gz %SERVER_USER%@%SERVER_IP%:/tmp/

echo.
echo 在服务器上编译和部署...
echo 请再次输入服务器密码:

REM 创建临时部署脚本
(
echo #!/bin/bash
echo set -e
echo.
echo PROJECT_DIR="/opt/openlist-custom"
echo.
echo echo "正在准备环境..."
echo.
echo # 安装 Go
echo if ! command -v go ^&^> /dev/null; then
echo     echo "正在安装 Go..."
echo     cd /tmp
echo     wget -q https://go.dev/dl/go1.21.0.linux-amd64.tar.gz
echo     tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz
echo     echo 'export PATH=$PATH:/usr/local/go/bin' ^>^> ~/.bashrc
echo     export PATH=$PATH:/usr/local/go/bin
echo     rm go1.21.0.linux-amd64.tar.gz
echo fi
echo.
echo mkdir -p $PROJECT_DIR
echo cd $PROJECT_DIR
echo.
echo echo "解压代码..."
echo tar -xzf /tmp/openlist-backend.tar.gz
echo rm /tmp/openlist-backend.tar.gz
echo.
echo echo "正在编译后端（可能需要几分钟）..."
echo bash build.sh release
echo.
echo echo "创建系统服务..."
echo cat ^> /etc/systemd/system/openlist-custom.service ^<^< 'EOF'
echo [Unit]
echo Description=OpenList Custom Service
echo After=network.target
echo.
echo [Service]
echo Type=simple
echo User=root
echo WorkingDirectory=/opt/openlist-custom
echo ExecStart=/opt/openlist-custom/bin/openlist server
echo Restart=on-failure
echo RestartSec=10s
echo.
echo [Install]
echo WantedBy=multi-user.target
echo EOF
echo.
echo systemctl stop openlist-custom 2^>^/dev/null ^|^| true
echo.
echo echo "启动服务..."
echo systemctl daemon-reload
echo systemctl enable openlist-custom
echo systemctl start openlist-custom
echo.
echo sleep 3
echo.
echo if systemctl is-active --quiet openlist-custom; then
echo     echo ""
echo     echo "========================================="
echo     echo "✅ 部署成功！"
echo     echo "========================================="
echo     echo ""
echo     systemctl status openlist-custom --no-pager -l
echo else
echo     echo ""
echo     echo "❌ 服务启动失败！"
echo     echo ""
echo     journalctl -u openlist-custom -n 50 --no-pager
echo     exit 1
echo fi
) > "%TEMP%\deploy_server.sh"

scp "%TEMP%\deploy_server.sh" %SERVER_USER%@%SERVER_IP%:/tmp/
ssh %SERVER_USER%@%SERVER_IP% "bash /tmp/deploy_server.sh"

del "%TEMP%\deploy_server.sh"

REM 清理本地文件
del openlist-backend.tar.gz

echo.
echo =========================================
echo 🎉 部署完成！
echo =========================================
echo.
echo 访问地址: http://%SERVER_IP%:5244
echo 默认账号: admin
echo 默认密码: admin
echo.
echo ⚠️  请立即登录并修改密码！
echo.
echo 常用命令:
echo   查看日志: ssh %SERVER_USER%@%SERVER_IP% "journalctl -u openlist-custom -f"
echo   重启服务: ssh %SERVER_USER%@%SERVER_IP% "systemctl restart openlist-custom"
echo   停止服务: ssh %SERVER_USER%@%SERVER_IP% "systemctl stop openlist-custom"
echo   查看状态: ssh %SERVER_USER%@%SERVER_IP% "systemctl status openlist-custom"
echo.
pause

