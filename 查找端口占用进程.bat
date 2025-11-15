@echo off
chcp 65001 > nul
echo.
echo ==========================================
echo   查找占用 5244 端口的进程
echo ==========================================
echo.

echo [1] 查找端口占用...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5244.*LISTENING"') do (
    set PID=%%a
    goto :found
)

echo ✗ 没有发现占用 5244 端口的进程
goto :end

:found
echo ✓ 找到进程 PID: %PID%
echo.

echo [2] 进程详细信息...
tasklist /FI "PID eq %PID%" /V
echo.

echo [3] 进程文件路径...
wmic process where "ProcessId=%PID%" get ProcessId,ExecutablePath,CommandLine /format:list
echo.

echo ==========================================
echo.
echo 是否要强制结束这个进程？
echo.
choice /C YN /M "输入 Y 结束进程，N 取消"

if errorlevel 2 goto :end
if errorlevel 1 goto :kill

:kill
echo.
echo 正在结束进程 %PID%...
taskkill /F /PID %PID%
if %errorlevel% equ 0 (
    echo ✓ 进程已结束
    timeout /t 2 /nobreak >nul
) else (
    echo ✗ 结束进程失败
)

:end
echo.
pause

