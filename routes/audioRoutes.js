// routes/audioRoutes.js
const express = require('express');
const router = express.Router();
const audioController = require('../controllers/audioController');

// Generate audio from text
router.post('/generate', audioController.generateAudio);

// Test endpoint for pause functionality
router.post('/test-pauses', audioController.testPauses);

// Get available background music tracks
router.get('/background-music', audioController.getBackgroundMusicTracks);

// Test pauses (legacy endpoint)
router.post('/test-pauses', audioController.testPauses);

// New: Test FFmpeg and background music status
router.get('/ffmpeg-status', async (req, res) => {
  try {
    const { checkFFmpegAvailability, BACKGROUND_MUSIC_TRACKS } = require('../utils/audioMixer');
    const fs = require('fs').promises;
    const path = require('path');
    
    console.log('🔍 === FFMPEG STATUS CHECK ===');
    
    // Check FFmpeg availability
    const ffmpegAvailable = await checkFFmpegAvailability();
    
    // Check background music directory
    const backgroundMusicDir = path.join(__dirname, '../assets/background-music');
    let musicFiles = [];
    let musicDirExists = false;
    
    try {
      await fs.access(backgroundMusicDir);
      musicDirExists = true;
      musicFiles = await fs.readdir(backgroundMusicDir);
      musicFiles = musicFiles.filter(file => file.toLowerCase().endsWith('.mp3'));
    } catch (error) {
      console.error('❌ Background music directory not accessible:', error.message);
    }
    
    // Check which defined tracks actually exist
    const trackStatus = {};
    for (const [trackName, fileName] of Object.entries(BACKGROUND_MUSIC_TRACKS)) {
      const filePath = path.join(backgroundMusicDir, fileName);
      try {
        await fs.access(filePath);
        trackStatus[trackName] = { exists: true, fileName };
      } catch (error) {
        trackStatus[trackName] = { exists: false, fileName, error: 'File not found' };
      }
    }
    
    const response = {
      ffmpeg: {
        available: ffmpegAvailable,
        version: ffmpegAvailable ? 'Available' : 'Not available'
      },
      backgroundMusic: {
        directoryExists: musicDirExists,
        directoryPath: backgroundMusicDir,
        availableFiles: musicFiles,
        definedTracks: trackStatus,
        totalDefinedTracks: Object.keys(BACKGROUND_MUSIC_TRACKS).length,
        totalAvailableFiles: musicFiles.length
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        platform: process.platform
      },
      status: ffmpegAvailable && musicDirExists ? 'ready' : 'degraded'
    };
    
    console.log('📊 FFmpeg status:', ffmpegAvailable ? '✅ Available' : '❌ Not available');
    console.log('📊 Background music:', musicDirExists ? `✅ ${musicFiles.length} files` : '❌ Directory not found');
    console.log('===============================');
    
    res.json(response);
  } catch (error) {
    console.error('❌ Error checking FFmpeg status:', error);
    res.status(500).json({
      error: 'Failed to check FFmpeg status',
      details: error.message
    });
  }
});

module.exports = router;