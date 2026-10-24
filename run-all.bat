@echo off
title HCM Lite Launcher
echo ========================================================
echo        Starting HCM Lite (Full Auto Zero-Setup)
echo ========================================================
echo.

echo [1/3] Checking and starting local MongoDB (if installed)...
net start MongoDB 2>nul
if %errorlevel% equ 0 (
    echo   -- MongoDB service started!
) else (
    echo   -- Local MongoDB service not active. Zero-setup in-memory fallback will activate.
)
echo.

echo [2/3] Launching Backend on Port 5000...
start "HCM Lite - Backend" cmd /k "cd /d "%~dp0backend" && npm install && npm start"

echo [3/3] Launching Frontend on Port 5173...
start "HCM Lite - Frontend" cmd /k "cd /d "%~dp0frontend" && npm install && npm run dev"

echo.
echo ========================================================
echo Waiting for servers to initialize...
timeout /t 3 >nul
echo Opening HCM Lite in your browser...
start http://localhost:5173/login
echo.
echo Both servers are running!
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:5000
echo ========================================================
