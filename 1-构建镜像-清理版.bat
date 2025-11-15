@echo off
echo ==========================================
echo   Building Docker Images (Clean Build)
echo ==========================================
echo.

echo Cleaning Docker build cache...
docker builder prune -f
echo.

echo [1/3] Building Frontend...
cd OpenList-Frontend-main
if not exist "node_modules" (
    echo Installing dependencies...
    pnpm install
)
echo Building frontend...
pnpm build
if errorlevel 1 (
    echo [ERROR] Frontend build failed
    pause
    exit /b 1
)
cd ..
echo [OK] Frontend built to OpenList-Frontend-main/dist

echo.
echo [2/3] Building Backend Image (using Dockerfile.backend-simple)...
echo Checking if Dockerfile exists...
if not exist "Dockerfile.backend-simple" (
    echo [ERROR] Dockerfile.backend-simple not found!
    pause
    exit /b 1
)
echo [OK] Dockerfile found

docker build --no-cache -t openlist-backend:latest -f Dockerfile.backend-simple .
if errorlevel 1 (
    echo [ERROR] Backend build failed
    pause
    exit /b 1
)
echo [OK] Backend image built

echo.
echo [3/3] Building Frontend Nginx Image...
docker build --no-cache -t openlist-frontend:latest -f Dockerfile.frontend .
if errorlevel 1 (
    echo [ERROR] Frontend image build failed
    pause
    exit /b 1
)
echo [OK] Frontend image built

echo.
echo ==========================================
echo   All images built successfully!
echo ==========================================
echo   - openlist-backend:latest
echo   - openlist-frontend:latest
echo ==========================================
echo.
pause

