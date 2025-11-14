@echo off
chcp 65001 >nul
echo ========================================
echo OpenList 启动脚本
echo ========================================
echo.

cd /d "d:\SoftwareDevelopment\Project\openList__Tag_Synchronization\OpenList-main"

echo 检查 Go 环境...
set "PATH=C:\Program Files\Go\bin;%PATH%"
go version >nul 2>&1
if errorlevel 1 (
    echo [错误] Go 未安装或不在 PATH 中
    echo 请先安装 Go: https://golang.org/dl/
    pause
    exit /b 1
)

echo Go 环境正常
echo.

echo 设置环境变量...
set CGO_ENABLED=1
set OPENLIST_DATABASE_TYPE=sqlite3
set OPENLIST_DATABASE_DSN=data/data.db

echo 尝试编译项目...
go build -v . 2>build_error.log
if errorlevel 1 (
    echo [警告] 编译失败，可能是因为缺少 C 编译器
    echo 错误信息已保存到 build_error.log
    echo.
    echo 尝试直接运行...
    go run . server
) else (
    echo 编译成功！
    echo.
    echo 启动 OpenList 服务器...
    echo 访问地址: http://localhost:5244
    echo 按 Ctrl+C 停止服务
    echo.
    .\OpenList.exe server
)

pause
