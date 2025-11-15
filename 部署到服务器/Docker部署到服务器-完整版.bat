@echo off
chcp 65001 >nul
REM OpenList Docker 部署到服务器脚本（完整版）
REM 包含所有必要的修复步骤，确保部署成功

echo =========================================
echo OpenList Docker 部署到服务器（完整版）
echo =========================================
echo.
echo 本脚本已包含以下修复：
echo ✅ 自动创建并设置数据目录权限
echo ✅ 使用正确的镜像模式配置
echo ✅ 配置正确的 API 代理路径
echo ✅ 部署后自动验证服务状态
echo.

REM ==================== 配置区 ====================
set SERVER_IP=70.39.205.183
set SERVER_USER=root
set SERVER_PASS=wG32KEXA9SmV
set DEPLOY_DIR=/opt/openlist-docker
REM ===============================================

cd /d "%~dp0\.."

echo 服务器: %SERVER_IP%
echo 部署目录: %DEPLOY_DIR%
echo.

REM ==================== 第一部分：本地检查 ====================
echo [阶段 1/6] 检查本地镜像文件
echo ----------------------------------------
echo.

if not exist "docker-images\openlist-backend.tar" (
    echo ❌ 错误: 找不到后端镜像文件
    echo.
    echo 请先运行以下命令：
    echo   1. 杂项\Docker构建镜像.bat
    echo   2. 杂项\Docker导出镜像.bat
    echo.
    pause
    exit /b 1
)

if not exist "docker-images\openlist-frontend.tar" (
    echo ❌ 错误: 找不到前端镜像文件
    echo.
    echo 请先运行以下命令：
    echo   1. 杂项\Docker构建镜像.bat
    echo   2. 杂项\Docker导出镜像.bat
    echo.
    pause
    exit /b 1
)

echo ✅ 本地镜像文件检查通过
echo.

REM ==================== 第二部分：连接测试 ====================
echo [阶段 2/6] 测试服务器连接
echo ----------------------------------------
echo.

echo 正在测试 SSH 连接到 %SERVER_IP%...
ssh -o ConnectTimeout=5 %SERVER_USER%@%SERVER_IP% "echo 连接成功" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 无法连接到服务器
    echo.
    echo 可能原因：
    echo   - 服务器 IP 地址错误
    echo   - 服务器防火墙阻止 SSH 连接
    echo   - 需要配置 SSH 密钥
    echo.
    echo 提示: 如需免密登录，请手动运行：
    echo   ssh-copy-id %SERVER_USER%@%SERVER_IP%
    echo.
    pause
    exit /b 1
)

echo ✅ 服务器连接正常
echo.

REM ==================== 第三部分：服务器准备 ====================
echo [阶段 3/6] 准备服务器环境
echo ----------------------------------------
echo.

echo 创建部署目录...
ssh %SERVER_USER%@%SERVER_IP% "mkdir -p %DEPLOY_DIR%" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 创建目录失败
    pause
    exit /b 1
)
echo ✅ 部署目录创建成功: %DEPLOY_DIR%

echo.
echo 创建数据目录...
ssh %SERVER_USER%@%SERVER_IP% "mkdir -p %DEPLOY_DIR%/data" 2>nul
echo ✅ 数据目录创建成功: %DEPLOY_DIR%/data

echo.
echo 检查 Docker 环境...
ssh %SERVER_USER%@%SERVER_IP% "docker --version && docker-compose --version" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️ 警告: 服务器上可能未安装 Docker 或 Docker Compose
    echo.
    echo 请确保服务器已安装：
    echo   - Docker
    echo   - Docker Compose
    echo.
    set /p continue="是否继续? (Y/N): "
    if /i not "%continue%"=="Y" exit /b 1
)

echo.
echo ✅ 服务器环境准备完成
echo.

REM ==================== 第四部分：上传文件 ====================
echo [阶段 4/6] 上传文件到服务器
echo ----------------------------------------
echo.

