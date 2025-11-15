@echo off
echo ==========================================
echo   Exporting Docker Images
echo ==========================================
echo.

if not exist "docker-images" mkdir docker-images

echo [1/2] Exporting Backend Image...
docker save openlist-backend:latest -o docker-images\openlist-backend.tar
if errorlevel 1 (
    echo [ERROR] Backend export failed
    pause
    exit /b 1
)
echo [OK] Backend exported to docker-images\openlist-backend.tar

echo.
echo [2/2] Exporting Frontend Image...
docker save openlist-frontend:latest -o docker-images\openlist-frontend.tar
if errorlevel 1 (
    echo [ERROR] Frontend export failed
    pause
    exit /b 1
)
echo [OK] Frontend exported to docker-images\openlist-frontend.tar

echo.
echo ==========================================
echo   Export Complete!
echo ==========================================
echo.
echo Files created:
echo   - docker-images\openlist-backend.tar
echo   - docker-images\openlist-frontend.tar
echo.
echo Now upload these files to your server
echo.
pause

