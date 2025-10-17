@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Ladapala POS System Startup
echo ========================================
echo.

REM Check if uv is installed
echo [1/5] Checking uv installation...
where uv >nul 2>&1
if %errorlevel% neq 0 (
    echo uv not found. Installing uv...
    powershell -Command "irm https://astral.sh/uv/install.ps1 | iex"
    if %errorlevel% neq 0 (
        echo Failed to install uv. Please install manually from https://github.com/astral-sh/uv
        pause
        exit /b 1
    )
    echo uv installed successfully.
) else (
    echo uv is already installed.
)
echo.

REM Sync backend dependencies
echo [2/5] Syncing backend dependencies...
cd backend
uv sync
if %errorlevel% neq 0 (
    echo Failed to sync backend dependencies.
    cd ..
    pause
    exit /b 1
)
echo Backend dependencies synced.
cd ..
echo.

REM Check if Node.js is installed
echo [3/5] Checking Node.js installation...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js not found. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js is installed.
echo.

REM Install frontend dependencies if needed
echo [4/5] Installing frontend dependencies...
cd resto
if not exist "node_modules\" (
    echo Installing npm packages...
    call npm install
    if %errorlevel% neq 0 (
        echo Failed to install frontend dependencies.
        cd ..
        pause
        exit /b 1
    )
) else (
    echo Frontend dependencies already installed.
)
cd ..
echo.

REM Start both services
echo [5/5] Starting services...
echo.
echo Starting Django backend on http://127.0.0.1:8000
echo Starting Next.js frontend on http://localhost:3000
echo.
echo Press Ctrl+C to stop both services
echo ========================================
echo.

REM Start backend in new window
start "Ladapala Backend" cmd /k "cd backend && python manage.py runserver"

REM Wait a moment for backend to initialize
timeout /t 2 /nobreak >nul

REM Start frontend in new window
start "Ladapala Frontend" cmd /k "cd resto && bun dev"

echo.
echo Services are starting in separate windows...
echo Backend: http://127.0.0.1:8000
echo Frontend: http://localhost:3000
echo.
echo Close this window or the service windows to stop the servers.
pause
