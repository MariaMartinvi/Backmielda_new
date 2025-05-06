const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Directory where background music files are stored
const BACKGROUND_MUSIC_DIR = path.join(__dirname, '../assets/background-music');

// Available background music tracks
const BACKGROUND_MUSIC_TRACKS = {
  'relaxing': 'relaxing-ambient.mp3',
  'magical': 'magic-forest-318165.mp3',
  'adventure': 'adventure-begins-148729.mp3',
  'bedtime': 'lullaby-baby-sleep-music-331777.mp3',
  'piano': 'lullaby-sleep-piano-music-285599.mp3',
  'magic-box': 'magic-music-box-333328.mp3',
  'forest': 'forest-lullaby-110624.mp3',
  'journey': 'magical-journey-150608.mp3'
};

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
 * Mix TTS audio with background music using a direct ffmpeg shell command
 * @param {string} ttsAudioBase64 - Base64 encoded TTS audio
 * @param {string} musicTrack - Background music track name or "random" for a random track
 * @param {number} musicVolume - Background music volume (0-1)
 * @returns {Promise<string>} - Base64 encoded mixed audio
 */
async function mixAudioWithBackground(ttsAudioBase64, musicTrack = 'random', musicVolume = 0.3) {
  try {
    console.log('--------------------------------------------------');
    console.log('🎵 STARTING AUDIO MIXING PROCESS 🎵');
    
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
    console.log('Temporary directory created/confirmed at:', tempDir);

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

    // Use direct ffmpeg command to mix audio
    console.log('🎛️ Starting FFmpeg process...');
    
    // Faster ffmpeg command with optimized settings
    const ffmpegCommand = `ffmpeg -y -i "${ttsAudioPath}" -i "${musicPath}" -filter_complex "[1:a]volume=${musicVolume}[m];[0:a][m]amix=inputs=2:dropout_transition=1" -c:a libmp3lame -q:a 4 -ac 2 "${outputPath}"`;
    
    console.log('🔧 FFmpeg command:', ffmpegCommand);
    
    try {
      // Set a timeout for the FFmpeg process (2 minutes)
      const { stdout, stderr } = await execPromise(ffmpegCommand, { timeout: 120000 });
      console.log('FFmpeg stderr:', stderr);
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

    // Clean up temporary files
    try {
      await Promise.all([
        fs.unlink(ttsAudioPath),
        fs.unlink(outputPath)
      ]);
      console.log('🧹 Temporary files cleaned up');
    } catch (cleanupError) {
      console.warn('⚠️ Warning: Could not clean up temporary files:', cleanupError);
      // Don't throw here, as we've already got the data
    }

    console.log('✅ AUDIO MIXING COMPLETE');
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
  BACKGROUND_MUSIC_TRACKS
}; 