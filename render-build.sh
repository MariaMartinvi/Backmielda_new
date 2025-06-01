#!/bin/bash

echo "🚀 Starting Render build process..."
echo "=================================="

# Update package list
echo "📦 Updating package list..."
apt-get update

# Install FFmpeg
echo "⬇️ Installing FFmpeg..."
apt-get install -y ffmpeg

# Verify FFmpeg installation
echo "🔍 Verifying FFmpeg installation..."
if command -v ffmpeg &> /dev/null; then
    echo "✅ FFmpeg installed successfully"
    ffmpeg -version | head -1
else
    echo "❌ FFmpeg installation failed"
    echo "⚠️ Trying alternative installation..."
    
    # Try installing via snap as fallback
    if command -v snap &> /dev/null; then
        snap install ffmpeg
        if command -v ffmpeg &> /dev/null; then
            echo "✅ FFmpeg installed via snap"
        else
            echo "❌ FFmpeg installation via snap also failed"
        fi
    else
        echo "❌ Snap not available, FFmpeg installation failed"
    fi
fi

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

echo "✅ Build process completed!"
echo "==================================" 