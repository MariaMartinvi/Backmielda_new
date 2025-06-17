const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const { promisify } = require('util');
const FFMPEG_PATHS = require('../config/ffmpeg');

const execPromise = promisify(exec);

// Directory where background music files are stored
const BACKGROUND_MUSIC_DIR = path.join(__dirname, '../assets/background-music');

// Cache for FFmpeg availability check
let ffmpegAvailable = null;

/**
 * Reset FFmpeg availability cache - useful for troubleshooting
 */
function resetFFmpegCache() {
  console.log('🔄 Resetting FFmpeg availability cache...');
  ffmpegAvailable = null;
}

// Available background music tracks
const BACKGROUND_MUSIC_TRACKS = {
  'relaxing': 'relaxing-ambient.mp3',
  'magical': 'magic-forest-318165.mp3',
  'adventure': 'adventure-begins-148729.mp3',
  'bedtime': 'lullaby-baby-sleep-music-331777.mp3',
  'piano': 'lullaby-sleep-piano-music-285599.mp3',
  'magic-box': 'magic-music-box-333328.mp3',
  'forest': 'forest-lullaby-110624.mp3',
  'journey': 'magical-journey-150608.mp3',
  // Additional tracks found in directory
  'quiet-sleep': 'quiet-sleep-2-263254.mp3',
  'meditation': 'meditation-relaxing-music-320396.mp3',
  'calm': 'please-calm-my-mind-125566.mp3',
  'inventors': 'tiny-inventors_57sec-329139.mp3',
  'just-relax': 'just-relax-11157.mp3'
};

/**
 * Check if FFmpeg is available and working
 * @returns {Promise<boolean>} True if FFmpeg is available
 */
async function checkFFmpegAvailability() {
  // Return cached result if available
  if (ffmpegAvailable !== null) {
    console.log(`🔄 Using cached FFmpeg availability result: ${ffmpegAvailable}`);
    return ffmpegAvailable;
  }
  
  try {
    console.log('🔍 Checking FFmpeg availability...');
    console.log('🔧 FFmpeg path:', FFMPEG_PATHS.ffmpeg);
    console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
    console.log('🖥️ Platform:', process.platform);
    
    // Test FFmpeg with a simple command
    const { stdout } = await execPromise(`"${FFMPEG_PATHS.ffmpeg}" -version`, { timeout: 10000 });
    
    if (stdout.includes('ffmpeg version')) {
      console.log('✅ FFmpeg is available and working');
      console.log('📋 FFmpeg version info:', stdout.split('\n')[0]);
      ffmpegAvailable = true;
      return true;
    } else {
      console.log('❌ FFmpeg version check failed - unexpected output');
      console.log('📋 Stdout:', stdout);
      ffmpegAvailable = false;
      return false;
    }
  } catch (error) {
    console.error('❌ FFmpeg is not available:', error.message);
    console.log('📋 Full error details:', error);
    
    // Enhanced logging for production environments
    if (process.env.NODE_ENV === 'production') {
      console.log('🏭 Production environment detected - FFmpeg may not be installed');
      console.log('💡 This means audio will be generated without background music');
      console.log('💡 To enable background music, install FFmpeg on the server');
      console.log('🔧 Checking if FFmpeg installation script was run...');
      
      // Try alternative paths in case FFmpeg is installed but not in PATH
      const alternativePaths = [
        '/usr/bin/ffmpeg',
        '/usr/local/bin/ffmpeg',
        '/snap/bin/ffmpeg'
      ];
      
      for (const altPath of alternativePaths) {
        try {
          const { stdout: altStdout } = await execPromise(`"${altPath}" -version`, { timeout: 5000 });
          if (altStdout.includes('ffmpeg version')) {
            console.log(`✅ Found FFmpeg at alternative path: ${altPath}`);
            console.log('🔧 Updating FFmpeg path configuration...');
            FFMPEG_PATHS.ffmpeg = altPath;
            FFMPEG_PATHS.ffprobe = altPath.replace('ffmpeg', 'ffprobe');
            ffmpegAvailable = true;
            return true;
          }
        } catch (altError) {
          console.log(`❌ FFmpeg not found at ${altPath}`);
        }
      }
    }
    
    console.log('⚠️ Audio mixing will be disabled - returning original TTS audio only');
    ffmpegAvailable = false;
    return false;
  }
}

