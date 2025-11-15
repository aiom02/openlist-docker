@echo off
chcp 65001 > nul
echo.
echo ========================================
echo   检查 OpenList 后端状态
echo ========================================
echo.

echo [1] 检查进程是否在运行...
tasklist /FI "IMAGENAME eq openlist.exe" 2>nul | find /I "openlist.exe" >nul
if %errorlevel% equ 0 (
    echo ✓ openlist.exe 正在运行
    echo.
    echo 进程信息：
    tasklist /FI "IMAGENAME eq openlist.exe" /V
) else (
    echo ✗ openlist.exe 未运行
)

echo.
echo [2] 检查可执行文件...
cd OpenList-main
if exist openlist.exe (
    echo ✓ openlist.exe 存在
    dir openlist.exe | find "openlist.exe"
) else (
    echo ✗ openlist.exe 不存在，需要编译
)

echo.
echo [3] 检查端口占用...
netstat -ano | findstr ":5244" >nul
if %errorlevel% equ 0 (
    echo ✓ 端口 5244 被占用
    echo.
    netstat -ano | findstr ":5244"
) else (
    echo ✗ 端口 5244 未被占用
)

echo.
echo ========================================
echo.
pause

