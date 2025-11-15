@echo off
echo.
echo ==========================================
echo   OpenList Frontend Dev Server
echo ==========================================
echo.

REM Go to frontend directory
cd /d "%~dp0OpenList-Frontend-main"
if errorlevel 1 (
    echo ERROR: Cannot find OpenList-Frontend-main directory
    echo Please run this script from project root
    pause
    exit /b 1
)

REM Install dependencies if needed (first time only)
if not exist "node_modules" (
    echo.
    echo First time setup - Installing dependencies...
    echo This will take a few minutes...
    echo.
    pnpm install
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to install dependencies
        echo.
        pause
        exit /b 1
    )
)

REM Start development server
echo.
echo ==========================================
echo   Starting Development Server...
echo ==========================================
echo.
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:5244
echo.
echo   Press Ctrl+C to stop
echo ==========================================
echo.

pnpm run dev

echo.
echo Dev server stopped
pause