/**
 * Selects a random background music track
 * @returns {Promise<string>} Name of the randomly selected track
 */
async function getRandomMusicTrack() {
  try {
    // Get list of all files in the background music directory
    const files = await fs.readdir(BACKGROUND_MUSIC_DIR);
    
    // Filter to make sure we only get .mp3 files
    const mp3Files = files.filter(file => file.toLowerCase().endsWith('.mp3'));
    
    if (mp3Files.length === 0) {
      console.log('No music files found, falling back to hardcoded tracks');
      // If no files in directory, fall back to our defined tracks
      const trackNames = Object.keys(BACKGROUND_MUSIC_TRACKS);
      const randomIndex = Math.floor(Math.random() * trackNames.length);
      return trackNames[randomIndex];
    }
    
    // Find the track name for this file
    const randomFile = mp3Files[Math.floor(Math.random() * mp3Files.length)];
    
    // Find if this random file has a track name in our mapping
    for (const [trackName, fileName] of Object.entries(BACKGROUND_MUSIC_TRACKS)) {
      if (fileName === randomFile) {
        return trackName;
      }
    }
    
    // If no track name was found, we'll create a custom entry
    // This is for the case where there are mp3 files in the directory that aren't in our mapping
    BACKGROUND_MUSIC_TRACKS['random'] = randomFile;
    return 'random';
  } catch (error) {
    console.error('Error selecting random music track:', error);
    // Fall back to relaxing track in case of error
    return 'relaxing';
  }
}

/**
 * NUEVO: Preparar música de fondo en paralelo mientras se genera TTS
 * @param {string} musicTrack - Background music track name or "random" for a random track
 * @returns {Promise<object>} - Prepared music info
 */
async function prepareMusicTrack(musicTrack = 'random') {
  console.log('🎵 PREPARANDO MÚSICA EN PARALELO...');
  console.log(`🎶 Track solicitado: ${musicTrack}`);
  
  try {
    // Check if FFmpeg is available
    const ffmpegIsAvailable = await checkFFmpegAvailability();
    if (!ffmpegIsAvailable) {
      console.log('⚠️ FFmpeg no disponible - mixing deshabilitado');
      return { available: false, reason: 'ffmpeg_unavailable' };
    }
    
    // Handle special case
    if (musicTrack === 'none') {
      console.log('🔇 No se requiere música de fondo');
      return { available: false, reason: 'no_music_requested' };
    }
    
    // If musicTrack is 'random', pick a random track
    if (musicTrack === 'random') {
      musicTrack = await getRandomMusicTrack();
      console.log('🎲 Track aleatorio seleccionado:', musicTrack);
    }
    
    // Validate music file exists
    const musicPath = path.join(BACKGROUND_MUSIC_DIR, BACKGROUND_MUSIC_TRACKS[musicTrack]);
    
    try {
      await fs.access(musicPath);
      console.log('✅ Archivo de música validado:', musicPath);
    } catch (error) {
      console.error('❌ Archivo de música no encontrado:', musicPath);
      return { available: false, reason: 'music_file_not_found', track: musicTrack };
    }
    
    // Create temporary directory if needed
    const tempDir = path.join(__dirname, '../temp');
    await fs.mkdir(tempDir, { recursive: true });
    
    console.log('✅ Preparación de música completada');
    return {
      available: true,
      track: musicTrack,
      musicPath: musicPath,
      tempDir: tempDir,
      ffmpegAvailable: true
    };
    
  } catch (error) {
    console.error('❌ Error preparando música:', error);
    return { available: false, reason: 'preparation_error', error: error.message };
  }
}

