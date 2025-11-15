@echo off
chcp 65001 >nul
REM OpenList Docker 镜像导出脚本

echo =========================================
echo OpenList Docker 镜像导出
echo =========================================
echo.
echo 将 Docker 镜像导出为 tar 文件，方便上传到服务器
echo.

cd /d "%~dp0\.."

REM 创建输出目录
if not exist "docker-images" mkdir docker-images

echo [1/3] 导出后端镜像...
docker save openlist-backend:latest -o docker-images/openlist-backend.tar
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 后端镜像导出失败
    echo 请先运行: 杂项\Docker构建镜像.bat
    pause
    exit /b 1
)
echo ✅ 后端镜像已导出: docker-images/openlist-backend.tar
echo.

echo [2/3] 导出前端镜像...
docker save openlist-frontend:latest -o docker-images/openlist-frontend.tar
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 前端镜像导出失败
    pause
    exit /b 1
)
echo ✅ 前端镜像已导出: docker-images/openlist-frontend.tar
echo.

echo [3/3] 创建部署配置文件...
(
echo version: '3.8'
echo.
echo services:
echo   # 后端服务
echo   openlist-backend:
echo     image: openlist-backend:latest
echo     container_name: openlist-backend
echo     restart: always
echo     ports:
echo       - "5244:5244"
echo       - "5245:5245"
echo     volumes:
echo       - ./data:/opt/openlist/data
echo     environment:
echo       - UMASK=022
echo       - TZ=Asia/Shanghai
echo     networks:
echo       - openlist-network
echo.
echo   # 前端服务
echo   openlist-frontend:
echo     image: openlist-frontend:latest
echo     container_name: openlist-frontend
echo     restart: always
echo     ports:
echo       - "66:80"
echo     depends_on:
echo       - openlist-backend
echo     environment:
echo       - TZ=Asia/Shanghai
echo     networks:
echo       - openlist-network
echo.
echo networks:
echo   openlist-network:
echo     driver: bridge
) > docker-images/docker-compose.yml
echo ✅ 配置文件已创建: docker-images/docker-compose.yml
echo.

echo =========================================
echo ✅ 导出完成！
echo =========================================
echo.
echo 文件列表：
dir /b docker-images
echo.

REM 计算文件大小
for %%A in (docker-images\*.tar) do (
    echo %%~nxA - %%~zA 字节
)
echo.

echo 下一步操作：
echo 1. 上传到服务器: 杂项\Docker部署到服务器.bat
echo 2. 或手动上传 docker-images 目录到服务器
echo.
pause

