// controllers/learnEnglishController.js
const { admin } = require('../config/firebase');
const path = require('path');
const { fiveFromEarthStories, getStory } = require('../data/fiveFromEarthStories');

// Lazy loading for services
let googleTtsService = null;
let audioMixer = null;

const getGoogleTtsService = () => {
  if (!googleTtsService) {
    googleTtsService = require('../utils/googleTtsService');
  }
  return googleTtsService;
};

const getAudioMixer = () => {
  if (!audioMixer) {
    audioMixer = require('../utils/audioMixer');
  }
  return audioMixer;
};

let bucket = null;
const getFirebaseStorageBucket = () => {
  if (!bucket) {
    bucket = admin.storage().bucket();
  }
  return bucket;
};

// Datos de las historias predefinidas
const STORIES_DATA = {
  // Mes 1 - Semana 1
  'm1w1s1': {
    title: { es: 'Soy Sara de Barcelona', en: 'I am Sara from Barcelona' },
    vocabulary: ['my', 'name', 'videogames', 'brother'],
    character: 'Sara',
    text: {
      en: 'My name is Sara. I am from Barcelona. I love videogames. I have a brother. My brother is very smart.',
      es: 'Mi nombre es Sara. Soy de Barcelona. Me encantan los videojuegos. Tengo un hermano. Mi hermano es muy inteligente.'
    }
  },
  'm1w1s2': {
    title: { es: 'Soy María de Camerún', en: 'I am María from Cameroon' },
    vocabulary: ['smart', 'market', 'help', 'study'],
    character: 'María',
    text: {
      en: 'My name is María. I am smart. I help at the market. I study every day. I love to learn new things.',
      es: 'Mi nombre es María. Soy inteligente. Ayudo en el mercado. Estudio todos los días. Me encanta aprender cosas nuevas.'
    }
  },
  'm1w1s3': {
    title: { es: 'Soy Eva de China', en: 'I am Eva from China' },
    vocabulary: ['China', 'cat', 'fun', 'friend'],
    character: 'Eva',
    text: {
      en: 'My name is Eva. I am from China. I have a cat. My cat is fun. I have many friends.',
      es: 'Mi nombre es Eva. Soy de China. Tengo un gato. Mi gato es divertido. Tengo muchos amigos.'
    }
  },
  // Mes 1 - Semana 2
  'm1w2s1': {
    title: { es: 'Soy Robert de Estados Unidos', en: 'I am Robert from America' },
    vocabulary: ['sports', 'strong', 'sisters', 'confident'],
    character: 'Robert',
    text: {
      en: 'My name is Robert. I love sports. I am strong. I have two sisters. I am confident.',
      es: 'Mi nombre es Robert. Me encantan los deportes. Soy fuerte. Tengo dos hermanas. Soy seguro de mí mismo.'
    }
  },
  'm1w2s2': {
    title: { es: 'Soy Gabriel de Australia', en: 'I am Gabriel from Australia' },
    vocabulary: ['shy', 'quiet', 'books', 'space'],
    character: 'Gabriel',
    text: {
      en: 'My name is Gabriel. I am from Australia. I am shy and quiet. I love books. I love space and stars.',
      es: 'Mi nombre es Gabriel. Soy de Australia. Soy tímido y tranquilo. Me encantan los libros. Me encanta el espacio y las estrellas.'
    }
  },
  'm1w2s3': {
    title: { es: 'Somos los Cinco', en: 'We Are the Five' },
    vocabulary: ['team', 'different', 'together', 'friends'],
    character: 'The Five',
    text: {
      en: 'We are a team. We are different. But we work together. We are friends. We are the Five from Earth.',
      es: 'Somos un equipo. Somos diferentes. Pero trabajamos juntos. Somos amigos. Somos los Cinco de la Tierra.'
    }
  }
};

// Generar audio de introducción (español → inglés)
async function generateIntroAudio(vocabularyIntro, language = 'es') {
  const tts = getGoogleTtsService();
  
  // Usar el texto de introducción del cuento
  const introText = vocabularyIntro.intro || 'Today we will learn the words:';
  
  // Generar audio con voz femenina americana usando synthesizeSpeech
  const audioBuffer = await tts.synthesizeSpeech(introText, 'female-english', 0.9, false, 'intro');
  
  return audioBuffer;
}

// Generar audio de vocabulario usando el sistema multiidioma
async function generateVocabAudio(vocabularyIntro, language = 'es') {
  const tts = getGoogleTtsService();
  
  let text = '';
  const SUPPORTED_LANGUAGES = ['es', 'fr'];
  let effectiveLanguage = SUPPORTED_LANGUAGES.includes(language) ? language : 'en';

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
  
  // Usar synthesizeSpeech con voz femenina
  const audioBuffer = await tts.synthesizeSpeech(text, 'female-english', 0.9, false, 'vocab');
  
  return audioBuffer;
}