/**
 * NUEVO: Mixing optimizado con música pre-preparada
 * @param {string} ttsAudioBase64 - Base64 encoded TTS audio
 * @param {object} preparedMusic - Prepared music info from prepareMusicTrack()
 * @param {number} musicVolume - Background music volume (0-1)
 * @returns {Promise<string>} - Base64 encoded mixed audio
 */
async function mixWithPreparedMusic(ttsAudioBase64, preparedMusic, musicVolume = 0.1) {
  try {
    console.log('--------------------------------------------------');
    console.log('🚀 MIXING CON MÚSICA PRE-PREPARADA 🚀');
    console.log(`🎶 Track: ${preparedMusic.track}`);
    console.log(`🔊 Volumen: ${musicVolume}`);
    
    const startTime = Date.now();
    
    // Check if music is available
    if (!preparedMusic.available) {
      console.log(`⚠️ Música no disponible: ${preparedMusic.reason}`);
      console.log('--------------------------------------------------');
      return ttsAudioBase64;
    }
    
    console.log('TTS audio length (base64):', ttsAudioBase64.length);

    // Generate unique filenames
    const timestamp = Date.now();
    const ttsAudioPath = path.join(preparedMusic.tempDir, `tts-${timestamp}.mp3`);
    const outputPath = path.join(preparedMusic.tempDir, `mixed-${timestamp}.mp3`);

    console.log('Paths:');
    console.log('- TTS audio file:', ttsAudioPath);
    console.log('- Music file:', preparedMusic.musicPath);
    console.log('- Output file:', outputPath);

    // Write TTS audio to temporary file
    const ttsAudioBuffer = Buffer.from(ttsAudioBase64, 'base64');
    await fs.writeFile(ttsAudioPath, ttsAudioBuffer);
    console.log(`✅ TTS audio escrito (${ttsAudioBuffer.length} bytes)`);

    // OPTIMIZED FFmpeg command (ya validado en preparación)
    console.log('🚀 Ejecutando mixing optimizado...');
    
    // ULTRA-SPEED: Máxima velocidad sacrificando calidad
    const ffmpegCommand = `"${FFMPEG_PATHS.ffmpeg}" -y ` +
      `-i "${ttsAudioPath}" ` +
      `-stream_loop -1 -i "${preparedMusic.musicPath}" ` +
      `-filter_complex "` +
        `[1:a]volume=${musicVolume}[m];` +
        `[0:a][m]amix=inputs=2:dropout_transition=0:duration=first` +
      `" ` +
      `-c:a libmp3lame -preset fast -b:a 96k -ac 2 ` + // EQUILIBRADO: buena calidad para Chirp3 HD, velocidad optimizada
      `"${outputPath}"`;
    
    console.log('🔧 Comando FFmpeg ULTRA-OPTIMIZADO:', ffmpegCommand);
    
          try {
        const { stdout, stderr } = await execPromise(ffmpegCommand, { 
          timeout: 60000, // REDUCIDO: de 3min a 1min máximo para mixing
          maxBuffer: 1024 * 1024 * 20 // REDUCIDO: buffer más pequeño para archivos más pequeños
        });
      
      if (stderr) {
        console.log('FFmpeg stderr:', stderr);
      }
      console.log('✅ FFmpeg completado exitosamente');
    } catch (error) {
      console.error('❌ Error FFmpeg:', error);
      console.log('⚠️ Devolviendo audio original');
      return ttsAudioBase64;
    }

    // Read mixed audio
    const mixedAudio = await fs.readFile(outputPath);
    console.log('📊 Audio mezclado:', mixedAudio.length, 'bytes');
    
    const mixedAudioBase64 = mixedAudio.toString('base64');

    // Cleanup async
    const cleanupPromises = [
      fs.unlink(ttsAudioPath).catch(() => {}),
      fs.unlink(outputPath).catch(() => {})
    ];
    
    Promise.all(cleanupPromises).then(() => {
      console.log('🧹 Archivos temporales limpiados');
    }).catch(() => {});

    const totalTime = Date.now() - startTime;
    console.log(`✅ MIXING OPTIMIZADO COMPLETADO en ${totalTime}ms`);
    console.log('--------------------------------------------------');
    return mixedAudioBase64;
  } catch (error) {
    console.error('❌ ERROR EN MIXING OPTIMIZADO:', error);
    console.log('--------------------------------------------------');
    return ttsAudioBase64;
  }
}

