@echo off
chcp 65001 > nul
cd OpenList-main
echo 正在编译后端...
go build -o openlist.exe .
if %errorlevel% equ 0 (
    echo.
    echo ✅ 编译成功！
    echo.
    echo 现在可以运行: openlist.exe server
    pause
) else (
    echo.
    echo ❌ 编译失败，请检查错误信息
    pause
)

