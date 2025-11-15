@echo off
chcp 65001 > nul
echo.
echo 正在快速重新编译后端...
echo.

cd OpenList-main

echo [1/2] 编译...
go build -o openlist.exe .

if errorlevel 1 (
    echo ❌ 编译失败
    pause
    exit /b 1
)

echo.
echo ✅ 编译成功！
echo.
echo [2/2] 提示：
echo 请停止当前运行的后端（Ctrl+C）
echo 然后重新启动： openlist.exe server
echo.
pause

