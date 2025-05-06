// Test script to verify audio generation with random background music
const fs = require('fs').promises;
const path = require('path');
const { mixAudioWithBackground } = require('./utils/audioMixer');

// Simple function to generate a placeholder base64 audio
// In a real scenario, this would come from the TTS service
function generatePlaceholderAudio() {
  // Create a small buffer with repeating pattern (not real audio, but works for testing)
  const buffer = Buffer.alloc(1000);
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] = i % 256; // Simple repeating pattern
  }
  return buffer.toString('base64');
}

async function testAudioWithRandomMusic() {
  try {
    console.log('Testing audio generation with random background music...\n');
    
    // Generate placeholder audio
    const placeholderAudio = generatePlaceholderAudio();
    console.log(`Generated placeholder audio (length: ${placeholderAudio.length})\n`);
    
    // Try to mix with a random track
    console.log('Attempting to mix with a random music track...');
    const mixedAudio = await mixAudioWithBackground(placeholderAudio, 'random', 0.3);
    
    if (mixedAudio && mixedAudio.length > 0) {
      console.log(`\nMixed audio generated successfully (length: ${mixedAudio.length})`);
      
      // Save the mixed audio to a file for verification
      const outputPath = path.join(__dirname, 'test-random-music-output.mp3');
      await fs.writeFile(outputPath, Buffer.from(mixedAudio, 'base64'));
      console.log(`\nOutput saved to: ${outputPath}`);
    } else {
      console.error('Failed to generate mixed audio');
    }
  } catch (error) {
    console.error('Error in audio mixing test:', error);
  }
}

// Run the test
testAudioWithRandomMusic()
  .then(() => console.log('\nTest completed successfully!'))
  .catch(error => console.error('\nTest failed:', error)); 