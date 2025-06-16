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
    // Español España - UPGRADED TO CHIRP3 HD (BEST FOR STORYTELLING)
    case 'male':
    case 'male-spanish':
      return 'es-ES-Chirp3-HD-Achird'; // PREMIUM STORYTELLING VOICE
    case 'female':
    case 'female-spanish':
      return 'es-ES-Chirp3-HD-Achernar'; // PREMIUM STORYTELLING VOICE
    
    // Español Latinoamérica - UPGRADED TO CHIRP3 HD
    case 'female-latam':
      return 'es-US-Chirp3-HD-Achernar'; // PREMIUM STORYTELLING VOICE
    case 'male-latam':
      return 'es-US-Chirp3-HD-Achird'; // PREMIUM STORYTELLING VOICE
    
    // Inglés - UPGRADED TO CHIRP3 HD (BEST FOR STORYTELLING)
    case 'female-english':
      return 'en-US-Chirp3-HD-Achernar'; // PREMIUM STORYTELLING VOICE
    case 'male-english':
      return 'en-US-Chirp3-HD-Achird'; // PREMIUM STORYTELLING VOICE
    
    // Catalán - Mantener Standard (no hay opciones premium)
    case 'female-catalan':
      return 'ca-ES-Standard-A';
    case 'male-catalan':
      return 'ca-ES-Standard-B';
    
    // Gallego - Mantener Standard (no hay opciones premium)
    case 'female-galician':
      return 'gl-ES-Standard-A';
    case 'male-galician':
      return 'gl-ES-Standard-B';
    
    // Euskera - Mantener Standard (no hay opciones premium)
    case 'female-basque':
      return 'eu-ES-Standard-A';
    case 'male-basque':
      return 'eu-ES-Standard-B';
    
    // Alemán - UPGRADED TO CHIRP3 HD
    case 'female-german':
      return 'de-DE-Chirp3-HD-Achernar'; // PREMIUM STORYTELLING VOICE
    case 'male-german':
      return 'de-DE-Chirp3-HD-Achird'; // PREMIUM STORYTELLING VOICE
    
    // Italiano - UPGRADED TO CHIRP3 HD
    case 'female-italian':
      return 'it-IT-Chirp3-HD-Achernar'; // PREMIUM STORYTELLING VOICE
    case 'male-italian':
      return 'it-IT-Chirp3-HD-Achird'; // PREMIUM STORYTELLING VOICE
    
    // Francés - UPGRADED TO CHIRP3 HD (BEST FOR STORYTELLING)
    case 'female-french':
      return 'fr-FR-Chirp3-HD-Achernar'; // PREMIUM STORYTELLING VOICE
    case 'male-french':
      return 'fr-FR-Chirp3-HD-Achird'; // PREMIUM STORYTELLING VOICE
    
    // Portugués de Portugal - UPGRADED TO CHIRP3 HD
    case 'female-portuguese-pt':
      return 'pt-PT-Chirp3-HD-Achernar'; // PREMIUM STORYTELLING VOICE
    case 'male-portuguese-pt':
      return 'pt-PT-Chirp3-HD-Achird'; // PREMIUM STORYTELLING VOICE
    
    // Portugués de Brasil - UPGRADED TO CHIRP3 HD
    case 'female-portuguese-br':
      return 'pt-BR-Chirp3-HD-Achernar'; // PREMIUM STORYTELLING VOICE
    case 'male-portuguese-br':
      return 'pt-BR-Chirp3-HD-Achird'; // PREMIUM STORYTELLING VOICE
    
    default:
      return 'es-ES-Chirp3-HD-Achernar'; // Default to premium female Spanish storytelling voice
  }
}

// Helper function to check if voice is Chirp3 HD
function isChirp3HDVoice(voiceName) {
  return voiceName && voiceName.includes('Chirp3-HD');
}

