// Test script to verify audio mixing with the relaxing track
const fs = require('fs').promises;
const path = require('path');
const { mixAudioWithBackground } = require('./utils/audioMixer');

// Simple function to generate a placeholder base64 audio
// In a real scenario, this would be audio data from the TTS service
function generatePlaceholderAudio() {
  // Return a string of length 1000 representing base64 data
  return 'A'.repeat(1000);
}

async function testAudioMixing() {
  try {
    console.log('Testing audio mixing with the relaxing track...');
    
    // Generate placeholder audio
    const placeholderAudio = generatePlaceholderAudio();
    console.log(`Generated placeholder audio (length: ${placeholderAudio.length})`);
    
    // Try to mix with the relaxing track
    console.log('Attempting to mix with the relaxing track...');
    await mixAudioWithBackground(placeholderAudio, 'relaxing', 0.3);
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error in audio mixing test:', error);
  }
}

// Run the test
testAudioMixing().catch(console.error); 