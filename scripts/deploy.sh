#!/bin/bash

# Deployment script for AkwaabaHRPay
echo "🚀 Starting deployment process..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run linting
echo "🔍 Running linting..."
npm run lint

# Build the application
echo "🏗️ Building application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # If Vercel CLI is available, deploy
    if command -v vercel &> /dev/null; then
        echo "🚀 Deploying to Vercel..."
        vercel --prod
    else
        echo "⚠️ Vercel CLI not found. Please install it with: npm i -g vercel"
        echo "📋 Build files are ready in .next/ directory"
    fi
else
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

echo "🎉 Deployment process completed!"