@echo off
chcp 65001 >nul
title OpenList 统一启动脚本

:MENU
cls
echo ==========================================
echo   OpenList 项目启动菜单
echo ==========================================
echo.
echo   请选择启动方式：
echo.
echo   [1] 同时启动前端和后端（推荐）
echo   [2] 仅启动前端开发服务器
echo   [3] 仅启动后端服务
echo   [4] 构建前端生产版本
echo   [5] 退出
echo.
echo ==========================================
echo.

set /p choice=请输入选项 (1-5): 

if "%choice%"=="1" goto START_ALL
if "%choice%"=="2" goto START_FRONTEND
if "%choice%"=="3" goto START_BACKEND
if "%choice%"=="4" goto BUILD_FRONTEND
if "%choice%"=="5" goto EXIT
echo.
echo ❌ 无效的选项，请重新选择...
timeout /t 2 >nul
goto MENU

:START_ALL
cls
echo ==========================================
echo   同时启动前端和后端服务
echo ==========================================
echo.

REM 检查环境
call :CHECK_NODE
if errorlevel 1 goto ERROR
call :CHECK_GO
if errorlevel 1 goto ERROR

echo.
echo 提示: 将在两个独立窗口中启动服务
echo.
timeout /t 2 /nobreak >nul

echo [1/2] 启动后端服务...
start "OpenList-后端" cmd /c "cd /d "%~dp0OpenList-main" && set CGO_ENABLED=1 && go run main.go server"
timeout /t 3 /nobreak >nul

echo [2/2] 启动前端服务...
start "OpenList-前端" cmd /c "cd /d "%~dp0OpenList-Frontend-main" && call npm config set registry https://registry.npmmirror.com && call pnpm dev"

echo.
echo ==========================================
echo   ✅ 启动完成！
echo.
echo   后端服务: http://localhost:5244
echo   前端服务: http://localhost:5173
echo.
echo   两个服务窗口已打开
echo   关闭此窗口不影响服务运行
echo   要停止服务，请关闭对应的服务窗口
echo ==========================================
echo.
echo 3秒后自动打开浏览器访问前端...
timeout /t 3 >nul
start http://localhost:5173
goto END

:START_FRONTEND
cls
echo ==========================================
echo   启动前端开发服务器
echo ==========================================
echo.

cd /d "%~dp0OpenList-Frontend-main"

call :CHECK_NODE
if errorlevel 1 goto ERROR

echo.
echo [1/3] 配置 npm 镜像源...
call npm config set registry https://registry.npmmirror.com

echo.
echo [2/3] 检查并安装 pnpm...
call npm list -g pnpm >nul 2>&1
if errorlevel 1 (
    echo 正在安装 pnpm...
    call npm install -g pnpm
    if errorlevel 1 (
        echo ❌ pnpm 安装失败
        goto ERROR
    )
    echo ✅ pnpm 安装成功
) else (
    echo ✅ pnpm 已安装
)

echo.
echo [3/3] 检查并安装依赖...
if not exist "node_modules" (
    echo 首次运行，正在安装依赖（可能需要几分钟）...
    call pnpm install
    if errorlevel 1 (
        echo ❌ 依赖安装失败
        goto ERROR
    )
) else (
    echo ✅ 依赖已存在，跳过安装
)

echo.
echo 启动前端开发服务器...
echo.
echo ==========================================
echo   前端服务正在运行...
echo   访问地址: http://localhost:5173
echo   按 Ctrl+C 停止服务
echo ==========================================
echo.

call pnpm dev

if errorlevel 1 (
    echo.
    echo ❌ 前端启动失败！
    goto ERROR
)

goto END

:START_BACKEND
cls
echo ==========================================
echo   启动后端服务
echo ==========================================
echo.

cd /d "%~dp0OpenList-main"

call :CHECK_GO
if errorlevel 1 goto ERROR

echo.
echo [1/3] 下载 Go 依赖...
go mod download
if errorlevel 1 (
    echo ⚠️  依赖下载出现问题，但将尝试继续运行...
)

echo.
echo [2/3] 检查前端构建文件...
if not exist "public\dist\index.html" (
    echo ⚠️  未找到前端构建文件
    echo 提示: 如需完整功能，请先运行"构建前端生产版本"
    echo 或使用"同时启动前端和后端"选项
    echo.
    set /p continue=是否继续启动后端? (Y/N): 
    if /i not "%continue%"=="Y" goto MENU
)

echo.
echo [3/3] 启动后端服务...
echo.
echo ==========================================
echo   后端服务正在运行...
echo   API地址: http://localhost:5244
echo   按 Ctrl+C 停止服务
echo ==========================================
echo.

REM 设置CGO环境变量
set CGO_ENABLED=1

go run main.go server

if errorlevel 1 (
    echo.
    echo ❌ 后端启动失败！
    echo.
    echo 可能的原因：
    echo   1. CGO编译环境问题（需要 MinGW-w64 或 TDM-GCC）
    echo   2. 端口 5244 被占用
    echo   3. 数据库文件损坏
    echo.
    goto ERROR
)

goto END

:BUILD_FRONTEND
cls
echo ==========================================
echo   构建前端生产版本
echo ==========================================
echo.

cd /d "%~dp0OpenList-Frontend-main"

call :CHECK_NODE
if errorlevel 1 goto ERROR

echo.
echo [1/4] 配置 npm 镜像源...
call npm config set registry https://registry.npmmirror.com

echo.
echo [2/4] 安装 pnpm...
call npm list -g pnpm >nul 2>&1
if errorlevel 1 (
    echo 正在安装 pnpm...
    call npm install -g pnpm
    if errorlevel 1 (
        echo ❌ pnpm 安装失败
        goto ERROR
    )
)

echo.
echo [3/4] 安装依赖并构建...
if not exist "node_modules" (
    echo 正在安装依赖（可能需要几分钟）...
    call pnpm install
    if errorlevel 1 (
        echo ❌ 依赖安装失败
        goto ERROR
    )
)

echo.
echo 开始构建前端...
call pnpm build
if errorlevel 1 (
    echo ❌ 构建失败
    goto ERROR
)

echo.
echo [4/4] 复制到后端目录...
xcopy /E /I /Y "dist\*" "..\OpenList-main\public\dist\" >nul
if errorlevel 1 (
    echo ❌ 文件复制失败
    goto ERROR
)

echo.
echo ==========================================
echo   ✅ 前端构建完成！
echo.
echo   构建文件已复制到后端 public/dist 目录
echo   现在可以启动后端服务使用生产版本
echo ==========================================
echo.
echo 按任意键返回菜单...
pause >nul
goto MENU

:CHECK_NODE
echo [检查] Node.js 环境...
where node >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未找到 Node.js 环境
    echo 请先安装 Node.js: https://nodejs.org/
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version 2^>nul') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% 已安装
exit /b 0

:CHECK_GO
echo [检查] Go 环境...
where go >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未找到 Go 环境
    echo 请先安装 Go: https://golang.org/dl/
    exit /b 1
)
for /f "tokens=3" %%i in ('go version 2^>nul') do set GO_VERSION=%%i
echo ✅ Go %GO_VERSION% 已安装
exit /b 0

:ERROR
echo.
echo ==========================================
echo   ❌ 执行过程中出现错误
echo ==========================================
echo.
echo 按任意键返回菜单...
pause >nul
goto MENU

:EXIT
cls
echo.
echo 感谢使用 OpenList！
echo.
timeout /t 2 >nul
exit

:END
echo.
echo 按任意键退出...
pause >nul
exit