// Helper function to process text for Chirp3 HD voices (no SSML, just clean text)
function processTextForChirp3HD(text, title = null) {
  console.log("🎵 === PROCESAMIENTO PARA CHIRP3 HD (SOLO TEXTO LIMPIO) ===");
  console.log("📝 Texto original (primeros 100 caracteres):", text.substring(0, 100) + "...");
  
  let processedText = text;
  
  // Si tenemos un título separado, agregarlo al principio de forma natural
  if (title) {
    console.log(`🎯 TÍTULO SEPARADO DETECTADO: "${title}"`);
    processedText = `${title}. ${processedText}`;
  }
  
  // Limpiar el texto y dejarlo natural para que Chirp3 HD haga su magia
  processedText = processedText
    // Limpiar saltos de línea excesivos
    .replace(/\n\s*\n/g, ' ')
    // Normalizar espacios
    .replace(/\s+/g, ' ')
    // Limpiar espacios al inicio y final
    .trim();
  
  console.log("✅ Texto procesado para Chirp3 HD - TEXTO LIMPIO SIN PAUSAS ARTIFICIALES");
  console.log("🎵 === USANDO ENTONACIÓN NATURAL DE CHIRP3 HD ===");
  
  return processedText;
}

// Helper function to get language code based on voice ID
function getLanguageCode(voiceId) {
  switch (voiceId) {
    // Español España y Latinoamérica
    case 'male':
    case 'female':
    case 'male-spanish':
    case 'female-spanish':
    case 'female-latam':
    case 'male-latam':
      return 'es-ES';
    
    // Inglés
    case 'female-english':
    case 'male-english':
      return 'en-US';
    
    // Catalán
    case 'female-catalan':
    case 'male-catalan':
      return 'ca-ES';
    
    // Gallego
    case 'female-galician':
    case 'male-galician':
      return 'gl-ES';
    
    // Euskera
    case 'female-basque':
    case 'male-basque':
      return 'eu-ES';
    
    // Alemán
    case 'female-german':
    case 'male-german':
      return 'de-DE';
    
    // Italiano
    case 'female-italian':
    case 'male-italian':
      return 'it-IT';
    
    // Francés
    case 'female-french':
    case 'male-french':
      return 'fr-FR';
    
    // Portugués de Portugal
    case 'female-portuguese-pt':
    case 'male-portuguese-pt':
      return 'pt-PT';
    
    // Portugués de Brasil
    case 'female-portuguese-br':
    case 'male-portuguese-br':
      return 'pt-BR';
    
    default:
      return 'es-ES'; // Default to Spanish
  }
}

