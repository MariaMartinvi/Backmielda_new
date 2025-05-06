// Test script for audio mixer
const fs = require('fs').promises;
const path = require('path');
const { mixAudioWithBackground } = require('./utils/audioMixer');

async function testAudioMixing() {
  console.log('Starting audio mixer test...');
  
  try {
    // Path to a sample audio file (should be replaced with a real file in your system)
    const sampleAudioPath = path.join(__dirname, 'test-audio.mp3');
    
    // Check if we have a test audio file
    try {
      await fs.access(sampleAudioPath);
      console.log('Test audio file found:', sampleAudioPath);
    } catch (error) {
      console.error('Test audio file not found. Please create a test-audio.mp3 file in the project root.');
      console.error('Error:', error);
      return;
    }
    
    // Read the sample audio file
    const audioData = await fs.readFile(sampleAudioPath);
    const audioBase64 = audioData.toString('base64');
    console.log('Sample audio loaded, base64 length:', audioBase64.length);
    
    // Test mixing with each music track
    const musicTracks = ['relaxing', 'magical', 'adventure', 'bedtime'];
    
    for (const track of musicTracks) {
      console.log(`\nTesting with "${track}" music track...`);
      
      // Mix audio with background music
      const mixedAudioBase64 = await mixAudioWithBackground(audioBase64, track, 0.4);
      
      // Save the mixed audio to a file
      const outputPath = path.join(__dirname, `test-output-${track}.mp3`);
      await fs.writeFile(outputPath, Buffer.from(mixedAudioBase64, 'base64'));
      
      console.log(`Mixed audio saved to: ${outputPath}`);
    }
    
    console.log('\nAll tests completed successfully!');
    console.log('Please check the generated test-output-*.mp3 files in the project root.');
    
  } catch (error) {
    console.error('Error in test:', error);
  }
}

// Run the test
testAudioMixing().catch(console.error); 