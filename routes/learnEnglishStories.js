// learnEnglishStories.js
// Rutas para el sistema "Learn English" - VERSIÓN SIMPLE QUE FUNCIONA

const express = require('express');
const router = express.Router();
const { fiveFromEarthStories, getStory, getAllStoriesMetadata } = require('../data/fiveFromEarthStories');
const { admin } = require('../config/firebase');
const { synthesizeSpeech } = require('../utils/googleTtsService');

// Lazy loading del bucket
let bucket = null;
const getFirebaseStorageBucket = () => {
  if (!bucket) {
    bucket = admin.storage().bucket();
  }
  return bucket;
};

// ========================================
// HELPER FUNCTIONS
// ========================================

function getVocabSuffix(userLanguage) {
  const SUPPORTED_LANGUAGES = ['es', 'fr'];
  if (SUPPORTED_LANGUAGES.includes(userLanguage)) {
    return userLanguage;
  }
  return 'generic';
}

function generateVocabularyAudioText(vocabularyIntro, userLanguage = 'es') {
  let text = '';
  const SUPPORTED_LANGUAGES = ['es', 'fr'];
  let effectiveLanguage = SUPPORTED_LANGUAGES.includes(userLanguage) ? userLanguage : 'en';

  vocabularyIntro.words.forEach((word, index) => {
    let wordToUse;
    if (effectiveLanguage === 'en') {
      wordToUse = `${word.en}... ${word.en}... ${word.en}... ${word.en}...`;
    } else {
      const nativeWord = word[effectiveLanguage];
      wordToUse = `${nativeWord}... ${word.en}... ${word.en}... ${word.en}...`;
    }
    text += wordToUse + '\n\n';
    if (index < vocabularyIntro.words.length - 1) {
      text += '\n';
    }
  });
  
  return text;
}

// Subir audio a Firebase Storage (MÉTODO SIMPLE QUE FUNCIONA)
async function uploadAudioToStorage(audioBuffer, fileName) {
  const bucket = getFirebaseStorageBucket();
  const file = bucket.file(`learn-english-audio/${fileName}`);
  
  // CRÍTICO: audioBuffer viene en base64 desde Google TTS, hay que decodificarlo
  const binaryBuffer = Buffer.isBuffer(audioBuffer) 
    ? audioBuffer 
    : Buffer.from(audioBuffer, 'base64');
  
  await file.save(binaryBuffer, {
    metadata: {
      contentType: 'audio/mpeg',
    },
  });
  
  await file.makePublic();
  
  // Generar URL pública correcta para Firebase Storage
  const encodedPath = encodeURIComponent(file.name);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;
}

// Verificar si un archivo existe
async function fileExists(fileName) {
  try {
    const bucket = getFirebaseStorageBucket();
    const file = bucket.file(`learn-english-audio/${fileName}`);
    const [exists] = await file.exists();
    return exists;
  } catch (error) {
    return false;
  }
}

