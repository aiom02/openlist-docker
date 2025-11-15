@echo off
chcp 65001 > nul
echo.
echo ==========================================
echo   构建前端并复制到后端
echo ==========================================
echo.

cd OpenList-Frontend-main

echo [步骤 1/3] 构建前端生产版本...
call pnpm run build

if errorlevel 1 (
    echo.
    echo ❌ 构建失败
    pause
    exit /b 1
)

echo.
echo ✅ 构建成功！
echo.

echo [步骤 2/3] 清理后端旧文件...
cd ..\OpenList-main\public
if exist dist (
    rd /s /q dist
    echo ✓ 已删除旧的 dist 文件夹
)

echo.
echo [步骤 3/3] 复制新文件到后端...
cd ..\..\OpenList-Frontend-main
xcopy /E /I /Y dist ..\OpenList-main\public\dist

if errorlevel 1 (
    echo.
    echo ❌ 复制失败
    pause
    exit /b 1
)

echo.
echo ✅ 完成！前端文件已更新到后端
echo.
echo 现在重启后端服务即可看到最新版本
echo.
pause

