#!/bin/bash

# Frontend restart script - kills existing process, rebuilds, and starts dev server

echo "🔄 Restarting frontend..."

# Kill any process running on port 4000
echo "🛑 Killing processes on port 4000..."
lsof -ti:4000 | xargs kill -9 2>/dev/null || echo "No process found on port 4000"

# Build the project
echo "🔨 Building project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "🚀 Starting dev server on port 4000..."
    echo ""
    npm run dev
else
    echo "❌ Build failed!"
    exit 1
fi
