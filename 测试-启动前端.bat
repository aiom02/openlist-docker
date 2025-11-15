@echo off
echo ==========================================
echo Testing Frontend Startup Script
echo ==========================================
echo.

echo Step 1: Check current directory
cd
echo.
pause

echo Step 2: Check Node.js
node -v
echo.
pause

echo Step 3: Check pnpm  
pnpm -v
echo.
pause

echo Step 4: Check if OpenList-Frontend-main exists
if exist "OpenList-Frontend-main" (
    echo [OK] Directory found
) else (
    echo [ERROR] Directory not found!
)
echo.
pause

echo Step 5: Enter frontend directory
cd OpenList-Frontend-main
if errorlevel 1 (
    echo [ERROR] Cannot enter directory
    pause
    exit /b 1
)
echo [OK] Entered directory
cd
echo.
pause

echo Step 6: Check if node_modules exists
if exist "node_modules" (
    echo [OK] node_modules found
) else (
    echo [WARN] node_modules not found, need to install
)
echo.
pause

echo Step 7: Check package.json
if exist "package.json" (
    echo [OK] package.json found
) else (
    echo [ERROR] package.json not found!
)
echo.
pause

echo All checks passed! Ready to start dev server.
echo.
echo To start: pnpm run dev
echo.
pause

