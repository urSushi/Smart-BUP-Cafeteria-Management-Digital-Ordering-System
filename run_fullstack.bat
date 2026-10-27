@echo off
setlocal
title Smart BUP Cafeteria Management System (SBCMS) Launcher
color 0b

echo ==============================================================================
echo    Smart BUP Cafeteria Management ^& Digital Ordering System (SBCMS)
echo                       Fullstack Application Launcher
echo ==============================================================================
echo.

:: 1. Dynamic Root Resolution using goto (avoids parentheses issue with "(3)")
if exist "%~dp0backend\server\server.js" goto :root_here
if exist "%~dp0sbcms-module1\backend\server\server.js" goto :root_sub

echo [ERROR] Project files could not be located relative to:
echo         "%~dp0"
echo.
pause
exit /b 1

:root_here
set "PROJ_ROOT=%~dp0"
goto :check_node

:root_sub
set "PROJ_ROOT=%~dp0sbcms-module1\"
goto :check_node

:check_node
echo [*] Project root verified at:
echo     "%PROJ_ROOT%"
echo.

:: 2. Pre-flight Check: Node.js & npm
echo [*] Checking Node.js runtime environment...
where node >nul 2>&1
if errorlevel 1 goto :no_node

where npm >nul 2>&1
if errorlevel 1 goto :no_node

echo [✓] Node.js and npm are available.
echo.
goto :check_deps

:no_node
echo [ERROR] Node.js or npm is not installed or not found on your system PATH!
echo Please install Node.js from https://nodejs.org/ and retry.
echo.
pause
exit /b 1

:check_deps
:: 3. Dependencies Verification & Installation
if exist "%PROJ_ROOT%backend\node_modules\" goto :check_frontend_deps
echo [*] Backend dependencies missing. Running npm install for backend...
pushd "%PROJ_ROOT%backend"
call npm install
popd
echo [✓] Backend dependencies installed successfully.
echo.

:check_frontend_deps
if exist "%PROJ_ROOT%frontend\node_modules\" goto :launch_services
echo [*] Frontend dependencies missing. Running npm install for frontend...
pushd "%PROJ_ROOT%frontend"
call npm install
popd
echo [✓] Frontend dependencies installed successfully.
echo.

:launch_services
:: 4. Start Backend Server (Port 5000)
echo [*] Starting Backend API Server on http://localhost:5000 ...
start "SBCMS Backend API (Port 5000)" /D "%PROJ_ROOT%backend" cmd /k "title SBCMS Backend API (Port 5000) && npm start"

:: 5. Start Frontend Client (Port 5173)
echo [*] Starting Frontend Web Client on http://localhost:5173 ...
start "SBCMS Frontend Client (Port 5173)" /D "%PROJ_ROOT%frontend" cmd /k "title SBCMS Frontend Client (Port 5173) && npm run dev"

:: 6. Wait for servers to spin up, then open browser
echo.
echo [*] Waiting 3 seconds for services to initialize...
ping 127.0.0.1 -n 4 >nul

echo [*] Launching web app in default browser...
start http://localhost:5173/

:: 7. Console Dashboard
cls
echo ==============================================================================
echo    Smart BUP Cafeteria Management ^& Digital Ordering System (SBCMS)
echo                        SYSTEM RUNNING SUCCESSFULLY
echo ==============================================================================
echo.
echo  LIVE ACCESS URLS:
echo  ----------------------------------------------------------------------------
echo  - Frontend Web App:     http://localhost:5173/
echo  - Admin Portal Login:   http://localhost:5173/admin/login
echo  - Backend REST API:     http://localhost:5000/
echo  - Health / DB Status:   http://localhost:5000/api/database/status
echo.
echo  PRE-SEEDED DEMO ACCOUNTS (Password for all: password123):
echo  ----------------------------------------------------------------------------
echo  - Student:           2021-1-60-001  or  student@bup.edu.bd
echo  - Faculty:           FAC-101        or  faculty@bup.edu.bd
echo  - Officer:           OFF-301        or  officer@bup.edu.bd
echo  - Staff:             STF-001        or  staff@bup.edu.bd
echo  - Guest Pass:        GST-8890       or  guest@bup.edu.bd
echo  - Kitchen Staff:     STF-VST (Vista)  ^|  STF-AMT (Amitie)
echo  - Cafeteria Manager: MGR-001 (Vista)  ^|  MGR-002 (Amitie)
echo  - Platform Admin:    ADM-001        or  admin@bup.edu.bd (use Admin Portal)
echo.
echo  MANAGEMENT NOTES:
echo  ----------------------------------------------------------------------------
echo  - Two separate command windows have been opened for the Backend and Frontend.
echo  - Keep those windows open while using the application.
echo  - To stop the services: close the individual windows or press Ctrl+C in them.
echo ==============================================================================
echo.
echo Press any key to exit this launcher window (servers will continue running)...
pause >nul
