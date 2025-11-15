@echo off
chcp 65001 > nul
echo.
echo ==========================================
echo   启动前端开发服务器 (npm 版)
echo ==========================================
echo.

cd OpenList-Frontend-main

echo [1/2] 检查依赖...
if not exist node_modules (
    echo 首次运行，正在安装依赖...
    call npm install
    if errorlevel 1 (
        echo.
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
)

echo.
echo [2/2] 启动开发服务器...
echo.
echo ==========================================
echo   前端开发服务器将运行在:
echo   http://localhost:5173 或 5174
echo.
echo   后端API: http://localhost:5244
echo   按 Ctrl+C 停止服务
echo ==========================================
echo.

call npm run dev


