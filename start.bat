@echo off
title Smart BUP Cafeteria Management System (SBCMS) Launcher
echo ======================================================================
echo    Smart BUP Cafeteria Management & Digital Ordering System (SBCMS)
echo ======================================================================
echo.
echo [1/2] Launching Backend API Server (Port 5000)...
start "SBCMS Backend Server (Port 5000)" cmd /k "cd backend && npm start"

echo [2/2] Launching Frontend Client (Port 5173)...
start "SBCMS Frontend Client (Port 5173)" cmd /k "cd frontend && npm run dev"

echo.
echo All services launched!
echo - Frontend: http://localhost:5173/
echo - Backend API: http://localhost:5000/
echo ======================================================================
