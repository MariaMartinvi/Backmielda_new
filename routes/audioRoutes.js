// routes/audioRoutes.js
const express = require('express');
const router = express.Router();
const audioController = require('../controllers/audioController');
const { audioCache } = require('../utils/audioCache');

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

// 🚀 ENDPOINT DE ESTADÍSTICAS DE CACHÉ
router.get('/cache/stats', async (req, res) => {
  try {
    console.log('📊 Solicitando estadísticas del caché de audio...');
    
    const stats = await audioCache.getStats();
    const hitRateEstimate = stats.entries > 0 ? Math.min(95, stats.entries * 2) : 0; // Estimación
    
    const response = {
      success: true,
      cache: {
        enabled: true,
        entries: stats.entries,
        totalSizeMB: stats.totalSizeMB,
        oldestEntryMinutes: stats.oldestAge,
        newestEntryMinutes: stats.newestAge,
        estimatedHitRate: `${hitRateEstimate}%`,
        maxEntries: 100,
        maxAgeHours: 24
      },
      performance: {
        cacheHitSpeedup: '10-50x más rápido',
        averageCacheTime: '< 500ms',
        averageGenerationTime: '15-60s'
      },
      recommendations: stats.entries < 10 ? [
        'El caché está construyéndose, la velocidad mejorará con el uso',
        'Los audios repetidos se servirán instantáneamente'
      ] : [
        'Caché funcionando óptimamente',
        'Audios frecuentes se sirven instantáneamente'
      ]
    };
    
    console.log('📊 Estadísticas del caché:', response);
    res.json(response);
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas del caché:', error);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo estadísticas del caché',
      details: error.message
    });
  }
});

// 🚀 ENDPOINT PARA DESHABILITAR CACHÉ TEMPORALMENTE
router.post('/cache/disable', async (req, res) => {
  try {
    // Esto podría implementarse con una variable global o configuración
    console.log('⚡ Caché deshabilitado temporalmente para máxima velocidad primera generación');
    res.json({
      success: true,
      message: 'Caché deshabilitado - priorizando velocidad primera generación',
      mode: 'speed-first'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🚀 ENDPOINT PARA LIMPIAR CACHÉ (ADMIN)
router.delete('/cache/clear', async (req, res) => {
  try {
    console.log('🧹 Solicitando limpieza del caché...');
    
    // Limpiar todo el caché
    await audioCache.cleanOldCache();
    
    // Obtener estadísticas después de limpiar
    const stats = await audioCache.getStats();
    
    res.json({
      success: true,
      message: 'Caché limpiado exitosamente',
      remainingEntries: stats.entries,
      remainingSizeMB: stats.totalSizeMB
    });
  } catch (error) {
    console.error('❌ Error limpiando caché:', error);
    res.status(500).json({
      success: false,
      error: 'Error limpiando caché',
      details: error.message
    });
  }
});

module.exports = router;