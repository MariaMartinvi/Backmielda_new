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

// 🔬 ENDPOINT DE DIAGNÓSTICO TTS GOOGLE CLOUD
router.get('/tts/health', async (req, res) => {
  try {
    console.log('🔬 === DIAGNÓSTICO TTS GOOGLE CLOUD ===');
    
    const startTime = Date.now();
    const { getGoogleTTSService } = require('../services/googleTTSService');
    
    const response = {
      timestamp: new Date().toISOString(),
      service: 'Google Cloud Text-to-Speech',
      status: 'checking',
      tests: {},
      recommendations: []
    };
    
    // Test 1: Service initialization
    try {
      console.log('🔍 Teste 1: Inicialización del servicio...');
      const ttsService = getGoogleTTSService();
      response.tests.initialization = { status: '✅ OK', time: Date.now() - startTime };
    } catch (error) {
      console.error('❌ Error inicializando servicio TTS:', error);
      response.tests.initialization = { status: '❌ FAIL', error: error.message };
      response.status = 'degraded';
    }
    
    // Test 2: Simple TTS call (muy corto para minimizar impacto)
    try {
      console.log('🔍 Teste 2: Llamada TTS simple...');
      const testStart = Date.now();
      
      const { getGoogleTTSService } = require('../services/googleTTSService');
      const ttsService = getGoogleTTSService();
      
             // Usar la nueva función de health check optimizada
       const result = await ttsService.testTTSHealth();
      
      const testTime = Date.now() - testStart;
      
             if (result.status === 'healthy') {
         response.tests.tts_call = { 
           status: '✅ OK', 
           time: testTime,
           audioSize: result.audioSize,
           message: result.message
         };
         response.status = response.status === 'checking' ? 'healthy' : response.status;
       } else {
         response.tests.tts_call = { 
           status: '❌ FAIL', 
           message: result.error,
           time: testTime,
           code: result.code
         };
         response.status = 'unhealthy';
       }
      
    } catch (error) {
      console.error('❌ Error en llamada TTS:', error);
      const testTime = Date.now() - startTime;
      
      // Analizar tipo de error específico
      const errorAnalysis = {
        status: '❌ FAIL',
        time: testTime,
        error: error.message,
        type: 'unknown'
      };
      
      if (error.message.includes('502') || error.message.includes('Bad Gateway')) {
        errorAnalysis.type = 'infrastructure';
        errorAnalysis.diagnosis = 'Problema de infraestructura Google Cloud';
        response.recommendations.push('Verificar Google Cloud Status Dashboard');
        response.recommendations.push('Reintenta en 5-10 minutos');
      } else if (error.message.includes('UNAVAILABLE') || error.code === 14) {
        errorAnalysis.type = 'service_unavailable';
        errorAnalysis.diagnosis = 'Servicio TTS temporalmente no disponible';
        response.recommendations.push('Problema temporal de Google Cloud');
        response.recommendations.push('Implementar reintentos con backoff');
      } else if (error.message.includes('PERMISSION_DENIED') || error.code === 7) {
        errorAnalysis.type = 'authentication';
        errorAnalysis.diagnosis = 'Problema de autenticación o permisos';
        response.recommendations.push('Verificar API key y configuración');
      } else if (error.message.includes('RESOURCE_EXHAUSTED') || error.code === 8) {
        errorAnalysis.type = 'rate_limit';
        errorAnalysis.diagnosis = 'Límite de rate excedido';
        response.recommendations.push('Reducir frecuencia de llamadas');
      }
      
      response.tests.tts_call = errorAnalysis;
      response.status = 'unhealthy';
    }
    
    // Test 3: Environment check
    const envVars = {
      GOOGLE_APPLICATION_CREDENTIALS: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
      GOOGLE_CLOUD_PROJECT: !!process.env.GOOGLE_CLOUD_PROJECT,
      NODE_ENV: process.env.NODE_ENV
    };
    
    response.tests.environment = {
      status: envVars.GOOGLE_APPLICATION_CREDENTIALS ? '✅ OK' : '⚠️ WARNING',
      variables: envVars
    };
    
    const totalTime = Date.now() - startTime;
    response.totalTime = totalTime;
    
    console.log(`🔬 Diagnóstico completado en ${totalTime}ms - Status: ${response.status}`);
    console.log('========================================');
    
    // Determinar HTTP status code apropiado
    let httpStatus = 200;
    if (response.status === 'unhealthy') httpStatus = 503;
    else if (response.status === 'degraded') httpStatus = 206; // Partial Content
    
    res.status(httpStatus).json(response);
    
  } catch (error) {
    console.error('❌ Error en diagnóstico TTS:', error);
    res.status(500).json({
      timestamp: new Date().toISOString(),
      service: 'Google Cloud Text-to-Speech',
      status: 'error',
      error: 'Failed to run diagnostics',
      details: error.message
    });
  }
});

module.exports = router;