// Generar audio del cuento completo
async function generateStoryAudio(storyData, language = 'es') {
  const tts = getGoogleTtsService();
  
  const storyText = storyData.text; // El texto del cuento
  
  // Usar synthesizeSpeech con voz femenina en inglés
  const audioBuffer = await tts.synthesizeSpeech(storyText, 'female-english', 0.9, false, 'story');
  
  return audioBuffer;
}

// Subir audio a Firebase Storage (MÉTODO MEJORADO CON RETRY Y VALIDACIÓN)
async function uploadAudioToStorage(audioBuffer, fileName) {
  const fs = require('fs').promises;
  const path = require('path');
  
  // 1. Guardar primero a archivo local temporal
  const tempDir = path.join(__dirname, '../temp');
  await fs.mkdir(tempDir, { recursive: true });
  
  const tempFilePath = path.join(tempDir, `${fileName}_${Date.now()}.tmp`);
  
  console.log(`💾 Writing audio buffer to temp file: ${tempFilePath}`);
  console.log(`   Buffer size: ${audioBuffer.length} bytes`);
  
  // CRÍTICO: audioBuffer viene en base64 desde Google TTS, hay que decodificarlo
  const binaryBuffer = Buffer.isBuffer(audioBuffer) 
    ? audioBuffer 
    : Buffer.from(audioBuffer, 'base64');
  
  console.log(`   Binary buffer size: ${binaryBuffer.length} bytes`);
  
  await fs.writeFile(tempFilePath, binaryBuffer);
  
  // Verificar que el archivo se escribió correctamente
  const localFileStats = await fs.stat(tempFilePath);
  console.log(`✅ Temp file created: ${localFileStats.size} bytes`);
  
  if (localFileStats.size === 0) {
    throw new Error(`Temp file is empty: ${tempFilePath}`);
  }
  
  // 2. Subir el archivo local a Firebase Storage con retry
  const bucket = getFirebaseStorageBucket();
  const storagePath = `learn-english-audio/${fileName}`;
  
  console.log(`📤 Uploading to Firebase: ${storagePath}`);
  
  let uploadSuccess = false;
  let retries = 3;
  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await bucket.upload(tempFilePath, {
        destination: storagePath,
        timeout: 60000, // 1 minuto timeout
        metadata: {
          cacheControl: 'public, max-age=31536000',
          contentType: 'audio/mpeg'
        }
      });
      
      uploadSuccess = true;
      console.log(`✅ Upload successful on attempt ${attempt}`);
      break;
    } catch (err) {
      lastError = err;
      console.error(`❌ Upload attempt ${attempt} failed:`, err.message);
      if (attempt < retries) {
        console.log(`   Retrying in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  if (!uploadSuccess) {
    throw new Error(`Failed to upload after ${retries} attempts: ${lastError.message}`);
  }
  
  // 3. Verificar que el archivo se subió correctamente
  const file = bucket.file(storagePath);
  const [metadata] = await file.getMetadata();
  console.log(`✅ File uploaded: ${metadata.size} bytes`);
  
  if (parseInt(metadata.size) === 0) {
    throw new Error(`Uploaded file is empty: ${storagePath}`);
  }
  
  // 4. Hacer público
  await file.makePublic();
  console.log(`✅ File made public: ${storagePath}`);
  
  // 5. Limpiar archivo temporal SOLO DESPUÉS de confirmar subida exitosa
  try {
    await fs.unlink(tempFilePath);
    console.log(`🗑️ Temp file deleted: ${tempFilePath}`);
  } catch (err) {
    console.warn('⚠️ Could not delete temp file:', err.message);
  }
  
  // 6. Generar URL pública correcta para Firebase Storage
  // Formato: https://firebasestorage.googleapis.com/v0/b/BUCKET/o/PATH_ENCODED?alt=media
  const encodedPath = encodeURIComponent(storagePath);
  const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;
  console.log(`🌐 Public URL: ${publicUrl}`);
  
  return publicUrl;
}

// Traducción simple (mejorar con diccionario completo)
function translateToSpanish(word) {
  const translations = {
    'my': 'mi',
    'name': 'nombre',
    'videogames': 'videojuegos',
    'brother': 'hermano',
    'smart': 'inteligente',
    'market': 'mercado',
    'help': 'ayudar',
    'study': 'estudiar',
    'China': 'China',
    'cat': 'gato',
    'fun': 'divertido',
    'friend': 'amigo',
    'sports': 'deportes',
    'strong': 'fuerte',
    'sisters': 'hermanas',
    'confident': 'seguro',
    'shy': 'tímido',
    'quiet': 'tranquilo',
    'books': 'libros',
    'space': 'espacio',
    'team': 'equipo',
    'different': 'diferentes',
    'together': 'juntos',
    'friends': 'amigos'
  };
  
  return translations[word] || word;
}

// Endpoint principal: obtener historia con audios
// Endpoint temporal para limpiar archivos corruptos
exports.clearCorruptedAudio = async (req, res) => {
  try {
    const bucket = getFirebaseStorageBucket();
    const filesToDelete = [
      'learn-english-audio/intro-en.mp3',
      'learn-english-audio/m1w1s1-story.mp3',
      'learn-english-audio/m1w1s1-vocab-es.mp3',
      'learn-english-audio/m1w1s2-story.mp3',
      'learn-english-audio/m1w1s2-vocab-es.mp3',
      'learn-english-audio/m1w1s3-story.mp3',
      'learn-english-audio/m1w1s3-vocab-es.mp3'
    ];
    
    console.log('🗑️ Deleting corrupted audio files...');
    
    for (const filePath of filesToDelete) {
      try {
        await bucket.file(filePath).delete();
        console.log(`✅ Deleted: ${filePath}`);
      } catch (err) {
        console.log(`⚠️ Could not delete ${filePath}: ${err.message}`);
      }
    }
    
    res.json({ success: true, message: 'Corrupted files deleted. They will be regenerated on next request.' });
  } catch (error) {
    console.error('Error deleting files:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const { language = 'es' } = req.query;
    
    console.log(`📖 Learn English: Loading story ${storyId} in ${language}`);
    
    // Verificar que la historia existe usando los datos completos
    const storyData = getStory(storyId);
    if (!storyData) {
      return res.status(404).json({
        success: false,
        error: `Story ${storyId} not found`
      });
    }
    
    // Determinar el código de idioma y sufijo (es-ES -> es)
    const SUPPORTED_LANGUAGES = ['es', 'fr'];
    const languageCode = language ? language.split('-')[0] : 'es'; // 'es-ES' -> 'es'
    const vocabSuffix = SUPPORTED_LANGUAGES.includes(languageCode) ? languageCode : 'generic';
    
    // Nombres de archivos fijos (sin timestamp) para reutilización
    // Estos archivos se generan UNA vez y se reutilizan para todos los usuarios
    const audioFileNames = {
      intro: `intro-en.mp3`,  // Universal para TODAS las historias
      vocab: `${storyId}-vocab-${vocabSuffix}.mp3`,  // Uno por historia + idioma
      story: `${storyId}-story.mp3`  // Uno por historia
    };
    
    let introUrl, vocabUrl, storyUrl;
    
    // Verificar si los audios ya existen en Firebase Storage
    const FORCE_REGENERATE = false; // Usar caché para optimizar costos y velocidad
    
    if (!FORCE_REGENERATE) {
      try {
        // Intentar obtener URLs existentes
        const bucket = getFirebaseStorageBucket();
        
        const [introFile] = await bucket.file(`learn-english-audio/${audioFileNames.intro}`).get();
        const introPath = encodeURIComponent(introFile.name);
        introUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${introPath}?alt=media`;
        
        const [vocabFile] = await bucket.file(`learn-english-audio/${audioFileNames.vocab}`).get();
        const vocabPath = encodeURIComponent(vocabFile.name);
        vocabUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${vocabPath}?alt=media`;
        
        const [storyFile] = await bucket.file(`learn-english-audio/${audioFileNames.story}`).get();
        const storyPath = encodeURIComponent(storyFile.name);
        storyUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${storyPath}?alt=media`;
        
        console.log('✅ Using existing audio files');
        console.log('📤 Intro URL:', introUrl);
        console.log('📤 Vocab URL:', vocabUrl);
        console.log('📤 Story URL:', storyUrl);
        return res.json({
          success: true,
          story: {
            ...storyData,
            introUrl,
            vocabUrl,
            storyUrl
          }
        });
      } catch (error) {
        console.log('⚠️ Existing files not found, will generate new ones');
      }
    }
    
    // Generar audios (siempre en modo debug, o si no existen)
    try {
      // Los audios no existen o forzamos regeneración, generarlos
      console.log('🎵 Generating new audio files...');
      
      // Generar audio de introducción
      const introBuffer = await generateIntroAudio(storyData.vocabularyIntro, languageCode);
      introUrl = await uploadAudioToStorage(introBuffer, audioFileNames.intro);
      console.log('✅ Intro audio generated');
      
      // Generar audio de vocabulario
      const vocabBuffer = await generateVocabAudio(storyData.vocabularyIntro, languageCode);
      vocabUrl = await uploadAudioToStorage(vocabBuffer, audioFileNames.vocab);
      console.log('✅ Vocab audio generated');
      
      // Generar audio del cuento
      const storyBuffer = await generateStoryAudio(storyData, languageCode);
      storyUrl = await uploadAudioToStorage(storyBuffer, audioFileNames.story);
      console.log('✅ Story audio generated');
    } catch (generateError) {
      console.error('❌ Error generating audio:', generateError);
      throw generateError;
    }
    
    console.log('📤 Final URLs being sent:');
    console.log('   Intro:', introUrl);
    console.log('   Vocab:', vocabUrl);
    console.log('   Story:', storyUrl);
    
    // Devolver la historia con URLs de audio
    res.json({
      success: true,
      story: {
        ...storyData,
        introUrl,
        vocabUrl,
        storyUrl
      }
    });
    
  } catch (error) {
    console.error('❌ Error loading Learn English story:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

