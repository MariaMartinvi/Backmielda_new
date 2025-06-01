#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 FFmpeg Installation Script');
console.log('============================');

// Check if we're in production environment
const isProduction = process.env.NODE_ENV === 'production';
const isLinux = process.platform === 'linux';

console.log(`Environment: ${isProduction ? 'Production' : 'Development'}`);
console.log(`Platform: ${process.platform}`);

// Function to check if FFmpeg is available
function checkFFmpegAvailability() {
  try {
    execSync('ffmpeg -version', { stdio: 'pipe' });
    console.log('✅ FFmpeg is already available');
    return true;
  } catch (error) {
    console.log('❌ FFmpeg is not available');
    return false;
  }
}

// Function to install FFmpeg on Linux (Ubuntu/Debian)
function installFFmpegLinux() {
  console.log('🐧 Installing FFmpeg on Linux...');
  
  try {
    // Update package list
    console.log('📦 Updating package list...');
    execSync('apt-get update', { stdio: 'inherit' });
    
    // Install FFmpeg
    console.log('⬇️ Installing FFmpeg...');
    execSync('apt-get install -y ffmpeg', { stdio: 'inherit' });
    
    console.log('✅ FFmpeg installed successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to install FFmpeg via apt-get:', error.message);
    
    // Try alternative installation method
    console.log('🔄 Trying alternative installation method...');
    try {
      // Install via snap as fallback
      execSync('snap install ffmpeg', { stdio: 'inherit' });
      console.log('✅ FFmpeg installed successfully via snap');
      return true;
    } catch (snapError) {
      console.error('❌ Failed to install FFmpeg via snap:', snapError.message);
      return false;
    }
  }
}

// Function to install FFmpeg using static binaries
function installFFmpegStatic() {
  console.log('📦 Installing FFmpeg static binaries...');
  
  try {
    const ffmpegDir = path.join(__dirname, '../ffmpeg-static');
    
    // Create directory
    if (!fs.existsSync(ffmpegDir)) {
      fs.mkdirSync(ffmpegDir, { recursive: true });
    }
    
    // Download static FFmpeg binary
    console.log('⬇️ Downloading FFmpeg static binary...');
    execSync(`wget -O ${ffmpegDir}/ffmpeg.tar.xz https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz`, { stdio: 'inherit' });
    
    // Extract
    console.log('📂 Extracting FFmpeg...');
    execSync(`cd ${ffmpegDir} && tar -xf ffmpeg.tar.xz --strip-components=1`, { stdio: 'inherit' });
    
    // Make executable
    execSync(`chmod +x ${ffmpegDir}/ffmpeg ${ffmpegDir}/ffprobe`, { stdio: 'inherit' });
    
    // Add to PATH
    process.env.PATH = `${ffmpegDir}:${process.env.PATH}`;
    
    console.log('✅ FFmpeg static binaries installed successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to install FFmpeg static binaries:', error.message);
    return false;
  }
}

// Main installation logic
async function main() {
  // Check if FFmpeg is already available
  if (checkFFmpegAvailability()) {
    console.log('🎉 FFmpeg is ready to use!');
    process.exit(0);
  }
  
  // Only install in production or Linux environments
  if (!isProduction && !isLinux) {
    console.log('⚠️ Skipping FFmpeg installation in development environment');
    console.log('💡 Make sure you have FFmpeg installed locally or use the provided Windows binaries');
    process.exit(0);
  }
  
  console.log('🚀 Starting FFmpeg installation...');
  
  let installSuccess = false;
  
  if (isLinux) {
    // Try system package manager first
    installSuccess = installFFmpegLinux();
    
    // If system installation fails, try static binaries
    if (!installSuccess) {
      console.log('🔄 Trying static binary installation...');
      installSuccess = installFFmpegStatic();
    }
  }
  
  // Final check
  if (installSuccess && checkFFmpegAvailability()) {
    console.log('🎉 FFmpeg installation completed successfully!');
    
    // Test FFmpeg
    try {
      const version = execSync('ffmpeg -version', { encoding: 'utf8' });
      console.log('📋 FFmpeg version info:');
      console.log(version.split('\n')[0]); // First line contains version
    } catch (error) {
      console.warn('⚠️ Could not get FFmpeg version info');
    }
    
    process.exit(0);
  } else {
    console.error('❌ FFmpeg installation failed');
    console.error('💡 The application may not work properly without FFmpeg');
    console.error('🔧 Please install FFmpeg manually or contact support');
    
    // Don't exit with error in production to allow the app to start
    // The audio mixing will fall back to returning original audio
    if (isProduction) {
      console.log('⚠️ Continuing without FFmpeg in production mode');
      process.exit(0);
    } else {
      process.exit(1);
    }
  }
}

// Run the installation
main().catch(error => {
  console.error('❌ Unexpected error during FFmpeg installation:', error);
  
  if (isProduction) {
    console.log('⚠️ Continuing without FFmpeg in production mode');
    process.exit(0);
  } else {
    process.exit(1);
  }
}); 