// Generar imagen para historia con estilo Memphis
async function generateStoryImage(story) {
  try {
    const { generateImage } = require('../utils/openaiService');
    const fs = require('fs').promises;
    const path = require('path');
    const os = require('os');
    
    console.log(`🎨 Generating Memphis image for story: ${story.id}`);
    
    // Crear prompt basado en el contenido de la historia
    const characterName = story.characters[0]; // Primer personaje
    const character = require('../data/fiveFromEarthCharacters').getCharacter(characterName);
    
    // Extraer escena clave del texto
    const storyText = story.text;
    const firstLines = storyText.split('\n').slice(0, 3).join(' ');
    
    const prompt = `Memphis Espacial Nocturno style illustration: geometric shapes, vibrant electric blue, hot pink, yellow, and deep purples. 
Night space theme with stars and planets. 
Character: ${character.name} from ${character.from}, ${character.description}. 
Scene: ${firstLines}
Style: energetic, educational, child-friendly geometric shapes and patterns.
IMPORTANT: NO TEXT OR WORDS in the image - only visual elements.`;
    
    // Generar imagen
    const response = await generateImage(prompt);
    
    if (!response.data || !response.data[0] || !response.data[0].url) {
      throw new Error('Invalid response from image generation service');
    }
    
    const imageUrl = response.data[0].url;
    console.log('✅ Image generated, processing...');
    
    // Descargar imagen
    let imageBuffer;
    if (imageUrl.startsWith('data:')) {
      const base64Data = imageUrl.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download: ${imageResponse.status}`);
      }
      const arrayBuffer = await imageResponse.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    }
    
    // Guardar temporalmente
    const tempDir = os.tmpdir();
    const imageFileName = `${story.id}-memphis.png`;
    const imagePath = path.join(tempDir, imageFileName);
    await fs.writeFile(imagePath, imageBuffer);
    
    // Subir a Firebase Storage
    const bucket = getFirebaseStorageBucket();
    const storagePath = `learn-english-images/${imageFileName}`;
    
    await bucket.upload(imagePath, {
      destination: storagePath,
      metadata: {
        cacheControl: 'public, max-age=31536000',
        contentType: 'image/png'
      },
    });
    
    const file = bucket.file(storagePath);
    await file.makePublic();
    
    const encodedPath = encodeURIComponent(storagePath);
    const firebaseUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;
    
    // Limpiar archivo temporal
    await fs.unlink(imagePath);
    
    console.log(`✅ Image uploaded for ${story.id}: ${firebaseUrl}`);
    return firebaseUrl;
    
  } catch (error) {
    console.error(`❌ Error generating image for ${story.id}:`, error.message);
    return null; // Retornar null si falla, la historia puede funcionar sin imagen
  }
}

// Verificar si una imagen existe
async function imageExists(storyId) {
  try {
    const bucket = getFirebaseStorageBucket();
    const file = bucket.file(`learn-english-images/${storyId}-memphis.png`);
    const [exists] = await file.exists();
    return exists;
  } catch (error) {
    return false;
  }
}

// ========================================
// ENDPOINTS
// ========================================

router.get('/stories', (req, res) => {
  try {
    const metadata = getAllStoriesMetadata();
    res.json({
      success: true,
      stories: metadata,
      count: metadata.length
    });
  } catch (error) {
    console.error('Error fetching stories metadata:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching stories',
      message: error.message
    });
  }
});

router.get('/stories/:storyId', async (req, res) => {
  try {
    const { storyId } = req.params;
    const userLanguage = req.query.language || 'es';
    
    console.log(`\n📖 Request for story: ${storyId}`);
    console.log(`👤 User language: ${userLanguage}`);
    
    const story = getStory(storyId);
    
    if (!story) {
      return res.status(404).json({
        success: false,
        error: 'Story not found',
        storyId
      });
    }
    
    const vocabSuffix = getVocabSuffix(userLanguage);
    const bucket = getFirebaseStorageBucket();
    
    // Nombres de archivos
    const audioFileNames = {
      intro: 'intro-en.mp3',
      vocab: `${storyId}-vocab-${vocabSuffix}.mp3`,
      story: `${storyId}-story.mp3`
    };
    
    let introUrl, vocabUrl, storyUrl;
    
    // COMPONENTE 1: INTRO
    if (await fileExists(audioFileNames.intro)) {
      const storagePath = `learn-english-audio/${audioFileNames.intro}`;
      const encodedPath = encodeURIComponent(storagePath);
      introUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;
      console.log('✓ Intro exists (cached)');
    } else {
      console.log('🎤 Generating intro audio');
      const introText = story.vocabularyIntro.intro || 'Today we will learn the words:';
      const introBuffer = await synthesizeSpeech(introText, 'female-english', 0.9, false, 'intro');
      introUrl = await uploadAudioToStorage(introBuffer, audioFileNames.intro);
      console.log('✅ Intro generated');
    }
    
    // COMPONENTE 2: VOCABULARIO
    if (await fileExists(audioFileNames.vocab)) {
      const storagePath = `learn-english-audio/${audioFileNames.vocab}`;
      const encodedPath = encodeURIComponent(storagePath);
      vocabUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;
      console.log('✓ Vocabulary exists (cached)');
    } else {
      console.log('🎤 Generating vocabulary audio');
      const vocabText = generateVocabularyAudioText(story.vocabularyIntro, userLanguage);
      const vocabBuffer = await synthesizeSpeech(vocabText, 'female-english', 0.9, false, 'vocab');
      vocabUrl = await uploadAudioToStorage(vocabBuffer, audioFileNames.vocab);
      console.log('✅ Vocabulary generated');
    }
    
    // COMPONENTE 3: CUENTO
    if (await fileExists(audioFileNames.story)) {
      const storagePath = `learn-english-audio/${audioFileNames.story}`;
      const encodedPath = encodeURIComponent(storagePath);
      storyUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;
      console.log('✓ Story exists (cached)');
    } else {
      console.log('🎤 Generating story audio');
      const storyBuffer = await synthesizeSpeech(story.text, 'female-english', 0.9, false, storyId);
      storyUrl = await uploadAudioToStorage(storyBuffer, audioFileNames.story);
      console.log('✅ Story generated');
    }
    
    console.log(`\n🎉 All audio ready for ${storyId}!`);
    
    // COMPONENTE 4: IMAGEN (Memphis Espacial Nocturno)
    let imageUrl;
    if (await imageExists(storyId)) {
      const storagePath = `learn-english-images/${storyId}-memphis.png`;
      const encodedPath = encodeURIComponent(storagePath);
      imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;
      console.log('✓ Story image exists (cached)');
    } else {
      console.log('🎨 Generating Memphis story image');
      imageUrl = await generateStoryImage(story);
      if (imageUrl) {
        console.log('✅ Story image generated');
      } else {
        console.log('⚠️ Story image generation failed, continuing without image');
      }
    }
    
    res.json({
      success: true,
      story: {
        ...story,
        introUrl,
        vocabUrl,
        storyUrl,
        imageUrl
      }
    });
    
  } catch (error) {
    console.error(`❌ Error fetching story ${req.params.storyId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Error generating story audio',
      message: error.message
    });
  }
});

