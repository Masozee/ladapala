#!/bin/bash

echo "🚀 Starting deployment process..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Are you in the right directory?"
    exit 1
fi

# Install production dependencies
echo "📦 Installing production dependencies..."
npm ci --only=production

# Build the application
echo "🔨 Building application..."
NODE_ENV=production npm run build

# Create cPanel package
echo "📦 Creating cPanel deployment package..."
npm run cpanel:package

echo ""
echo "✅ Deployment package ready!"
echo "Upload hotel-frontend-cpanel.zip to your cPanel"
