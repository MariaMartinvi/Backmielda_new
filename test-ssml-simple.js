const { synthesizeSpeech } = require('./utils/googleTtsService');

async function testSimpleSSML() {
  console.log("🧪 Testing simplified SSML for Neural2 voices");
  
  const testText = "Había una vez una niña llamada Sofía. Ella vivía en una casa pequeña, pero muy bonita. ¿Te gustaría conocer su historia?";
  
  try {
    console.log("Testing with female Neural2 voice...");
    const audioContent = await synthesizeSpeech(testText, 'female', 1.0);
    
    if (audioContent) {
      console.log("✅ SSML test successful! Audio generated.");
      console.log("Audio content length:", audioContent.length);
    } else {
      console.log("❌ No audio content received");
    }
    
  } catch (error) {
    console.error("❌ SSML test failed:", error.message);
  }
}

testSimpleSSML(); 