@echo off
chcp 65001 > nul
echo.
echo ==========================================
echo   OpenList 后端编译和启动脚本
echo ==========================================
echo.

cd OpenList-main

echo [1/3] 正在编译后端...
go build -o openlist.exe .

if %errorlevel% neq 0 (
    echo.
    echo ❌ 编译失败！请检查错误信息
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ 编译成功！
echo.

echo [2/3] 停止旧进程...
taskkill /F /IM openlist.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo [3/3] 启动后端服务...
echo.
echo 服务将在 http://localhost:5244 运行
echo 按 Ctrl+C 可停止服务
echo.
echo ==========================================
echo.

openlist.exe server

