@echo off
chcp 65001 > nul
echo.
echo ==========================================
echo   强制停止并重新编译启动后端
echo ==========================================
echo.

echo [步骤 1/4] 强制停止所有 openlist 进程...
taskkill /F /IM openlist.exe 2>nul
if %errorlevel% equ 0 (
    echo ✓ 已停止旧进程
) else (
    echo - 没有发现运行中的进程
)
timeout /t 2 /nobreak >nul

cd OpenList-main

echo.
echo [步骤 2/4] 清理旧文件...
if exist openlist.exe (
    del /F openlist.exe
    echo ✓ 已删除旧的 openlist.exe
)
timeout /t 1 /nobreak >nul

echo.
echo [步骤 3/4] 重新编译...
go build -ldflags="-s -w" -o openlist.exe .

if %errorlevel% neq 0 (
    echo.
    echo ❌ 编译失败！
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ 编译成功！
echo.

echo [步骤 4/4] 启动新的后端服务...
echo.
echo ==========================================
echo   服务运行在: http://localhost:5244
echo   按 Ctrl+C 停止服务
echo ==========================================
echo.

openlist.exe server

