#!/bin/bash

# F5 Automation Control Center - Node.js Deployment Script
echo "🚀 Deploying F5 Automation Control Center..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install adapter-node for production
echo "📦 Installing adapter-node..."
npm install --save-dev @sveltejs/adapter-node

# Update svelte.config.js to use adapter-node
sed -i '' "s/@sveltejs\/adapter-auto/@sveltejs\/adapter-node/g" svelte.config.js

# Build the application
echo "🔨 Building application..."
npm run build

# Create data directory
mkdir -p data

# Stop any existing PM2 process
pm2 stop f5-control-center 2>/dev/null || true
pm2 delete f5-control-center 2>/dev/null || true

# Start the application with PM2
echo "🚀 Starting application..."
pm2 start build/index.js --name f5-control-center --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup | tail -1 | bash || true

echo "✅ F5 Automation Control Center is running!"
echo "🌐 Access the application at: http://localhost:3000"
echo "📊 Check status with: pm2 status"
echo "📝 View logs with: pm2 logs f5-control-center"


