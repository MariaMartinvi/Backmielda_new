const path = require('path');

// Detect environment and platform
const isProduction = process.env.NODE_ENV === 'production';
const isWindows = process.platform === 'win32';

let FFMPEG_PATHS;

if (isProduction || !isWindows) {
  // Production environment (Linux/Render) - use system FFmpeg
  console.log('🐧 Using system FFmpeg (Linux/Production environment)');
  FFMPEG_PATHS = {
    ffmpeg: 'ffmpeg',
    ffprobe: 'ffprobe',
    ffplay: 'ffplay'
  };
} else {
  // Development environment (Windows) - use local FFmpeg binaries
  console.log('🪟 Using local FFmpeg binaries (Windows/Development environment)');
  const FFMPEG_DIR = path.join(__dirname, '../ffmpeg-master-latest-win64-gpl/bin');
  FFMPEG_PATHS = {
    ffmpeg: path.join(FFMPEG_DIR, 'ffmpeg.exe'),
    ffprobe: path.join(FFMPEG_DIR, 'ffprobe.exe'),
    ffplay: path.join(FFMPEG_DIR, 'ffplay.exe')
  };
}

console.log('🔧 FFmpeg configuration:', FFMPEG_PATHS);

module.exports = FFMPEG_PATHS; 