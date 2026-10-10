@echo off
title Smart BUP Cafeteria Management System (SBCMS) Launcher
echo ======================================================================
echo    Smart BUP Cafeteria Management ^& Digital Ordering System (SBCMS)
echo ======================================================================
echo.

if not exist "backend\node_modules\" (
    echo [Setup] First-time setup detected. Installing backend dependencies...
    cd backend && call npm install && cd ..
)

if not exist "frontend\node_modules\" (
    echo [Setup] First-time setup detected. Installing frontend dependencies...
    cd frontend && call npm install && cd ..
)

echo.
echo [1/2] Launching Backend API Server (Port 5000)...
start "SBCMS Backend Server (Port 5000)" cmd /k "cd backend && npm start"

echo [2/2] Launching Frontend Client (Port 5173)...
start "SBCMS Frontend Client (Port 5173)" cmd /k "cd frontend && npm run dev"

echo.
echo ======================================================================
echo All services launched!
echo - Frontend Website: http://localhost:5173/
echo - Backend REST API: http://localhost:5000/
echo.
echo Demo Accounts (Password: password123):
echo - Student:        2021-1-60-001
echo - Kitchen Staff:  STF-001
echo - Manager:        MGR-001
echo - Administrator:  ADM-001
echo - Guest Pass:     GST-8890
echo ======================================================================