// Helper function to process text and add intelligent pauses automatically
function processTextWithIntelligentPauses(text, title = null) {
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
  
  // Detectar y contar títulos encontrados para debugging
  let titlesFound = 0;
  
  // Si tenemos un título separado, agregarlo al principio con pausa
  if (title) {
    const escapedTitle = escapeSSML(title);
    console.log(`🎯 TÍTULO SEPARADO DETECTADO: "${title}" → Punto + 1s natural`);
    titlesFound++;
    processedText = `${escapedTitle}.<break time="${naturalPauses.titlePause}"/> ${processedText}`;
  }
  
  // 1. Detectar títulos que empiezan con artículos franceses/español/etc
  processedText = processedText.replace(/^(L'|Le |La |Les |El |La |Los |Las |Das |Der |Die |Il |Un |Une |The |A )([A-ZÁÉÍÓÚÑÜÇÀÈÊËÎÏÔÖÙÛÜŸÂÄÔÖÛÜŸĆČĐŠŽÆØÅÄÖÜ][^.\n!?]{2,50})$/gm, (match, article, titlePart) => {
    const fullTitle = article + titlePart;
    console.log(`🎯 TÍTULO CON ARTÍCULO: "${fullTitle}" → Punto + 1s natural`);
    titlesFound++;
    return `${fullTitle}.<break time="${naturalPauses.titlePause}"/>`;
  });
  
  // 2. Detectar títulos simples (líneas cortas que parecen títulos) - MEJORADO
  processedText = processedText.replace(/^([A-ZÁÉÍÓÚÑÜÇÀÈÊËÎÏÔÖÙÛÜŸÂÄÔÖÛÜŸĆČĐŠŽÆØÅÄÖÜ][^.\n!?]{3,40})$/gm, (match, possibleTitle) => {
    // Evitar oraciones comunes en múltiples idiomas pero ser permisivo
    if (!/\b(había una vez|en un|vivía|tenía|estaba|era muy|fue cuando|después de|il était une fois|once upon a time|es war einmal|c'era una volta|puis|ensuite|alors|mais|cependant)\b/i.test(possibleTitle)) {
      console.log(`🎯 TÍTULO SIMPLE: "${possibleTitle}" → Punto + 1s natural`);
      titlesFound++;
      // Solo punto final + pausa de 1 segundo, nada más
      return `${possibleTitle}.<break time="${naturalPauses.titlePause}"/>`;
    }
    return match;
  });
  
  // 3. Títulos con formato "CAPÍTULO X" o similares en múltiples idiomas
  processedText = processedText.replace(/^(CAPÍTULO\s+\d+|CHAPTER\s+\d+|PARTIE\s+\d+|CHAPITRE\s+\d+|KAPITEL\s+\d+|CAPITOLO\s+\d+)(.*)$/gmi, (match, chapterWord, rest) => {
    console.log(`📚 CAPÍTULO: "${match}" → Punto + 1s natural`);
    titlesFound++;
    const fullTitle = chapterWord + rest;
    return `${fullTitle}.<break time="${naturalPauses.titlePause}"/>`;
  });
  
  // 4. Títulos con dos puntos al final - ACTUALIZADO con caracteres internacionales
  processedText = processedText.replace(/^([A-ZÁÉÍÓÚÑÜÇÀÈÊËÎÏÔÖÙÛÜŸÂÄÔÖÛÜŸĆČĐŠŽÆØÅÄÖÜ][^:\n]{5,}:)\s*$/gm, (match, titleWithColon) => {
    console.log(`📝 TÍTULO CON ":" → Solo 1s natural`);
    titlesFound++;
    // Los dos puntos ya dan entonación natural, solo pausa
    return `${titleWithColon}<break time="${naturalPauses.titlePause}"/>`;
  });
  
  // 5. Patrones específicos de títulos franceses más flexibles
  processedText = processedText.replace(/^(.*(?:Histoire|Aventure|Conte|Récit|Légende|Fable|Roman).*?)$/gmi, (match, frenchTitle) => {
    // Solo si es una línea corta y no tiene punto final
    if (frenchTitle.length < 60 && !/[.!?]$/.test(frenchTitle)) {
      console.log(`🇫🇷 TÍTULO FRANCÉS ESPECÍFICO: "${frenchTitle}" → Punto + 1s natural`);
      titlesFound++;
      return `${frenchTitle}.<break time="${naturalPauses.titlePause}"/>`;
    }
    return match;
  });
  
  // Limpiar espacios múltiples (solo esto)
  processedText = processedText.replace(/\s+/g, ' ').trim();
  
  // Envolver en SSML simple
  const finalSSML = `<speak>${processedText}</speak>`;
  
  console.log(`✅ Títulos detectados: ${titlesFound}`);
  console.log(`✅ Audio completamente natural - Solo ${(finalSSML.match(/<break/g) || []).length} pausas mínimas`);
  console.log("🎵 === TODO LO DEMÁS ES NATURAL ===");
  
  // Si no se detectaron títulos (y no teníamos título separado), mostrar las primeras líneas para debugging
  if (titlesFound === 0 && !title) {
    const lines = text.split('\n').slice(0, 3);
    console.log("🔍 DEBUGGING - Primeras 3 líneas del texto:");
    lines.forEach((line, i) => {
      console.log(`   Línea ${i+1}: "${line}"`);
    });
  }
  
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
  console.log('🔧 === FUSIONANDO CHUNKS DE AUDIO CON FFMPEG ===');
  console.log(`📊 Total de chunks: ${audioChunks.length}`);
  
  // Si solo hay un chunk, devolverlo directamente
  if (audioChunks.length === 1) {
    console.log('✅ Solo un chunk, no necesita fusión');
    return audioChunks[0];
  }
  
  const fs = require('fs').promises;
  const path = require('path');
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execPromise = promisify(exec);
  
  try {
    // Crear directorio temporal
    const tempDir = path.join(__dirname, '../temp/audio-chunks');
    await fs.mkdir(tempDir, { recursive: true });
    
    const timestamp = Date.now();
    const chunkFiles = [];
    const concatListFile = path.join(tempDir, `concat_list_${timestamp}.txt`);
    const outputFile = path.join(tempDir, `merged_audio_${timestamp}.mp3`);
    
    // Guardar cada chunk como archivo temporal
    console.log('💾 Guardando chunks temporales...');
    for (let i = 0; i < audioChunks.length; i++) {
      const chunkFile = path.join(tempDir, `chunk_${timestamp}_${i}.mp3`);
      await fs.writeFile(chunkFile, audioChunks[i]);
      chunkFiles.push(chunkFile);
      console.log(`   📁 Chunk ${i + 1}: ${chunkFile}`);
    }
    
    // Crear archivo de lista para ffmpeg concat
    const concatList = chunkFiles.map(file => `file '${file}'`).join('\n');
    await fs.writeFile(concatListFile, concatList);
    console.log(`📝 Lista de concatenación creada: ${concatListFile}`);
    
    // Verificar que ffmpeg está disponible
    const FFMPEG_PATHS = require('../config/ffmpeg');
    const ffmpegCommand = `"${FFMPEG_PATHS.ffmpeg}" -f concat -safe 0 -i "${concatListFile}" -c copy "${outputFile}"`;
    
    console.log('🔧 Ejecutando comando ffmpeg para fusión...');
    console.log(`   Comando: ${ffmpegCommand}`);
    
    // Ejecutar ffmpeg con timeout extendido para chunks grandes
    const { stdout, stderr } = await execPromise(ffmpegCommand, { 
      timeout: 300000, // 5 minutos para fusión
      maxBuffer: 1024 * 1024 * 50 // 50MB buffer
    });
    
    if (stderr) {
      console.log('📋 FFmpeg stderr:', stderr);
    }
    
    // Leer el archivo fusionado
    console.log('📖 Leyendo audio fusionado...');
    const mergedAudio = await fs.readFile(outputFile);
    console.log(`✅ Audio fusionado exitosamente: ${mergedAudio.length} bytes`);
    
    // Limpiar archivos temporales
    console.log('🧹 Limpiando archivos temporales...');
    try {
      await fs.unlink(concatListFile);
      await fs.unlink(outputFile);
      for (const chunkFile of chunkFiles) {
        await fs.unlink(chunkFile);
      }
      console.log('✅ Limpieza completada');
    } catch (cleanupError) {
      console.warn('⚠️ Error en limpieza (no crítico):', cleanupError.message);
    }
    
    return mergedAudio;
    
  } catch (error) {
    console.error('❌ Error fusionando chunks con ffmpeg:', error.message);
    console.log('🔄 Fallback: Intentando fusión simple (puede causar problemas)...');
    
    // Fallback: concatenación simple (NO RECOMENDADO para MP3)
    const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const mergedBuffer = Buffer.alloc(totalLength);
    
    let offset = 0;
    for (const chunk of audioChunks) {
      chunk.copy(mergedBuffer, offset);
      offset += chunk.length;
    }
    
    console.warn('⚠️ Se usó fusión simple - el audio puede tener problemas');
    return mergedBuffer;
  }
}

// Función para síntesis de voz con Google Text-to-Speech
async function synthesizeSpeech(text, voiceId = 'female', speed = 1.0, useIntelligentPauses = true, title = null, progressTracker = null) {
  // Check if API key is configured
  if (!process.env.GOOGLE_TTS_API_KEY) {
    console.error('❌ GOOGLE_TTS_API_KEY no está configurada en las variables de entorno');
    throw new Error('Google TTS API key is not configured. Please set GOOGLE_TTS_API_KEY in your .env file');
  }

  // Optimización de parámetros para mejor rendimiento
  const estimatedSSMLSize = text.length * 2.5; // Estimación más realista
  const MAX_CHUNK_SIZE = 2000; // Chunks más grandes para menos llamadas API
  const MAX_SSML_SIZE = 4500; // Límite más cercano al real de Google (5000)
  
  if (estimatedSSMLSize > MAX_SSML_SIZE || text.length > MAX_CHUNK_SIZE) {
    console.log(`⚡ === OPTIMIZACIÓN DE VELOCIDAD ACTIVADA ===`);
    console.log(`📏 Texto largo detectado (${text.length} chars, ~${Math.round(estimatedSSMLSize)} bytes SSML)`);
    console.log(`🚀 Usando chunks optimizados de ${MAX_CHUNK_SIZE} caracteres`);
    
    // Inicializar progreso si está disponible
    if (progressTracker) {
      progressTracker.startPhase('audio', chunks.length * 8000); // Estimado 8s por chunk
      progressTracker.updateProgress(5, { detail: 'Preparando síntesis de voz...' });
    }
    
    const chunks = splitTextIntoChunks(text, MAX_CHUNK_SIZE);
    console.log(`🔪 Dividido en ${chunks.length} chunks (menos llamadas = más rápido)`);
    
    const audioChunks = [];
    const startTime = Date.now();
    
    // Procesamiento con rate limiting inteligente y progreso
    for (let i = 0; i < chunks.length; i++) {
      const chunkStartTime = Date.now();
      console.log(`🎤 Procesando chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)...`);
      
      // Actualizar progreso
      if (progressTracker) {
        const progress = 10 + ((i / chunks.length) * 80); // 10% inicial + 80% para chunks
        progressTracker.updateProgress(progress, { 
          detail: `Sintetizando chunk ${i + 1}/${chunks.length}...` 
        });
      }
      
      try {
        // Solo pasar título al primer chunk
        const chunkTitle = (i === 0) ? title : null;
        const chunkAudio = await synthesizeSingleChunk(chunks[i], voiceId, speed, useIntelligentPauses, chunkTitle);
        audioChunks.push(Buffer.from(chunkAudio));
        
        const chunkTime = Date.now() - chunkStartTime;
        console.log(`   ✅ Chunk ${i + 1} completado en ${chunkTime}ms`);
        
        // Actualizar progreso después del chunk
        if (progressTracker) {
          const progress = 10 + (((i + 1) / chunks.length) * 80);
          progressTracker.updateProgress(progress, { 
            detail: `Chunk ${i + 1}/${chunks.length} completado (${chunkTime}ms)` 
          });
        }
        
        // Rate limiting inteligente basado en el tiempo de respuesta
        if (i < chunks.length - 1) {
          const delay = Math.max(500, Math.min(2000, chunkTime * 0.3)); // Entre 500ms y 2s
          console.log(`   ⏳ Esperando ${delay}ms antes del siguiente chunk...`);
          
          // Mostrar progreso durante la espera
          if (progressTracker) {
            progressTracker.logProgress(`Esperando ${delay}ms antes del siguiente chunk`, { chunkCompleted: i + 1 });
          }
          
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        console.error(`❌ Error procesando chunk ${i + 1}:`, error.message);
        
        // Actualizar progreso con error
        if (progressTracker) {
          progressTracker.logProgress(`Error en chunk ${i + 1}, reintentando...`, { error: error.message });
        }
        
        // Retry con backoff exponencial
        if (error.message.includes('429') || error.message.includes('quota')) {
          console.log(`🔄 Rate limit detectado, esperando antes de reintentar...`);
          const retryDelay = Math.min(10000, 1000 * Math.pow(2, i)); // Backoff exponencial
          
          if (progressTracker) {
            progressTracker.updateProgress(10 + ((i / chunks.length) * 80), { 
              detail: `Rate limit - esperando ${retryDelay}ms...` 
            });
          }
          
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          
          // Reintentar una vez
          try {
            const chunkTitle = (i === 0) ? title : null;
            const chunkAudio = await synthesizeSingleChunk(chunks[i], voiceId, speed, useIntelligentPauses, chunkTitle);
            audioChunks.push(Buffer.from(chunkAudio));
            console.log(`   ✅ Chunk ${i + 1} completado en reintento`);
            
            if (progressTracker) {
              progressTracker.logProgress(`Chunk ${i + 1} completado en reintento`, { success: true });
            }
          } catch (retryError) {
            console.error(`❌ Error en reintento del chunk ${i + 1}:`, retryError.message);
            if (progressTracker) {
              progressTracker.failPhase(retryError);
            }
            throw retryError;
          }
        } else {
          if (progressTracker) {
            progressTracker.failPhase(error);
          }
          throw error;
        }
      }
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`⚡ Todos los chunks procesados en ${totalTime}ms (${Math.round(totalTime/chunks.length)}ms promedio por chunk)`)
    
    // Progreso antes de fusionar
    if (progressTracker) {
      progressTracker.updateProgress(95, { detail: 'Fusionando chunks de audio...' });
    }
    
    console.log('🔗 Merging audio chunks...');
    const mergedAudio = await mergeAudioChunks(audioChunks);
    console.log(`✅ Successfully merged ${chunks.length} chunks into ${mergedAudio.length} bytes`);
    
    return mergedAudio;
  } else {
    // Text is short enough, process normally
    return await synthesizeSingleChunk(text, voiceId, speed, useIntelligentPauses, title);
  }
}

// Helper function to synthesize a single chunk
async function synthesizeSingleChunk(text, voiceId = 'female', speed = 1.0, useIntelligentPauses = true, title = null) {
  const voiceName = getGoogleVoiceName(voiceId);
  const languageCode = getLanguageCode(voiceId);
  
  console.log(`🎤 === VOICE MAPPING DEBUG ===`);
  console.log(`🎯 VoiceId input: "${voiceId}"`);
  console.log(`🎤 Google voice name: "${voiceName}"`);
  console.log(`🌍 Language code: "${languageCode}"`);
  console.log(`⚡ Speed: ${speed}x`);
  console.log(`🎵 Is Chirp3 HD: ${isChirp3HDVoice(voiceName)}`);
  console.log(`===========================`);
  
  let request;
  let textToSynthesize;
  
  // Check if this is a Chirp3 HD voice
  if (isChirp3HDVoice(voiceName)) {
    // Chirp3 HD voices don't support SSML, use markup instead
    textToSynthesize = useIntelligentPauses ? processTextForChirp3HD(text, title) : text;
    
         console.log('📝 Tipo de entrada: TEXT con pausas nativas (Chirp3 HD)');
     console.log('🎛️ Texto con pausas nativas generado:');
    console.log(textToSynthesize.substring(0, 200) + '...');
    
         request = {
       input: { text: textToSynthesize },
       voice: {
         languageCode: languageCode,
         name: voiceName
       },
       audioConfig: {
         audioEncoding: 'MP3',
         speakingRate: speed,
         volumeGainDb: 2.0
       }
     };
  } else {
    // Traditional voices support SSML
    textToSynthesize = useIntelligentPauses ? processTextWithIntelligentPauses(text, title) : `<speak>${escapeSSML(text)}</speak>`;
    
    // Check SSML size
    const ssmlBytes = Buffer.byteLength(textToSynthesize, 'utf8');
    console.log(`📏 SSML size: ${ssmlBytes} bytes`);
    
    if (ssmlBytes > 5000) {
      throw new Error(`SSML content is ${ssmlBytes} bytes, which exceeds the 5000-byte limit. Text needs to be split into smaller chunks.`);
    }
    
    console.log('📝 Tipo de entrada: SSML (pausas inteligentes automáticas)');
    console.log('🎛️ SSML inteligente generado automáticamente:');
    console.log(textToSynthesize.substring(0, 200) + '...');
    console.log('🎛️ Longitud del SSML: ', ssmlBytes, 'bytes');
    
    request = {
      input: { ssml: textToSynthesize },
      voice: {
        languageCode: languageCode,
        name: voiceName,
        ssmlGender: voiceId.includes('male') && !voiceId.includes('female') ? 'MALE' : 'FEMALE'
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: speed,
        volumeGainDb: 2.0
      }
    };
  }
  
  console.log('🔑 Autenticación: API Key');

  try {
    console.log(`🚀 Enviando solicitud a Google TTS...`);
    const [response] = await speechClient.synthesizeSpeech(request);
    console.log(`✅ Audio generado exitosamente (${response.audioContent.length} bytes)`);
    return response.audioContent;
  } catch (error) {
    console.error('❌ Error en síntesis de voz:', error);
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
  processTextForChirp3HD,
  getGoogleVoiceName,
  getLanguageCode,
  escapeSSML,
  splitTextIntoChunks,
  synthesizeSingleChunk,
  isChirp3HDVoice
}; 