@echo off
title CodeRed Multi-Game System (Auto-Restart)
setlocal

echo ========================================================
echo [CLEANUP] Killing existing Node/Vite processes...
echo ========================================================
:: Kill all node processes (including hung gateways)
taskkill /f /im node.exe /t >nul 2>&1
:: Kill all vite processes
taskkill /f /im vite.exe /t >nul 2>&1
:: Small delay to let ports clear
timeout /t 2 /nobreak >nul

echo ========================================================
echo [STARTUP] Starting All CodeRed Services...
echo ========================================================

:: BACKENDS
echo [1/9] Starting Survival Backend (3001)...
start "Survival Backend" cmd /k "cd backend && node server.js"

echo [2/9] Starting Escape Backend (3003)...
start "Escape Backend" cmd /k "cd game2\server && node server.js"

echo [3/9] Starting Darkroom Backend (3002)...
start "Darkroom Backend" cmd /k "cd game3 && node server.js"

echo [4/9] Starting Hoop Backend (3004)...
start "Hoop Backend" cmd /k "cd game4 && node server.js"

:: FRONTENDS
echo [5/9] Starting Survival Frontend (5173)...
start "Survival Frontend" cmd /k "cd frontend && npm run dev"

echo [6/9] Starting Escape Frontend (5174)...
start "Escape Frontend" cmd /k "cd game2\client && npm run dev"

echo [7/9] Starting Darkroom Frontend (5175)...
start "Darkroom Frontend" cmd /k "cd game3 && npm run dev"

echo [8/9] Starting Hoop Frontend (5176)...
start "Hoop Frontend" cmd /k "cd game4 && npm run dev"

:: HUB
echo [9/9] Starting MASTER HUB (3000)...
start "HUB" cmd /k "node hub.js"

echo.
echo ========================================================
echo ALL DONE! 
echo Share this link with your friend: http://localhost:3000
echo ========================================================
pause
