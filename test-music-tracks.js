// Test script to verify all background music tracks
const fs = require('fs').promises;
const path = require('path');
const { BACKGROUND_MUSIC_TRACKS } = require('./utils/audioMixer');

async function testMusicTracks() {
  try {
    console.log('Testing all background music tracks...');
    
    const BACKGROUND_MUSIC_DIR = path.join(__dirname, 'assets/background-music');
    
    console.log('Music tracks directory:', BACKGROUND_MUSIC_DIR);
    
    // First check if the directory exists
    try {
      await fs.access(BACKGROUND_MUSIC_DIR);
      console.log('✅ Background music directory exists');
    } catch (error) {
      console.error('❌ Background music directory does not exist:', error.message);
      console.log('Attempting to create directory...');
      try {
        await fs.mkdir(BACKGROUND_MUSIC_DIR, { recursive: true });
        console.log('✅ Directory created');
      } catch (mkdirError) {
        console.error('❌ Failed to create directory:', mkdirError.message);
        return;
      }
    }
    
    console.log('\nDefined music tracks in code:');
    console.log(JSON.stringify(BACKGROUND_MUSIC_TRACKS, null, 2));
    
    for (const [trackName, fileName] of Object.entries(BACKGROUND_MUSIC_TRACKS)) {
      const filePath = path.join(BACKGROUND_MUSIC_DIR, fileName);
      
      try {
        // Check if file exists
        await fs.access(filePath);
        const stats = await fs.stat(filePath);
        console.log(`✅ Track '${trackName}' - ${fileName} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
      } catch (error) {
        console.error(`❌ Track '${trackName}' - ${fileName} (ERROR: ${error.message})`);
      }
    }
    
    // Also list all the actual files in the directory
    console.log('\nActual files in music directory:');
    try {
      const files = await fs.readdir(BACKGROUND_MUSIC_DIR);
      if (files.length === 0) {
        console.log('⚠️ Directory is empty');
      }
      
      for (const file of files) {
        const filePath = path.join(BACKGROUND_MUSIC_DIR, file);
        const stats = await fs.stat(filePath);
        console.log(`- ${file} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
        
        // Check if this file is referenced in the BACKGROUND_MUSIC_TRACKS
        const isReferenced = Object.values(BACKGROUND_MUSIC_TRACKS).includes(file);
        if (!isReferenced) {
          console.log(`  ⚠️ This file is not referenced in the BACKGROUND_MUSIC_TRACKS object`);
        }
      }
    } catch (error) {
      console.error(`❌ Error reading directory: ${error.message}`);
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testMusicTracks()
  .then(() => console.log('✅ Test completed'))
  .catch(error => console.error('❌ Test failed:', error)); 