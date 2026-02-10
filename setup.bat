@echo off
REM WebHarbour Quick Start Script for Windows

echo.
echo =====================================
echo    WebHarbour - Quick Start Guide
echo =====================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js first.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js is installed
node --version
echo.

REM Backend setup
echo [INFO] Setting up Backend...
cd backend

if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm install
) else (
    echo [OK] Dependencies already installed
)

echo.
echo [OK] Backend setup complete!
echo.

REM Check if .env exists
if not exist ".env" (
    echo [WARNING] .env file not found in backend folder!
    echo.
    echo Please create a .env file with the following content:
    echo.
    echo MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/webharbour
    echo JWT_SECRET=webharbour-secret-key
    echo PORT=5000
    echo NODE_ENV=development
    echo.
    echo Then run: npm start
) else (
    echo [OK] .env file found
)

echo.
echo =====================================
echo    Setup Complete!
echo =====================================
echo.
echo Next steps:
echo 1. Configure your .env file with MongoDB URI
echo 2. Run 'npm start' in the backend folder to start the server
echo 3. Open frontend/index.html in your browser ^(use Live Server extension^)
echo.
echo For detailed setup instructions, see SETUP_GUIDE.md
echo.

pause
