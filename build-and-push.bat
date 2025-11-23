@echo off
REM OpenList Docker Hub 构建和推送脚本
REM 用途: 在本地构建镜像并推送到 Docker Hub

echo ========================================
echo   OpenList Docker Hub 构建和推送
echo ========================================
echo.

REM 检查 Docker 是否运行
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker 未运行，请先启动 Docker Desktop
    pause
    exit /b 1
)

echo [INFO] Docker 已运行
echo.

REM 登录 Docker Hub
echo [INFO] 登录 Docker Hub...
docker login
if errorlevel 1 (
    echo [ERROR] Docker Hub 登录失败
    pause
    exit /b 1
)
echo.

REM 构建后端镜像
echo ========================================
echo   构建后端镜像
echo ========================================
echo [INFO] 开始构建后端镜像...
echo [WARNING] 这可能需要 5-10 分钟，请耐心等待...
echo.

docker build -t aiom02/openlist-backend:latest ./OpenList-main
if errorlevel 1 (
    echo [ERROR] 后端镜像构建失败
    pause
    exit /b 1
)

echo [SUCCESS] 后端镜像构建成功
echo.

REM 构建前端镜像
echo ========================================
echo   构建前端镜像
echo ========================================
echo [INFO] 开始构建前端镜像...
echo [WARNING] 这可能需要 5-10 分钟，请耐心等待...
echo.

docker build -t aiom02/openlist-frontend:latest ./OpenList-Frontend-main
if errorlevel 1 (
    echo [ERROR] 前端镜像构建失败
    pause
    exit /b 1
)

echo [SUCCESS] 前端镜像构建成功
echo.

REM 推送镜像到 Docker Hub
echo ========================================
echo   推送镜像到 Docker Hub
echo ========================================
echo [INFO] 推送后端镜像...
docker push aiom02/openlist-backend:latest
if errorlevel 1 (
    echo [ERROR] 后端镜像推送失败
    pause
    exit /b 1
)

echo [SUCCESS] 后端镜像推送成功
echo.

echo [INFO] 推送前端镜像...
docker push aiom02/openlist-frontend:latest
if errorlevel 1 (
    echo [ERROR] 前端镜像推送失败
    pause
    exit /b 1
)

echo [SUCCESS] 前端镜像推送成功
echo.

REM 显示镜像信息
echo ========================================
echo   镜像信息
echo ========================================
docker images | findstr aiom02/openlist
echo.

echo ========================================
echo   完成！
echo ========================================
echo.
echo 镜像已成功推送到 Docker Hub:
echo   - aiom02/openlist-backend:latest
echo   - aiom02/openlist-frontend:latest
echo.
echo 现在可以在服务器上执行:
echo   cd ~/openlist-docker
echo   docker-compose -f docker-compose.hub.yml pull
echo   docker-compose -f docker-compose.hub.yml up -d
echo.
pause