/**
 * OPTIMIZED VERSION - Mix TTS audio with background music using faster techniques
 * @param {string} ttsAudioBase64 - Base64 encoded TTS audio
 * @param {string} musicTrack - Background music track name or "random" for a random track
 * @param {number} musicVolume - Background music volume (0-1)
 * @returns {Promise<string>} - Base64 encoded mixed audio
 */
async function mixAudioWithBackground(ttsAudioBase64, musicTrack = 'random', musicVolume = 0.1) {
  try {
    console.log('--------------------------------------------------');
    console.log('🎵 STARTING OPTIMIZED AUDIO MIXING PROCESS 🎵');
    console.log(`🎶 Requested music track: ${musicTrack}`);
    console.log(`🔊 Requested volume: ${musicVolume}`);
    
    const startTime = Date.now();
    
    // Verificación explícita para "none" - no mezclar con música
    if (musicTrack === 'none') {
      console.log('🔇 No background music requested (musicTrack === "none")');
      console.log('--------------------------------------------------');
      return ttsAudioBase64;
    }
    
    // Check if FFmpeg is available before proceeding
    const ffmpegIsAvailable = await checkFFmpegAvailability();
    if (!ffmpegIsAvailable) {
      console.log('🚨 ATTENTION: FFmpeg not available on this server!');
      console.log('📝 The audio will be generated WITHOUT background music');
      console.log('🔧 To enable background music, install FFmpeg on the server');
      console.log('⚠️ Returning original TTS audio without background music');
      console.log('--------------------------------------------------');
      return ttsAudioBase64;
    }
    
    // If musicTrack is 'random', pick a random track
    if (musicTrack === 'random') {
      musicTrack = await getRandomMusicTrack();
      console.log('🎲 Randomly selected music track:', musicTrack);
    }
    
    console.log('Selected music track:', musicTrack);
    console.log('Music volume:', musicVolume);
    console.log('TTS audio length (base64):', ttsAudioBase64.length);

    // Create temporary directory if it doesn't exist
    const tempDir = path.join(__dirname, '../temp');
    await fs.mkdir(tempDir, { recursive: true });

    // Generate unique filenames
    const timestamp = Date.now();
    const ttsAudioPath = path.join(tempDir, `tts-${timestamp}.mp3`);
    const musicPath = path.join(BACKGROUND_MUSIC_DIR, BACKGROUND_MUSIC_TRACKS[musicTrack]);
    const outputPath = path.join(tempDir, `mixed-${timestamp}.mp3`);

    console.log('Paths:');
    console.log('- TTS audio file:', ttsAudioPath);
    console.log('- Music file:', musicPath);
    console.log('- Output file:', outputPath);
    
    // Verify music file exists
    try {
      await fs.access(musicPath);
      console.log('✅ Music file exists and is accessible');
    } catch (error) {
      console.error('❌ Music file not found or not accessible:', musicPath);
      throw new Error(`Background music file not found: ${BACKGROUND_MUSIC_TRACKS[musicTrack]}`);
    }

    // Write TTS audio to temporary file
    const ttsAudioBuffer = Buffer.from(ttsAudioBase64, 'base64');
    await fs.writeFile(ttsAudioPath, ttsAudioBuffer);
    console.log(`✅ TTS audio written to temporary file (${ttsAudioBuffer.length} bytes)`);

    // OPTIMIZATION 1: Use single FFmpeg command with stream_loop to avoid creating temporary looped file
    // This eliminates the need to detect durations and create intermediate files
    console.log('🚀 Using optimized single-pass FFmpeg mixing...');
    
    // Optimized FFmpeg command that:
    // 1. Loops the background music automatically to match TTS duration
    // 2. Mixes in a single pass
    // 3. Uses faster encoding settings
    const ffmpegCommand = `"${FFMPEG_PATHS.ffmpeg}" -y ` +
      `-i "${ttsAudioPath}" ` +
      `-stream_loop -1 -i "${musicPath}" ` +
      `-filter_complex "` +
        `[1:a]volume=${musicVolume}[m];` +
        `[0:a][m]amix=inputs=2:dropout_transition=0:duration=first` +
      `" ` +
      `-c:a libmp3lame -preset fast -b:a 96k -ac 2 ` + // EQUILIBRADO: buena calidad para Chirp3 HD, velocidad optimizada
      `"${outputPath}"`;
    
    console.log('🔧 Ultra-Fast FFmpeg command:', ffmpegCommand);
    
          try {
        // Ultra-fast operation with aggressive timeouts
        const { stdout, stderr } = await execPromise(ffmpegCommand, { 
          timeout: 60000, // AGRESIVO: máximo 1 minuto para mixing
          maxBuffer: 1024 * 1024 * 20 // REDUCIDO: buffer más pequeño
        });
      
      if (stderr) {
        console.log('FFmpeg stderr:', stderr);
      }
      console.log('✅ FFmpeg process completed successfully');
    } catch (error) {
      console.error('❌ FFmpeg process error:', error);
      // Don't throw here, just log the error and continue with original audio
      console.log('⚠️ Returning original audio due to mixing error');
      return ttsAudioBase64;
    }

    // Verify the output file exists and has content
    let stats;
    try {
      stats = await fs.stat(outputPath);
      console.log('📊 Output file size:', stats.size, 'bytes');
      
      if (stats.size === 0) {
        throw new Error('Generated mixed audio file is empty');
      }
    } catch (error) {
      console.error('❌ Error checking output file:', error);
      throw error;
    }

    // Read the mixed audio file
    const mixedAudio = await fs.readFile(outputPath);
    console.log('📊 Mixed audio file size:', mixedAudio.length, 'bytes');
    
    const mixedAudioBase64 = mixedAudio.toString('base64');
    console.log('📊 Mixed audio converted to base64, length:', mixedAudioBase64.length);

    // Clean up temporary files (async for speed)
    const cleanupPromises = [
      fs.unlink(ttsAudioPath).catch(() => {}),
      fs.unlink(outputPath).catch(() => {})
    ];
    
    // Don't wait for cleanup to complete
    Promise.all(cleanupPromises).then(() => {
      console.log('🧹 Temporary files cleaned up');
    }).catch(cleanupError => {
      console.warn('⚠️ Warning: Could not clean up temporary files:', cleanupError);
    });

    const totalTime = Date.now() - startTime;
    console.log(`✅ OPTIMIZED AUDIO MIXING COMPLETE in ${totalTime}ms`);
    console.log('--------------------------------------------------');
    return mixedAudioBase64;
  } catch (error) {
    console.error('❌ ERROR IN AUDIO MIXING:', error);
    console.error('Stack trace:', error.stack);
    console.log('--------------------------------------------------');
    // In case of error, return the original audio
    return ttsAudioBase64;
  }
}

module.exports = {
  mixAudioWithBackground,
  getRandomMusicTrack,
  checkFFmpegAvailability,
  resetFFmpegCache,
  BACKGROUND_MUSIC_TRACKS,
  prepareMusicTrack,
  mixWithPreparedMusic
}; 