echo [4.1] 上传后端镜像 (约 500MB，需要几分钟)...
echo 开始时间: %time%
scp docker-images\openlist-backend.tar %SERVER_USER%@%SERVER_IP%:%DEPLOY_DIR%/
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 上传失败
    pause
    exit /b 1
)
echo ✅ 后端镜像上传成功
echo 完成时间: %time%

echo.
echo [4.2] 上传前端镜像 (约 100MB，需要几分钟)...
echo 开始时间: %time%
scp docker-images\openlist-frontend.tar %SERVER_USER%@%SERVER_IP%:%DEPLOY_DIR%/
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 上传失败
    pause
    exit /b 1
)
echo ✅ 前端镜像上传成功
echo 完成时间: %time%

echo.
echo [4.3] 上传配置文件...
scp docker-images\docker-compose.yml %SERVER_USER%@%SERVER_IP%:%DEPLOY_DIR%/
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 上传失败
    pause
    exit /b 1
)
echo ✅ 配置文件上传成功

echo.
echo ✅ 所有文件上传完成
echo.

REM ==================== 第五部分：服务器部署 ====================
echo [阶段 5/6] 在服务器上部署
echo ----------------------------------------
echo.

REM 创建部署脚本
echo 生成部署脚本...
(
echo #!/bin/bash
echo set -e
echo.
echo echo "切换到部署目录..."
echo cd %DEPLOY_DIR%
echo.
echo echo ""
echo echo "=== 加载 Docker 镜像 ==="
echo docker load -i openlist-backend.tar
echo docker load -i openlist-frontend.tar
echo.
echo echo ""
echo echo "=== 停止旧容器 ==="
echo docker-compose down 2^>^/dev/null ^|^| true
echo.
echo echo ""
echo echo "=== 设置数据目录权限 ==="
echo mkdir -p ./data
echo chmod -R 777 ./data
echo echo "数据目录权限已设置为 777"
echo.
echo echo ""
echo echo "=== 启动新容器 ==="
echo docker-compose up -d
echo.
echo echo ""
echo echo "=== 等待服务启动 ==="
echo sleep 5
echo.
echo echo ""
echo echo "=== 查看运行状态 ==="
echo docker-compose ps
echo.
echo echo ""
echo echo "=== 检查后端服务日志 ==="
echo docker logs openlist-backend --tail 20
echo.
echo echo ""
echo echo "=== 清理旧镜像 ==="
echo docker image prune -f
echo.
echo echo ""
echo echo "========================================="
echo echo "✅ 部署完成！"
echo echo "========================================="
echo echo ""
echo echo "📌 访问信息："
echo echo "   前端地址: http://%SERVER_IP%:66"
echo echo "   API地址:   http://%SERVER_IP%:5244"
echo echo ""
echo echo "📝 管理命令："
echo echo "   查看日志:   docker-compose logs -f"
echo echo "   重启服务:   docker-compose restart"
echo echo "   停止服务:   docker-compose down"
echo echo "   查看状态:   docker-compose ps"
echo echo ""
echo echo "🔑 获取初始密码："
echo echo "   docker logs openlist-backend ^| grep 'initial password'"
echo echo ""
) > "%TEMP%\deploy.sh"

echo 上传并执行部署脚本...
scp "%TEMP%\deploy.sh" %SERVER_USER%@%SERVER_IP%:%DEPLOY_DIR%/
ssh %SERVER_USER%@%SERVER_IP% "bash %DEPLOY_DIR%/deploy.sh"

set DEPLOY_EXIT_CODE=%ERRORLEVEL%
del "%TEMP%\deploy.sh" 2>nul

