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

// Generar imagen para historia con estilo Memphis
async function generateStoryImage(story) {
  try {
    const { generateImage } = require('../utils/openaiService');
    const fs = require('fs').promises;
    const path = require('path');
    const os = require('os');
    const fetch = require('node-fetch');
    const sharp = require('sharp');
    
    console.log(`🎨 Generating Memphis image for story: ${story.id}`);
    console.log(`🎨 Story object keys:`, Object.keys(story));
    console.log(`🎨 Story.characters:`, story.characters);
    console.log(`🎨 Story.text type:`, typeof story.text);
    console.log(`🎨 Story.text preview:`, typeof story.text === 'string' ? story.text.substring(0, 100) : story.text);
    
    // Crear prompt basado en el contenido de la historia
    const characterName = story.characters && story.characters[0] ? story.characters[0] : null;
    console.log(`🎨 Character name extracted:`, characterName);
    let character = null;
    
    if (characterName) {
      try {
        const charactersData = require('../data/fiveFromEarthCharacters');
        character = charactersData.getCharacter(characterName);
        console.log(`🎨 Character loaded:`, character ? character.name : 'null');
      } catch (error) {
        console.warn(`⚠️ Could not load character ${characterName}, using abstract style:`, error.message);
      }
    } else {
      console.warn(`⚠️ No character name found in story.characters`);
    }
    
    // Extraer escena clave del texto - usar más líneas para capturar mejor el contexto
    const storyText = typeof story.text === 'string' ? story.text : (story.text?.en || story.text?.es || '');
    // Usar las primeras 5-7 líneas para capturar más contexto de la historia
    const lines = storyText.split('\n').filter(line => line.trim().length > 0); // Filtrar líneas vacías
    const sceneLines = lines.slice(0, 7).join(' '); // Tomar hasta 7 líneas no vacías
    console.log(`🎨 Scene lines extracted (${lines.length} total lines, using first 7):`, sceneLines.substring(0, 200));
    
    let prompt;
    
    if (character) {
      // Prompt original con personaje (como el 28 de noviembre)
      const characterLocation = character.city ? `${character.city}, ${character.country}` : character.country;
      prompt = `Memphis Espacial Nocturno style illustration: geometric shapes, vibrant electric blue, hot pink, yellow, and deep purples. 
Night space theme with stars and planets. 
Character: ${character.name} from ${characterLocation}, ${character.description}. 
Scene: ${sceneLines}
Style: energetic, educational, child-friendly geometric shapes and patterns.

CRITICAL - CHARACTER MUST BE:
- Viewed from behind (back view) OR
- In silhouette/shadow with NO facial details OR  
- Face completely hidden/obscured OR
- Face extremely blurred/out of focus
DO NOT show clear facial features, eyes, nose, or mouth.
Focus on: body posture, clothing, activity, and environment - NOT on character's face.

IMPORTANT: NO TEXT OR WORDS in the image - only visual elements.`;
    } else {
      // Fallback abstracto si no hay personaje
      prompt = `Memphis Espacial Nocturno style ABSTRACT illustration:
Scene: ${sceneLines || 'space exploration and adventure'}
Style: geometric shapes, vibrant electric blue, hot pink, yellow, deep purples, and cosmic colors.
Night space theme with stars, planets, rockets, and cosmic elements.
ABSTRACT geometric shapes representing space exploration and adventure.
NO human figures, NO faces, NO people, NO characters, NO children.
Only: rockets, spaceships, planets, stars, geometric shapes, space elements, cosmic patterns, badges, symbols.
Child-friendly, energetic, educational geometric Memphis design.
IMPORTANT: NO TEXT OR WORDS in the image - only visual elements.`;
    }
    
    console.log(`🎨 Character: ${character ? character.name : 'none (abstract)'}`);
    console.log(`🎨 Scene: ${sceneLines.substring(0, 150)}...`);
    console.log(`🎨 Story ID: ${story.id}`);
    console.log(`🎨 Story vocabulary:`, story.vocabulary);
    console.log(`🎨 Full prompt (BEFORE openaiService):`);
    console.log(prompt);
    console.log(`🎨 Prompt length: ${prompt.length} characters`);
    
    // Generar imagen (usar default como en el código original del 28 de noviembre)
    const response = await generateImage(prompt);
    
    if (!response.data || !response.data[0] || !response.data[0].url) {
      throw new Error('Invalid response from image generation service');
    }
    
    const imageUrl = response.data[0].url;
    console.log('✅ Image generated, processing and optimizing...');
    
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
    
    console.log(`📊 Original image size: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
    
    // OPTIMIZACIÓN: Convertir a WebP con compresión agresiva
    const optimizedBuffer = await sharp(imageBuffer)
      .resize(512, 512, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({
        quality: 75,        // Buena calidad pero con compresión
        effort: 6,          // Mayor esfuerzo de compresión
        smartSubsample: true // Mejor calidad de colores
      })
      .toBuffer();
    
    console.log(`📊 Optimized image size: ${(optimizedBuffer.length / 1024).toFixed(2)} KB`);
    console.log(`📉 Size reduction: ${(((imageBuffer.length - optimizedBuffer.length) / imageBuffer.length) * 100).toFixed(1)}%`);
    
    // Guardar temporalmente la versión optimizada
    const tempDir = os.tmpdir();
    const imageFileName = `${story.id}-memphis.webp`; // Cambiar extensión a .webp
    const imagePath = path.join(tempDir, imageFileName);
    await fs.writeFile(imagePath, optimizedBuffer);
    
    // Subir a Firebase Storage
    const bucket = getFirebaseStorageBucket();
    const storagePath = `learn-english-images/${imageFileName}`;
    
    await bucket.upload(imagePath, {
      destination: storagePath,
      metadata: {
        cacheControl: 'public, max-age=31536000, immutable',
        contentType: 'image/webp' // Cambiar content type
      },
    });
    
    const file = bucket.file(storagePath);
    
    // Intentar hacer público, pero si falla, usar URL firmada
    try {
      await file.makePublic();
      const encodedPath = encodeURIComponent(storagePath);
      const firebaseUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;
      
      // Limpiar archivo temporal
      await fs.unlink(imagePath);
      
      console.log(`✅ Image uploaded for ${story.id}: ${firebaseUrl}`);
      return firebaseUrl;
    } catch (publicError) {
      console.log('⚠️ Could not make file public, using signed URL instead');
      
      // Generar URL firmada con 10 años de validez
      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + (10 * 365 * 24 * 60 * 60 * 1000) // 10 años
      });
      
      // Limpiar archivo temporal
      await fs.unlink(imagePath);
      
      console.log(`✅ Image uploaded for ${story.id} with signed URL`);
      return signedUrl;
    }
    
  } catch (error) {
    console.error(`❌ Error generating image for ${story.id}:`, error.message);
    return null; // Retornar null si falla, la historia puede funcionar sin imagen
  }
}

// Verificar si una imagen existe (priorizar WebP, fallback a PNG)
async function imageExists(storyId) {
  try {
    const bucket = getFirebaseStorageBucket();
    
    // Primero buscar versión optimizada WebP
    const webpFile = bucket.file(`learn-english-images/${storyId}-memphis.webp`);
    const [webpExists] = await webpFile.exists();
    if (webpExists) {
      return 'webp';
    }
    
    // Fallback: buscar versión PNG antigua
    const pngFile = bucket.file(`learn-english-images/${storyId}-memphis.png`);
    const [pngExists] = await pngFile.exists();
    if (pngExists) {
      return 'png';
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

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
  },
  // Mes 1 - Semana 3
  'm1w3s1': {
    title: { es: '¡Alerta de Misión!', en: 'Mission Alert!' },
    vocabulary: ['mission', 'rescue', 'rocket', 'ready'],
    character: 'The Five',
    text: {
      en: 'The Five from Earth receive a mission alert. A small rocket is lost in space. The team gets ready, checks the rocket, and flies into the stars to start the rescue.',
      es: 'Los Cinco de la Tierra reciben una alerta de misión. Un pequeño cohete está perdido en el espacio. El equipo se prepara, revisa el cohete y vuela hacia las estrellas para comenzar el rescate.'
    }
  },
  'm1w3s2': {
    title: { es: 'El Explorador Perdido', en: 'The Lost Explorer' },
    vocabulary: ['lost', 'find', 'search', 'planet'],
    character: 'The Five',
    text: {
      en: 'On a strange planet, the Five search for a lost explorer. They look behind rocks, in caves, and in the sky. Step by step, they follow tracks and finally find the explorer safe but scared.',
      es: 'En un planeta extraño, los Cinco buscan a un explorador perdido. Miran detrás de las rocas, en las cuevas y en el cielo. Paso a paso, siguen las huellas y finalmente encuentran al explorador sano pero asustado.'
    }
  },
  'm1w3s3': {
    title: { es: 'El Plan de María', en: "María's Plan" },
    vocabulary: ['smart', 'idea', 'plan', 'solve'],
    character: 'María',
    text: {
      en: 'María has a smart idea to solve the mission. She draws a simple plan, shares it with the team, and step by step they follow it. Thanks to María’s plan, the problem is solved.',
      es: 'María tiene una idea inteligente para resolver la misión. Dibuja un plan sencillo, lo comparte con el equipo y paso a paso lo siguen. Gracias al plan de María, el problema se resuelve.'
    }
  },
  // Mes 1 - Semana 4
  'm1w4s1': {
    title: { es: 'El Planeta de los Magos', en: 'The Wizard Planet' },
    vocabulary: ['explore', 'magic', 'wizard', 'strange'],
    character: 'The Five',
    text: {
      en: 'The Five land on a wizard planet full of strange lights and magic shapes. They explore carefully, meet a friendly wizard, and learn that real magic is working together as a team.',
      es: 'Los Cinco aterrizan en un planeta de magos lleno de luces extrañas y formas mágicas. Exploran con cuidado, conocen a un mago amistoso y aprenden que la verdadera magia es trabajar juntos como equipo.'
    }
  },
  'm1w4s2': {
    title: { es: 'Sara y Eva se Divierten', en: 'Sara and Eva Have Fun' },
    vocabulary: ['fun', 'laugh', 'spell', 'careful'],
    character: 'Sara y Eva',
    text: {
      en: 'On the wizard planet, Sara and Eva try funny spells. They laugh when colors change and small stars appear, but they also learn to be careful and to stop a spell if it is too strong.',
      es: 'En el planeta de los magos, Sara y Eva prueban hechizos divertidos. Se ríen cuando los colores cambian y aparecen pequeñas estrellas, pero también aprenden a tener cuidado y a detener un hechizo si es demasiado fuerte.'
    }
  },
  'm1w4s3': {
    title: { es: 'Éxito del Equipo', en: 'Team Success' },
    vocabulary: ['success', 'proud', 'home', 'Earth'],
    character: 'The Five',
    text: {
      en: 'The mission is a success and the Five return home to Earth. They feel proud because they helped others and worked together. At the end of the day, they look at the stars and are ready for the next adventure.',
      es: 'La misión es un éxito y los Cinco regresan a casa, a la Tierra. Se sienten orgullosos porque ayudaron a otros y trabajaron juntos. Al final del día miran las estrellas y están listos para la próxima aventura.'
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
    const bucket = getFirebaseStorageBucket();
    
    // Intentar obtener URLs de audios existentes (pero no fallar si no existen)
    try {
      const [introExists] = await bucket.file(`learn-english-audio/${audioFileNames.intro}`).exists();
      if (introExists) {
        const [introFile] = await bucket.file(`learn-english-audio/${audioFileNames.intro}`).get();
        const introPath = encodeURIComponent(introFile.name);
        introUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${introPath}?alt=media`;
      }
      
      const [vocabExists] = await bucket.file(`learn-english-audio/${audioFileNames.vocab}`).exists();
      if (vocabExists) {
        const [vocabFile] = await bucket.file(`learn-english-audio/${audioFileNames.vocab}`).get();
        const vocabPath = encodeURIComponent(vocabFile.name);
        vocabUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${vocabPath}?alt=media`;
      }
      
      const [storyExists] = await bucket.file(`learn-english-audio/${audioFileNames.story}`).exists();
      if (storyExists) {
        const [storyFile] = await bucket.file(`learn-english-audio/${audioFileNames.story}`).get();
        const storyPath = encodeURIComponent(storyFile.name);
        storyUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${storyPath}?alt=media`;
      }
      
      if (introUrl && vocabUrl && storyUrl) {
        console.log('✅ Using existing audio files');
        console.log('📤 Intro URL:', introUrl);
        console.log('📤 Vocab URL:', vocabUrl);
        console.log('📤 Story URL:', storyUrl);
      } else {
        console.log('⚠️ Some audio files missing, will generate them');
      }
    } catch (audioError) {
      console.log('⚠️ Error checking audio files, will generate them:', audioError.message);
    }
    
    // COMPONENTE 4: IMAGEN (Memphis Espacial Nocturno) - SIEMPRE verificar y generar si falta
    let imageUrl = null;
    console.log(`🖼️ [getStory] Checking if image exists for ${storyId}...`);
    try {
      const imageFormat = await imageExists(storyId);
      console.log(`🖼️ [getStory] Image format check result: ${imageFormat || 'NOT FOUND'}`);
      
      if (imageFormat) {
        const extension = imageFormat === 'webp' ? 'webp' : 'png';
        const storagePath = `learn-english-images/${storyId}-memphis.${extension}`;
        const file = bucket.file(storagePath);
        
        // Generar URL firmada para acceso seguro (válida por 10 años)
        try {
          const [signedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + (10 * 365 * 24 * 60 * 60 * 1000)
          });
          imageUrl = signedUrl;
          console.log(`✅ [getStory] Story image exists (${extension}, cached)`);
          console.log('📤 [getStory] Image URL:', imageUrl);
        } catch (urlError) {
          console.error('❌ [getStory] Error getting signed URL:', urlError.message);
          imageUrl = null;
        }
      } else {
        console.log(`🎨 [getStory] Image NOT FOUND for ${storyId}, GENERATING NOW...`);
        console.log(`🎨 [getStory] Calling generateStoryImage with storyData:`, {
          id: storyData.id,
          vocabulary: storyData.vocabulary,
          title: storyData.title
        });
        imageUrl = await generateStoryImage(storyData);
        if (imageUrl) {
          console.log('✅ [getStory] Story image generated successfully');
          console.log('📤 [getStory] Image URL:', imageUrl);
        } else {
          console.log('⚠️ [getStory] Story image generation returned null');
        }
      }
    } catch (imageError) {
      console.error('❌ [getStory] Error checking/generating image:', imageError.message);
      console.error('❌ [getStory] Error stack:', imageError.stack);
    }
    
    // Si tenemos todos los audios, devolver respuesta inmediatamente
    if (introUrl && vocabUrl && storyUrl) {
      return res.json({
        success: true,
        story: {
          ...storyData,
          introUrl,
          vocabUrl,
          storyUrl,
          imageUrl
        }
      });
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
    
    // La imagen ya fue manejada en el bloque anterior (línea 609)
    // Si no se generó antes, intentar generarla ahora
    if (!imageUrl) {
      console.log(`🖼️ [getStory-FALLBACK] Image was not set, checking again...`);
      try {
        const imageFormat = await imageExists(storyId);
        if (imageFormat) {
          const extension = imageFormat === 'webp' ? 'webp' : 'png';
          const storagePath = `learn-english-images/${storyId}-memphis.${extension}`;
          const file = bucket.file(storagePath);
          const [signedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + (10 * 365 * 24 * 60 * 60 * 1000)
          });
          imageUrl = signedUrl;
          console.log(`✅ [getStory-FALLBACK] Story image exists (${extension}, cached)`);
        } else {
          console.log(`🎨 [getStory-FALLBACK] Image NOT FOUND, GENERATING NOW...`);
          imageUrl = await generateStoryImage(storyData);
          if (imageUrl) {
            console.log('✅ [getStory-FALLBACK] Story image generated successfully');
          }
        }
      } catch (imageError) {
        console.error('❌ [getStory-FALLBACK] Error with image:', imageError.message);
        imageUrl = null;
      }
    }
    
    // Devolver la historia con URLs de audio e imagen
    res.json({
      success: true,
      story: {
        ...storyData,
        introUrl,
        vocabUrl,
        storyUrl,
        imageUrl
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

// Obtener URLs de imágenes de todas las historias
exports.getAllImageUrls = async (req, res) => {
  try {
    const bucket = getFirebaseStorageBucket();
    const imageUrls = {};
    
    // Lista de IDs de historias
    const storyIds = [
      'm1w1s1', 'm1w1s2', 'm1w1s3',
      'm1w2s1', 'm1w2s2', 'm1w2s3',
      'm1w3s1', 'm1w3s2', 'm1w3s3',
      'm1w4s1', 'm1w4s2', 'm1w4s3'
    ];
    
    // Generar URLs firmadas para cada historia que tenga imagen
    // Preferimos siempre la versión WEBP si existe, y caemos a PNG solo si no hay WEBP
    for (const storyId of storyIds) {
      try {
        let targetFile = null;

        // 1) Intentar WEBP primero
        const webpPath = `learn-english-images/${storyId}-memphis.webp`;
        const webpFile = bucket.file(webpPath);
        const [webpExists] = await webpFile.exists();

        if (webpExists) {
          targetFile = webpFile;
          console.log(`🖼️ [LearnEnglish] Using WEBP for ${storyId}: ${webpPath}`);
        } else {
          // 2) Fallback a PNG
          const pngPath = `learn-english-images/${storyId}-memphis.png`;
          const pngFile = bucket.file(pngPath);
          const [pngExists] = await pngFile.exists();

          if (pngExists) {
            targetFile = pngFile;
            console.log(`🖼️ [LearnEnglish] Using PNG for ${storyId}: ${pngPath}`);
          } else {
            console.warn(`🖼️ [LearnEnglish] No image found for ${storyId} (neither WEBP nor PNG)`);
          }
        }

        if (targetFile) {
          const [signedUrl] = await targetFile.getSignedUrl({
            action: 'read',
            expires: Date.now() + (10 * 365 * 24 * 60 * 60 * 1000) // 10 años
          });
          imageUrls[storyId] = signedUrl;
        }
      } catch (urlError) {
        console.error(`⚠️ Error getting URL for ${storyId}:`, urlError.message);
        // Continuar con las demás imágenes
      }
    }
    
    // Siempre devolver respuesta exitosa, aunque esté vacía
    res.json({
      success: true,
      imageUrls
    });
    
  } catch (error) {
    console.error('❌ Error getting image URLs:', error);
    // Devolver objeto vacío en lugar de error
    res.json({
      success: true,
      imageUrls: {}
    });
  }
};

/**
 * Helper para generar (o regenerar) la imagen de una historia concreta.
 * Se exporta para poder usarlo desde scripts sin pasar por el flujo del primer usuario.
 */
exports.generateImageForStory = async (storyId) => {
  try {
    // Usar la misma fuente de datos que cuando un usuario hace clic
    const { getStory } = require('../data/fiveFromEarthStories');
    const storyData = getStory(storyId);
    
    if (!storyData) {
      throw new Error(`Invalid or unknown storyId: ${storyId}`);
    }

    console.log(`\n🎨 [SCRIPT] Forcing image generation for story: ${storyId}`);

    const existingFormat = await imageExists(storyId);
    if (existingFormat) {
      console.log(`🖼️ [SCRIPT] Image already exists for ${storyId} (${existingFormat}), skipping`);
      return { success: true, skipped: true, format: existingFormat };
    }

    // Usar exactamente los mismos datos que cuando un usuario hace clic
    const imageUrl = await generateStoryImage(storyData);

    if (!imageUrl) {
      throw new Error('Image generation returned null');
    }

    console.log(`✅ [SCRIPT] Image generated successfully for ${storyId}`);
    return { success: true, skipped: false, url: imageUrl };
  } catch (error) {
    console.error(`❌ [SCRIPT] Failed to generate image for ${storyId}:`, error.message);
    return { success: false, error: error.message };
  }
};

