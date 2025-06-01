const path = require('path');

// Define the path to the local FFmpeg installation
const FFMPEG_DIR = path.join(__dirname, '../ffmpeg-master-latest-win64-gpl/bin');

const FFMPEG_PATHS = {
  ffmpeg: path.join(FFMPEG_DIR, 'ffmpeg.exe'),
  ffprobe: path.join(FFMPEG_DIR, 'ffprobe.exe'),
  ffplay: path.join(FFMPEG_DIR, 'ffplay.exe')
};

module.exports = FFMPEG_PATHS; 