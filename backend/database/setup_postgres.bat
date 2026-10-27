@echo off
title Setup SBCMS Database in PostgreSQL
color 0b

echo ==============================================================================
echo       Smart BUP Cafeteria Management System (SBCMS) - DB Setup
echo ==============================================================================
echo.
echo This script will create 'sbcms_db' and load all 16 tables and seed data
echo into your local PostgreSQL 18 instance.
echo.

set PSQL_PATH="C:\Program Files\PostgreSQL\18\bin\psql.exe"
if not exist %PSQL_PATH% (
    set PSQL_PATH=psql
)

set /p PG_PASS="Enter your PostgreSQL 'postgres' superuser password: "
set PGPASSWORD=%PG_PASS%

echo.
echo [1/3] Creating database 'sbcms_db' if it does not already exist...
%PSQL_PATH% -U postgres -h localhost -p 5432 -c "CREATE DATABASE sbcms_db;" 2>nul
if %ERRORLEVEL% equ 0 (
    echo Database 'sbcms_db' created successfully!
) else (
    echo Database 'sbcms_db' already exists or ready. Continuing...
)

echo.
echo [2/3] Executing schema.sql (Creating 16 tables, constraints, indexes)...
%PSQL_PATH% -U postgres -h localhost -p 5432 -d sbcms_db -f "%~dp0schema.sql"
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to execute schema.sql. Please check your password.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/3] Executing seeds.sql (Populating cafeterias, menus, users, orders)...
%PSQL_PATH% -U postgres -h localhost -p 5432 -d sbcms_db -f "%~dp0seeds.sql"
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to execute seeds.sql.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ==============================================================================
echo  SUCCESS! Database 'sbcms_db' is now fully loaded in PostgreSQL / pgAdmin!
echo.
echo  NEXT STEP:
echo  Update PG_PASSWORD in 'sbcms-module1/backend/.env' with your password:
echo      PG_PASSWORD=%PG_PASS%
echo ==============================================================================
echo.
pause
