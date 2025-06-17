console.log("🔥🔥🔥 ARCHIVO GOOGLETSSERVICE.JS VERSIÓN TURBO CARGADO 🔥🔥🔥");

// Load environment variables
require('dotenv').config();

// 🚀 IMPORTAR SISTEMA DE CACHÉ INTELIGENTE
const { audioCache } = require('./audioCache');

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
function splitTextIntoChunks(text, maxChars = 2800) { // 🔧 TAMAÑO ESTABLE para confiabilidad
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
    
    // 🚀 COMANDO FFMPEG OPTIMIZADO PARA MÁXIMA VELOCIDAD
    const ffmpegCommand = `"${FFMPEG_PATHS.ffmpeg}" -f concat -safe 0 -i "${concatListFile}" -c copy -avoid_negative_ts make_zero -fflags +genpts "${outputFile}"`;
    
    console.log('🔧 Ejecutando fusión FFmpeg optimizada...');
    console.log(`   Comando optimizado: ${ffmpegCommand}`);
    
    // ⚡ Ejecutar ffmpeg con configuración optimizada para velocidad
    const { stdout, stderr } = await execPromise(ffmpegCommand, { 
      timeout: 180000, // 3 minutos (reducido para mayor velocidad)
      maxBuffer: 1024 * 1024 * 100 // 100MB buffer para chunks grandes
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

  // 🚀 VERIFICAR CACHÉ PRIMERO PARA MÁXIMA VELOCIDAD
  const cacheKey = audioCache.generateCacheKey(text, voiceId, speed, useIntelligentPauses, title);
  console.log(`🔍 Verificando caché para: ${cacheKey}...`);
  
  try {
    if (await audioCache.exists(cacheKey)) {
      console.log('⚡ CACHÉ HIT - Audio encontrado, retornando inmediatamente');
      
      if (progressTracker) {
        progressTracker.startPhase('audio', 1000);
        progressTracker.updateProgress(100, { detail: 'Audio recuperado del caché' });
        progressTracker.completePhase();
      }
      
      const cachedStats = await audioCache.getStats();
      console.log(`📊 Stats del caché: ${cachedStats.entries} entradas, ${cachedStats.totalSizeMB}MB`);
      
      return await audioCache.get(cacheKey);
    }
  } catch (cacheError) {
    console.warn('⚠️ Error verificando caché, continuando con generación:', cacheError.message);
  }
  
  console.log('💫 CACHÉ MISS - Generando nuevo audio...');

  // 🚀 OPTIMIZACIÓN DE PARÁMETROS PARA MÁXIMA VELOCIDAD
  const estimatedSSMLSize = text.length * 2.5; // Estimación más realista
  const MAX_CHUNK_SIZE = 4500; // 🔧 AUMENTADO - solo dividir textos realmente largos
  const MAX_SSML_SIZE = 4500; // Límite más cercano al real de Google (5000)
  const MAX_PARALLEL_CHUNKS = 4; // 🔧 PARALELIZACIÓN ESTABLE para publicación
  
  // Solo usar modo turbo para textos realmente largos (>5000 caracteres)
  if (text.length > 5000) {
    console.log(`⚡ === MODO TURBO ACTIVADO - PROCESAMIENTO PARALELO ===`);
    console.log(`📏 Texto largo detectado (${text.length} chars, ~${Math.round(estimatedSSMLSize)} bytes SSML)`);
    console.log(`🚀 Usando chunks optimizados de ${MAX_CHUNK_SIZE} caracteres`);
    console.log(`⚡ Procesamiento paralelo: ${MAX_PARALLEL_CHUNKS} chunks simultáneos`);
    
    const chunks = splitTextIntoChunks(text, MAX_CHUNK_SIZE);
    console.log(`🔪 Dividido en ${chunks.length} chunks para procesamiento paralelo`);
    
    // Inicializar progreso si está disponible
    if (progressTracker) {
      progressTracker.startPhase('audio', chunks.length * 4000); // 🔧 ESTIMADO 4s por chunk (estable para publicación)
      progressTracker.updateProgress(5, { detail: 'Preparando síntesis turbo...' });
    }
    
    const audioChunks = new Array(chunks.length); // Array ordenado para mantener secuencia
    const startTime = Date.now();
    let completedChunks = 0;
    
    // 🚀 PIPELINE STREAMING: Fusionar chunks tan pronto como estén listos
    console.log(`🔥 MODO PIPELINE: Procesando ${MAX_PARALLEL_CHUNKS} chunks simultáneos con fusión streaming...`);
    
    for (let batchStart = 0; batchStart < chunks.length; batchStart += MAX_PARALLEL_CHUNKS) {
      const batchEnd = Math.min(batchStart + MAX_PARALLEL_CHUNKS, chunks.length);
      const batchSize = batchEnd - batchStart;
      
      console.log(`🎤 Procesando lote ${Math.floor(batchStart/MAX_PARALLEL_CHUNKS) + 1} (chunks ${batchStart + 1}-${batchEnd})...`);
      
      // Crear promesas para el lote actual
      const batchPromises = [];
      for (let i = batchStart; i < batchEnd; i++) {
        const chunkIndex = i;
        const chunkText = chunks[i];
        const chunkTitle = (i === 0) ? title : null; // Solo título en el primer chunk
        
        console.log(`   🚀 Iniciando chunk ${i + 1}/${chunks.length} en paralelo (${chunkText.length} chars)...`);
        
        // Crear promesa para este chunk con manejo de errores individualizado
        const chunkPromise = synthesizeSingleChunk(chunkText, voiceId, speed, useIntelligentPauses, chunkTitle)
          .then(chunkAudio => {
            console.log(`   ✅ Chunk ${chunkIndex + 1} completado en paralelo`);
            return { index: chunkIndex, audio: Buffer.from(chunkAudio) };
          })
          .catch(error => {
            console.error(`   ❌ Error en chunk ${chunkIndex + 1}:`, error.message);
            
            // Retry con delay si es rate limit
            if (error.message.includes('429') || error.message.includes('quota')) {
              console.log(`   🔄 Reintentando chunk ${chunkIndex + 1} por rate limit...`);
              return new Promise(resolve => setTimeout(resolve, 2000))
                .then(() => synthesizeSingleChunk(chunkText, voiceId, speed, useIntelligentPauses, chunkTitle))
                .then(chunkAudio => {
                  console.log(`   ✅ Chunk ${chunkIndex + 1} completado en reintento`);
                  return { index: chunkIndex, audio: Buffer.from(chunkAudio) };
                });
            }
            throw error;
          });
        
        batchPromises.push(chunkPromise);
      }
      
      // Esperar a que complete el lote actual
      try {
        const batchResults = await Promise.all(batchPromises);
        
        // Asignar resultados a sus posiciones correctas
        batchResults.forEach(result => {
          audioChunks[result.index] = result.audio;
        });
        
        const completedSoFar = batchEnd;
        const batchTime = Date.now() - startTime;
        console.log(`   ✅ Lote completado: ${completedSoFar}/${chunks.length} chunks (${batchTime}ms total)`);
        
        // Actualizar progreso
        if (progressTracker) {
          const progress = 10 + ((completedSoFar / chunks.length) * 80);
          progressTracker.updateProgress(progress, { 
            detail: `${completedSoFar}/${chunks.length} chunks completados en paralelo` 
          });
        }
        
        // 🔧 RATE LIMITING OPTIMIZADO para velocidad
        if (batchEnd < chunks.length) {
          const batchDelay = 200; // 🔧 REDUCIDO - solo prevenir rate limits
          console.log(`   🔧 Esperando ${batchDelay}ms antes del siguiente lote...`);
          await new Promise(resolve => setTimeout(resolve, batchDelay));
        }
        
      } catch (error) {
        console.error(`❌ Error en lote de chunks ${batchStart + 1}-${batchEnd}:`, error.message);
        if (progressTracker) {
          progressTracker.failPhase(error);
        }
        throw error;
      }
    }
    
    const totalTime = Date.now() - startTime;
    const avgTimePerChunk = Math.round(totalTime / chunks.length);
    const chunksPerSecond = Math.round((chunks.length / (totalTime / 1000)) * 100) / 100;
    console.log(`⚡ TURBO MODE COMPLETADO: ${chunks.length} chunks en ${totalTime}ms (${avgTimePerChunk}ms promedio)`);
    console.log(`🚀 Velocidad: ${chunksPerSecond} chunks/segundo`);
    
    // Progreso antes de fusionar
    if (progressTracker) {
      progressTracker.updateProgress(95, { detail: 'Fusionando audio paralelo...' });
    }
    
    console.log('🔗 Fusionando chunks procesados en paralelo...');
    const mergedAudio = await mergeAudioChunks(audioChunks);
    console.log(`✅ ${chunks.length} chunks fusionados: ${mergedAudio.length} bytes (MODO TURBO)`);
    
    // 🚀 GUARDAR EN CACHÉ PARA PRÓXIMAS GENERACIONES
    try {
      await audioCache.set(cacheKey, mergedAudio, { 
        voiceId, 
        speed, 
        chunks: chunks.length,
        mode: 'parallel' 
      });
      console.log(`💾 Audio guardado en caché: ${cacheKey}`);
    } catch (cacheError) {
      console.warn('⚠️ Error guardando en caché:', cacheError.message);
    }
    
    return mergedAudio;
  } else {
    // Text is short enough, process normally
    console.log('🎤 Texto corto - procesamiento directo (sin chunks)');
    const singleChunkAudio = await synthesizeSingleChunk(text, voiceId, speed, useIntelligentPauses, title);
    
    // 🚀 GUARDAR EN CACHÉ TAMBIÉN LOS TEXTOS CORTOS
    try {
      await audioCache.set(cacheKey, singleChunkAudio, { 
        voiceId, 
        speed, 
        chunks: 1,
        mode: 'single' 
      });
      console.log(`💾 Audio corto guardado en caché: ${cacheKey}`);
    } catch (cacheError) {
      console.warn('⚠️ Error guardando audio corto en caché:', cacheError.message);
    }
    
    return singleChunkAudio;
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
         volumeGainDb: 2.0 // MANTENER CALIDAD CHIRP3 HD - sin degradar sample rate
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
        volumeGainDb: 2.0 // MANTENER CALIDAD CHIRP3 HD - sin degradar sample rate  
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