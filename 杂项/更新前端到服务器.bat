@echo off
chcp 65001 >nul
REM 更新前端文件到服务器
REM 服务器: 70.39.205.183

echo =========================================
echo 更新前端文件到服务器
echo =========================================
echo.

set SERVER_IP=70.39.205.183
set SERVER_USER=root

REM 检查是否在项目根目录
if not exist "OpenList-Frontend-main" (
    echo 错误: 找不到 OpenList-Frontend-main 目录
    echo 请在项目根目录运行此脚本
    pause
    exit /b 1
)

echo 正在构建前端...
cd OpenList-Frontend-main

REM 检查包管理器
where pnpm >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo 使用 pnpm 构建...
    call pnpm install
    call pnpm build
) else (
    where npm >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo 使用 npm 构建...
        call npm install
        call npm run build
    ) else (
        echo 错误: 未找到 npm 或 pnpm
        cd ..
        pause
        exit /b 1
    )
)

cd ..

if not exist "OpenList-Frontend-main\dist" (
    echo 错误: 构建失败，找不到 dist 目录
    pause
    exit /b 1
)

echo.
echo 前端构建完成！
echo.
echo 正在上传前端文件到服务器...
echo 请输入服务器密码
echo.

REM 确保远程目录存在
ssh %SERVER_USER%@%SERVER_IP% "mkdir -p /opt/openlist/public/dist"

REM 使用 scp 上传文件
echo 上传中（可能需要一些时间）...
scp -r OpenList-Frontend-main\dist\* %SERVER_USER%@%SERVER_IP%:/opt/openlist/public/dist/

if %ERRORLEVEL% EQU 0 (
    echo.
    echo 文件上传成功！
    echo.
    echo 正在重启 OpenList 服务...
    ssh %SERVER_USER%@%SERVER_IP% "docker restart openlist 2>/dev/null || systemctl restart openlist"
    
    echo.
    echo =========================================
    echo 前端更新完成！
    echo =========================================
    echo.
    echo 访问地址: http://%SERVER_IP%:5244
    echo 请清除浏览器缓存后刷新页面查看更新
    echo.
) else (
    echo.
    echo 错误: 文件上传失败
    echo 请检查网络连接和服务器访问权限
    echo.
)

pause

