@echo off
chcp 65001 >nul
echo ========================================
echo OpenList 前端启动脚本
echo ========================================
echo.

cd /d "d:\SoftwareDevelopment\Project\openList__Tag_Synchronization\OpenList-Frontend-main"

echo 检查 Node.js 环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] Node.js 未安装
    echo 请先安装 Node.js: https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js 环境正常
echo.

echo 检查 pnpm...
pnpm --version >nul 2>&1
if errorlevel 1 (
    echo pnpm 未安装，正在安装...
    npm install -g pnpm
    if errorlevel 1 (
        echo [错误] pnpm 安装失败
        echo 将使用 npm 代替
        set USE_NPM=1
    )
)

if defined USE_NPM (
    echo 安装依赖 (使用 npm)...
    npm install
    if errorlevel 1 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
    
    echo 启动开发服务器...
    echo 访问地址: http://localhost:3000
    echo 按 Ctrl+C 停止服务
    echo.
    npm run dev
) else (
    echo 安装依赖 (使用 pnpm)...
    pnpm install
    if errorlevel 1 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
    
    echo 启动开发服务器...
    echo 访问地址: http://localhost:3000
    echo 按 Ctrl+C 停止服务
    echo.
    pnpm dev
)

pause
