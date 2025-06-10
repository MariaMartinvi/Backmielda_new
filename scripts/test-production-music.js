#!/usr/bin/env node

const { checkFFmpegAvailability, BACKGROUND_MUSIC_TRACKS } = require('../utils/audioMixer');
const fs = require('fs').promises;
const path = require('path');

async function testProductionMusic() {
  console.log('🎵 === PRODUCTION MUSIC TEST ===');
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('Platform:', process.platform);
  console.log('==============================');
  
  try {
    // Test FFmpeg availability
    console.log('🔍 Testing FFmpeg availability...');
    const ffmpegAvailable = await checkFFmpegAvailability();
    console.log(`FFmpeg status: ${ffmpegAvailable ? '✅ Available' : '❌ Not available'}`);
    
    // Test background music directory
    console.log('\n🎵 Testing background music files...');
    const backgroundMusicDir = path.join(__dirname, '../assets/background-music');
    
    try {
      await fs.access(backgroundMusicDir);
      console.log('✅ Background music directory exists');
      
      const files = await fs.readdir(backgroundMusicDir);
      const mp3Files = files.filter(file => file.toLowerCase().endsWith('.mp3'));
      console.log(`📂 Found ${mp3Files.length} MP3 files:`);
      
      for (const file of mp3Files) {
        const filePath = path.join(backgroundMusicDir, file);
        const stats = await fs.stat(filePath);
        console.log(`   - ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
      }
      
      // Test defined tracks
      console.log('\n🎯 Testing defined music tracks...');
      let validTracks = 0;
      for (const [trackName, fileName] of Object.entries(BACKGROUND_MUSIC_TRACKS)) {
        const filePath = path.join(backgroundMusicDir, fileName);
        try {
          await fs.access(filePath);
          console.log(`   ✅ ${trackName}: ${fileName}`);
          validTracks++;
        } catch (error) {
          console.log(`   ❌ ${trackName}: ${fileName} (Missing)`);
        }
      }
      
      console.log(`\n📊 Summary: ${validTracks}/${Object.keys(BACKGROUND_MUSIC_TRACKS).length} tracks available`);
      
    } catch (error) {
      console.log('❌ Background music directory not accessible:', error.message);
    }
    
    // Test audio mixing capability
    if (ffmpegAvailable) {
      console.log('\n🧪 Testing audio mixing capability...');
      try {
        // Create a simple test audio mixing
        const googleTtsService = require('../utils/googleTtsService');
        const { mixAudioWithBackground } = require('../utils/audioMixer');
        
        console.log('🎤 Generating test TTS audio...');
        const testText = 'This is a test.';
        const ttsAudio = await googleTtsService.synthesizeSpeech(testText, 'female', 1.0);
        
        console.log('🎵 Testing background music mixing...');
        const mixedAudio = await mixAudioWithBackground(ttsAudio, 'relaxing', 0.1);
        
        if (mixedAudio && mixedAudio.length > ttsAudio.length * 0.8) {
          console.log('✅ Audio mixing test successful');
        } else {
          console.log('⚠️ Audio mixing may have issues (output size unexpected)');
        }
        
      } catch (error) {
        console.log('❌ Audio mixing test failed:', error.message);
      }
    }
    
    // Final assessment
    console.log('\n🎯 === FINAL ASSESSMENT ===');
    if (ffmpegAvailable) {
      console.log('✅ Background music should work in production');
    } else {
      console.log('❌ Background music will be disabled in production');
      console.log('💡 Audio generation will still work, but without background music');
    }
    console.log('===========================');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testProductionMusic().then(() => {
  console.log('🏁 Test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed with error:', error);
  process.exit(1);
}); 