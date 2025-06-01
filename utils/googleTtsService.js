console.log("🔥🔥🔥 ARCHIVO GOOGLETSSERVICE.JS VERSIÓN NUEVA CARGADO 🔥🔥🔥");

// Load environment variables
require('dotenv').config();

// Helper function to escape SSML special characters
function escapeSSML(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Helper function to get Google voice name based on voice ID
function getGoogleVoiceName(voiceId) {
  switch (voiceId) {
    case 'male':
      return 'es-ES-Neural2-F'; // MALE voice
    case 'female':
      return 'es-ES-Neural2-E'; // FEMALE voice
    default:
      return 'es-ES-Neural2-E'; // Default to female
  }
}

// Helper function to process text and add intelligent pauses automatically
function processTextWithIntelligentPauses(text) {
  console.log("🎵 === PROCESAMIENTO COMPLETAMENTE NATURAL ===");
  console.log("📝 Texto original (primeros 100 caracteres):", text.substring(0, 100) + "...");
  
  // Configuración mínima y muy natural
  const naturalPauses = {
    titlePause: '1.0s'        // Solo 1 segundo después de títulos
  };

  console.log("⚙️ Configuración ultra natural:");
  console.log("   - Solo pausa de 1s después de títulos");
  console.log("   - Todo lo demás: entonación natural de Google TTS");

  // Escapar caracteres especiales SSML PRIMERO
  let processedText = escapeSSML(text);
  
  // Solo detectar títulos y agregar punto + pausa de 1s
  // Detectar títulos simples (líneas cortas que parecen títulos)
  processedText = processedText.replace(/^([A-ZÁÉÍÓÚÑÜÇ][^.\n!?]{3,40})$/gm, (match, possibleTitle) => {
    // Evitar oraciones comunes pero ser permisivo
    if (!/\b(había una vez|en un|vivía|tenía|estaba|era muy|fue cuando|después de)\b/i.test(possibleTitle)) {
      console.log(`🎯 TÍTULO: "${possibleTitle}" → Punto + 1s natural`);
      // Solo punto final + pausa de 1 segundo, nada más
      return `${possibleTitle}.<break time="${naturalPauses.titlePause}"/>`;
    }
    return match;
  });
  
  // Títulos con formato "CAPÍTULO X" o similares
  processedText = processedText.replace(/^(CAPÍTULO\s+\d+|CHAPTER\s+\d+|PARTE\s+\d+)(.*)$/gmi, (match, chapterWord, rest) => {
    console.log(`📚 CAPÍTULO: "${match}" → Punto + 1s natural`);
    const fullTitle = chapterWord + rest;
    return `${fullTitle}.<break time="${naturalPauses.titlePause}"/>`;
  });
  
  // Títulos con dos puntos al final
  processedText = processedText.replace(/^([A-ZÁÉÍÓÚÑÜÇ][^:\n]{5,}:)\s*$/gm, (match, titleWithColon) => {
    console.log(`📝 TÍTULO CON ":" → Solo 1s natural`);
    // Los dos puntos ya dan entonación natural, solo pausa
    return `${titleWithColon}<break time="${naturalPauses.titlePause}"/>`;
  });
  
  // Limpiar espacios múltiples (solo esto)
  processedText = processedText.replace(/\s+/g, ' ').trim();
  
  // Envolver en SSML simple
  const finalSSML = `<speak>${processedText}</speak>`;
  
  console.log(`✅ Audio completamente natural - Solo ${(finalSSML.match(/<break/g) || []).length} pausas mínimas`);
  console.log("🎵 === TODO LO DEMÁS ES NATURAL ===");
  
  return finalSSML;
}

// Helper function to split text into chunks that respect the 5000-byte SSML limit
function splitTextIntoChunks(text, maxChars = 1200) {
  // Split by sentences to maintain natural breaks
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const testChunk = currentChunk + (currentChunk ? ' ' : '') + sentence;
    
    // Use character count instead of estimated bytes for more predictable chunking
    if (testChunk.length > maxChars && currentChunk) {
      // Current chunk would be too big, save current and start new
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk = testChunk;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  // If we still have chunks that might be too long, split them further
  const finalChunks = [];
  for (const chunk of chunks) {
    if (chunk.length > maxChars) {
      // Split by paragraphs or even smaller units
      const paragraphs = chunk.split(/\n\s*\n/);
      let tempChunk = '';
      
      for (const paragraph of paragraphs) {
        if ((tempChunk + paragraph).length > maxChars && tempChunk) {
          finalChunks.push(tempChunk.trim());
          tempChunk = paragraph;
        } else {
          tempChunk += (tempChunk ? '\n\n' : '') + paragraph;
        }
      }
      
      if (tempChunk.trim()) {
        finalChunks.push(tempChunk.trim());
      }
    } else {
      finalChunks.push(chunk);
    }
  }
  
  return finalChunks;
}

// Helper function to merge audio chunks
async function mergeAudioChunks(audioChunks) {
  // For now, just concatenate the audio data
  // In a more sophisticated implementation, you might want to use ffmpeg
  const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const mergedBuffer = Buffer.alloc(totalLength);
  
  let offset = 0;
  for (const chunk of audioChunks) {
    chunk.copy(mergedBuffer, offset);
    offset += chunk.length;
  }
  
  return mergedBuffer;
}

// Función para síntesis de voz con Google Text-to-Speech
async function synthesizeSpeech(text, voiceId = 'female', speed = 1.0, useIntelligentPauses = true) {
  // Check if API key is configured
  if (!process.env.GOOGLE_TTS_API_KEY) {
    console.error('❌ GOOGLE_TTS_API_KEY no está configurada en las variables de entorno');
    throw new Error('Google TTS API key is not configured. Please set GOOGLE_TTS_API_KEY in your .env file');
  }

  // Very conservative estimation: SSML can be 3x larger than original text due to tags
  const estimatedSSMLSize = text.length * 3; // Very conservative estimate
  
  if (estimatedSSMLSize > 4000 || text.length > 1200) {
    console.log(`📏 Text is potentially long (${text.length} chars, estimated ${Math.round(estimatedSSMLSize)} bytes), splitting into chunks...`);
    
    const chunks = splitTextIntoChunks(text, 1200); // Much smaller chunks to be very safe
    console.log(`🔪 Split into ${chunks.length} chunks`);
    
    const audioChunks = [];
    
    for (let i = 0; i < chunks.length; i++) {
      console.log(`🎤 Processing chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)...`);
      
      try {
        const chunkAudio = await synthesizeSingleChunk(chunks[i], voiceId, speed, useIntelligentPauses);
        audioChunks.push(Buffer.from(chunkAudio));
        
        // Add a small delay between chunks to avoid rate limiting
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`❌ Error processing chunk ${i + 1}:`, error.message);
        throw error;
      }
    }
    
    console.log('🔗 Merging audio chunks...');
    const mergedAudio = await mergeAudioChunks(audioChunks);
    console.log(`✅ Successfully merged ${chunks.length} chunks into ${mergedAudio.length} bytes`);
    
    return mergedAudio;
  } else {
    // Text is short enough, process normally
    return await synthesizeSingleChunk(text, voiceId, speed, useIntelligentPauses);
  }
}

// Helper function to synthesize a single chunk
async function synthesizeSingleChunk(text, voiceId = 'female', speed = 1.0, useIntelligentPauses = true) {
  const textToSynthesize = useIntelligentPauses ? processTextWithIntelligentPauses(text) : `<speak>${escapeSSML(text)}</speak>`;
  
  // Check SSML size
  const ssmlBytes = Buffer.byteLength(textToSynthesize, 'utf8');
  console.log(`📏 SSML size: ${ssmlBytes} bytes`);
  
  if (ssmlBytes > 5000) {
    throw new Error(`SSML content is ${ssmlBytes} bytes, which exceeds the 5000-byte limit. Text needs to be split into smaller chunks.`);
  }
  
  console.log('🎛️ SSML inteligente generado automáticamente:');
  console.log(textToSynthesize.substring(0, 200) + '...');
  console.log('🎛️ Longitud del SSML: ', ssmlBytes, 'bytes');
  
  const voiceName = getGoogleVoiceName(voiceId);
  
  console.log(`Using voice: ${voiceName}`);
  console.log('Using language code: es-ES');
  console.log('Input type: SSML (pausas inteligentes automáticas)');
  console.log('🔑 Using API Key authentication');
  
  const request = {
    input: { ssml: textToSynthesize },
    voice: {
      languageCode: 'es-ES',
      name: voiceName,
      ssmlGender: voiceId === 'male' ? 'MALE' : 'FEMALE'
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: speed,
      volumeGainDb: 2.0
    }
  };

  try {
    const [response] = await speechClient.synthesizeSpeech(request);
    return response.audioContent;
  } catch (error) {
    console.error('Error en síntesis de voz:', error);
    throw error;
  }
}

// Inicializar cliente de Google Text-to-Speech con API Key
const textToSpeech = require('@google-cloud/text-to-speech');

// Initialize the client with API key authentication
const speechClient = new textToSpeech.TextToSpeechClient({
  apiKey: process.env.GOOGLE_TTS_API_KEY
});

// Log initialization status
if (process.env.GOOGLE_TTS_API_KEY) {
  console.log('✅ Google TTS Client initialized with API Key');
  console.log('🔑 API Key configured:', process.env.GOOGLE_TTS_API_KEY ? `${process.env.GOOGLE_TTS_API_KEY.substring(0, 10)}...` : 'NOT SET');
} else {
  console.warn('⚠️ GOOGLE_TTS_API_KEY not found in environment variables');
}

module.exports = {
  synthesizeSpeech,
  processTextWithIntelligentPauses,
  getGoogleVoiceName,
  escapeSSML,
  splitTextIntoChunks,
  synthesizeSingleChunk
}; 