router.get('/week/:weekNumber', (req, res) => {
  try {
    const weekNumber = parseInt(req.params.weekNumber);
    const weekStories = Object.values(fiveFromEarthStories).filter(
      story => story.week === weekNumber
    );
    
    if (weekStories.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No stories found for this week',
        week: weekNumber
      });
    }
    
    res.json({
      success: true,
      week: weekNumber,
      stories: weekStories,
      count: weekStories.length
    });
  } catch (error) {
    console.error(`Error fetching week ${req.params.weekNumber}:`, error);
    res.status(500).json({
      success: false,
      error: 'Error fetching week stories',
      message: error.message
    });
  }
});

// ========================================
// GENERATE TEST IMAGE FOR LEARN ENGLISH
// ========================================
router.get('/generate-test-image', async (req, res) => {
  const { generateImage } = require('../utils/openaiService');
  const fs = require('fs').promises;
  const path = require('path');
  const os = require('os');
  
  const tempDir = os.tmpdir();
  let imagePath;
  
  try {
    console.log('🎨 Generating test image with Memphis Espacial Nocturno style...');
    
    const prompt = `Memphis style, geometric shapes, vibrant electric blue, hot pink, yellow, and deep purples. 
Night space theme. Energetic and educational. Show Sara in a girl playing videogames in a futuristic room with space elements. 
IMPORTANT: NO TEXT OR WORDS should appear in the image - only visual elements.`;
    
    // Paso 1: Generar imagen con Fal.ai
    const response = await generateImage(prompt);
    
    if (!response.data || !response.data[0] || !response.data[0].url) {
      throw new Error('Invalid response from image generation service');
    }
    
    const imageUrl = response.data[0].url;
    console.log('✅ Image generated, downloading...');
    
    // Paso 2: Descargar la imagen
    let imageBuffer;
    if (imageUrl.startsWith('data:')) {
      const base64Data = imageUrl.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.status}`);
      }
      const imageArrayBuffer = await imageResponse.arrayBuffer();
      imageBuffer = Buffer.from(imageArrayBuffer);
    }
    
    console.log('✅ Image downloaded, saving...');
    
    // Paso 3: Guardar temporalmente
    const imageFileName = `test-m1w1s1-${Date.now()}.png`;
    imagePath = path.join(tempDir, imageFileName);
    await fs.writeFile(imagePath, imageBuffer);
    
    console.log('✅ Image saved, uploading to Firebase...');
    
    // Paso 4: Subir a Firebase Storage
    const bucket = getFirebaseStorageBucket();
    const storagePath = `learn-english-images/${imageFileName}`;
    
    await bucket.upload(imagePath, {
      destination: storagePath,
      metadata: {
        cacheControl: 'public, max-age=31536000',
        contentType: 'image/png'
      },
    });
    
    const file = bucket.file(storagePath);
    await file.makePublic();
    
    const encodedPath = encodeURIComponent(storagePath);
    const firebaseUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;
    
    console.log('✅ Image uploaded to Firebase Storage');
    
    // Limpiar archivo temporal
    await fs.unlink(imagePath);
    
    res.json({
      success: true,
      imageUrl: firebaseUrl,
      message: 'Test image generated successfully with Memphis Espacial Nocturno style'
    });
    
  } catch (error) {
    console.error('❌ Error generating test image:', error);
    
    // Limpiar archivo temporal si existe
    if (imagePath) {
      try {
        await fs.unlink(imagePath);
      } catch (cleanupError) {
        // Ignorar errores de limpieza
      }
    }
    
    res.status(500).json({
      success: false,
      error: 'Error generating test image',
      message: error.message
    });
  }
});

module.exports = router;
