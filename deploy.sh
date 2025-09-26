#!/bin/bash

# Production Deployment Script for Manas Pomodoro App

echo "🚀 Starting production deployment..."

# Check if required tools are installed
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed. Aborting." >&2; exit 1; }

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Build the application
echo "🔨 Building the application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed! Please check the errors above."
    exit 1
fi

# Start the application
echo "🚀 Starting the application..."
npm start

echo "🎉 Deployment complete! Your app should be running on port 3000"
echo "📱 Access your app at: http://localhost:3000"