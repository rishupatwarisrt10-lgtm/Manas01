@echo off
echo 🚀 Starting production deployment...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is required but not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is required but not installed. Please install npm first.
    pause
    exit /b 1
)

REM Install dependencies
echo 📦 Installing dependencies...
npm ci --only=production

REM Build the application
echo 🔨 Building the application...
npm run build

REM Check if build was successful
if %errorlevel% neq 0 (
    echo ❌ Build failed! Please check the errors above.
    pause
    exit /b 1
)

echo ✅ Build successful!

REM Start the application
echo 🚀 Starting the application...
echo 🎉 Deployment complete! Your app should be running on port 3000
echo 📱 Access your app at: http://localhost:3000
npm start

pause