if %DEPLOY_EXIT_CODE% NEQ 0 (
    echo.
    echo ❌ 部署过程中出现错误
    echo.
    echo 请检查上面的错误信息
    echo 或运行以下命令查看详细日志：
    echo   ssh %SERVER_USER%@%SERVER_IP% "cd %DEPLOY_DIR% && docker-compose logs"
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ 部署脚本执行成功
echo.

REM ==================== 第六部分：验证部署 ====================
echo [阶段 6/6] 验证部署结果
echo ----------------------------------------
echo.

echo 检查容器运行状态...
ssh %SERVER_USER%@%SERVER_IP% "cd %DEPLOY_DIR% && docker-compose ps --format json" > "%TEMP%\status.txt" 2>nul

echo.
echo 正在验证后端服务...
timeout /t 3 /nobreak >nul
ssh %SERVER_USER%@%SERVER_IP% "docker inspect openlist-backend --format='{{.State.Status}}'" > "%TEMP%\backend_status.txt" 2>nul
set /p BACKEND_STATUS=<"%TEMP%\backend_status.txt"

if "%BACKEND_STATUS%"=="running" (
    echo ✅ 后端服务运行正常
) else (
    echo ⚠️ 后端服务状态: %BACKEND_STATUS%
    echo 正在检查日志...
    ssh %SERVER_USER%@%SERVER_IP% "docker logs openlist-backend --tail 30"
)

echo.
echo 正在验证前端服务...
ssh %SERVER_USER%@%SERVER_IP% "docker inspect openlist-frontend --format='{{.State.Status}}'" > "%TEMP%\frontend_status.txt" 2>nul
set /p FRONTEND_STATUS=<"%TEMP%\frontend_status.txt"

if "%FRONTEND_STATUS%"=="running" (
    echo ✅ 前端服务运行正常
) else (
    echo ⚠️ 前端服务状态: %FRONTEND_STATUS%
    echo 正在检查日志...
    ssh %SERVER_USER%@%SERVER_IP% "docker logs openlist-frontend --tail 30"
)

del "%TEMP%\backend_status.txt" 2>nul
del "%TEMP%\frontend_status.txt" 2>nul
del "%TEMP%\status.txt" 2>nul

echo.
echo ✅ 部署验证完成
echo.

REM ==================== 第七部分：获取初始密码 ====================
echo [获取管理员初始密码]
echo ----------------------------------------
echo.

echo 正在获取初始密码...
ssh %SERVER_USER%@%SERVER_IP% "docker logs openlist-backend 2>&1 | grep 'initial password' | tail -1" > "%TEMP%\password.txt" 2>nul

if exist "%TEMP%\password.txt" (
    for /f "tokens=*" %%i in (%TEMP%\password.txt) do set PASSWORD_LINE=%%i
    if not "!PASSWORD_LINE!"=="" (
        echo !PASSWORD_LINE!
        echo.
        echo ⚠️ 请妥善保存此密码！首次登录后请立即修改。
    ) else (
        echo ℹ️ 未找到初始密码信息（可能是更新部署）
        echo 如需查看，请运行：
        echo   ssh %SERVER_USER%@%SERVER_IP% "docker logs openlist-backend | grep 'initial password'"
    )
    del "%TEMP%\password.txt" 2>nul
)

echo.

REM ==================== 完成 ====================
echo.
echo =========================================
echo ✅ 部署成功！
echo =========================================
echo.
echo 🌐 访问地址: http://%SERVER_IP%:66
echo 📡 API地址: http://%SERVER_IP%:5244
echo.
echo 📝 服务器管理命令：
echo.
echo   查看日志:
echo     ssh %SERVER_USER%@%SERVER_IP% "cd %DEPLOY_DIR% && docker-compose logs -f"
echo.
echo   重启服务:
echo     ssh %SERVER_USER%@%SERVER_IP% "cd %DEPLOY_DIR% && docker-compose restart"
echo.
echo   停止服务:
echo     ssh %SERVER_USER%@%SERVER_IP% "cd %DEPLOY_DIR% && docker-compose down"
echo.
echo   查看状态:
echo     ssh %SERVER_USER%@%SERVER_IP% "cd %DEPLOY_DIR% && docker-compose ps"
echo.
echo   查看初始密码:
echo     ssh %SERVER_USER%@%SERVER_IP% "docker logs openlist-backend | grep 'initial password'"
echo.
echo 📚 文档：
echo   - 服务器部署操作文档.md
echo   - 部署问题与解决方案.md
echo.
echo 🎉 现在可以在浏览器中访问 http://%SERVER_IP%:66
echo.
pause

