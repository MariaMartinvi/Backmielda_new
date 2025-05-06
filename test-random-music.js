// Test script for random music selection
const fs = require('fs').promises;
const path = require('path');
const { getRandomMusicTrack, BACKGROUND_MUSIC_TRACKS } = require('./utils/audioMixer');

async function testRandomMusicSelection() {
  console.log('Testing random music selection...');
  
  console.log('Available music tracks:');
  for (const [track, file] of Object.entries(BACKGROUND_MUSIC_TRACKS)) {
    console.log(`- ${track}: ${file}`);
  }
  
  // Test getting random tracks multiple times to see the distribution
  const numSelections = 20; // Increase number of selections for better distribution
  console.log(`\nSelecting ${numSelections} random tracks:`);
  
  const results = {};
  
  for (let i = 0; i < numSelections; i++) {
    try {
      const randomTrack = await getRandomMusicTrack();
      console.log(`Selection ${i+1}: ${randomTrack} -> ${BACKGROUND_MUSIC_TRACKS[randomTrack]}`);
      
      // Count occurrences for distribution
      results[randomTrack] = (results[randomTrack] || 0) + 1;
    } catch (error) {
      console.error(`Error selecting random track: ${error.message}`);
    }
  }
  
  console.log('\nDistribution of random selections:');
  for (const [track, count] of Object.entries(results)) {
    const percentage = (count / numSelections * 100).toFixed(1);
    console.log(`- ${track}: ${count} times (${percentage}%)`);
  }
  
  console.log('\nTest completed!');
}

// Run the test
testRandomMusicSelection().catch(error => {
  console.error('Test failed:', error);
}); 