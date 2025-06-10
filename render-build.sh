#!/bin/bash

echo "🚀 Starting Render build process..."
echo "=================================="

# Update package list
echo "📦 Updating package list..."
apt-get update

# Install FFmpeg
echo "⬇️ Installing FFmpeg..."
apt-get install -y ffmpeg

# Verify FFmpeg installation with detailed diagnostics
echo "🔍 Verifying FFmpeg installation..."
if command -v ffmpeg &> /dev/null; then
    echo "✅ FFmpeg installed successfully"
    ffmpeg -version | head -1
    echo "📍 FFmpeg location: $(which ffmpeg)"
    echo "🔧 FFmpeg executable permissions: $(ls -la $(which ffmpeg))"
    
    # Test FFmpeg functionality
    echo "🧪 Testing FFmpeg functionality..."
    timeout 10s ffmpeg -f lavfi -i testsrc=duration=1:size=32x32:rate=1 -f null - 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ FFmpeg functionality test passed"
    else
        echo "⚠️ FFmpeg functionality test failed, but continuing build"
    fi
else
    echo "❌ FFmpeg installation failed"
    echo "⚠️ Trying alternative installation..."
    
    # Try installing via snap as fallback
    if command -v snap &> /dev/null; then
        echo "📦 Attempting snap installation..."
        snap install ffmpeg
        if command -v ffmpeg &> /dev/null; then
            echo "✅ FFmpeg installed via snap"
            echo "📍 FFmpeg location: $(which ffmpeg)"
        else
            echo "❌ FFmpeg installation via snap also failed"
            echo "⚠️ Background music will be disabled in production"
        fi
    else
        echo "❌ Snap not available, FFmpeg installation failed"
        echo "⚠️ Background music will be disabled in production"
    fi
fi

# Check if background music directory exists and list files
echo "🎵 Checking background music files..."
if [ -d "assets/background-music" ]; then
    echo "✅ Background music directory found"
    echo "📂 Music files available:"
    ls -la assets/background-music/*.mp3 2>/dev/null || echo "❌ No MP3 files found"
    echo "📊 Total music files: $(ls assets/background-music/*.mp3 2>/dev/null | wc -l)"
else
    echo "❌ Background music directory not found"
    echo "📂 Available directories:"
    ls -la assets/ 2>/dev/null || echo "❌ Assets directory not found"
fi

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Run post-install FFmpeg check
echo "🔧 Running post-install FFmpeg verification..."
node -e "
const { checkFFmpegAvailability } = require('./utils/audioMixer');
checkFFmpegAvailability().then(available => {
  console.log('🎯 Final FFmpeg status:', available ? '✅ Available' : '❌ Not available');
  if (!available) {
    console.log('⚠️ Audio generation will work, but without background music');
  }
}).catch(err => {
  console.log('❌ Error checking FFmpeg:', err.message);
});
"

echo "✅ Build process completed!"
echo "==================================" 