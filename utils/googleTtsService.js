const axios = require('axios');


// Helper function to map our voice IDs to Google's voice names

function getGoogleVoiceName(voiceId) {
  switch (voiceId) {
    // Español - CORREGIDO según error de Google (F=MALE, E=FEMALE)
    case 'female':
      return 'es-ES-Neural2-E';  // FEMALE confirmado por Google
    case 'male':
      return 'es-ES-Neural2-F';  // MALE confirmado por Google
    case 'female-latam':
      return 'es-US-Neural2-A';
    case 'male-latam':
      return 'es-US-Neural2-B';
    
    // Inglés - ACTUALIZADO con voces optimizadas para storytelling
    case 'female-english':
      return 'en-US-Neural2-F';  // Excelente para narración
    case 'male-english':
      return 'en-US-Neural2-J';  // Optimizada para storytelling masculino
    
    // Catalán
    case 'female-catalan':
      return 'ca-ES-Standard-A';
    case 'male-catalan':
      return 'ca-ES-Standard-B';
    
    // Gallego
    case 'female-galician':
      return 'gl-ES-Standard-A';
    case 'male-galician':
      return 'gl-ES-Standard-B';
    
    // Euskera
    case 'female-basque':
      return 'eu-ES-Standard-A';
    case 'male-basque':
      return 'eu-ES-Standard-B';
    
    // Alemán - ACTUALIZADO con las mejores Neural2
    case 'female-german':
      return 'de-DE-Neural2-G';  // Optimizada para narración femenina
    case 'male-german':
      return 'de-DE-Neural2-H';  // Optimizada para narración masculina
    
    // Italiano - ACTUALIZADO con las mejores Neural2
    case 'female-italian':
      return 'it-IT-Neural2-E';  // Optimizada para narración femenina
    case 'male-italian':
      return 'it-IT-Neural2-F';  // Optimizada para narración masculina
    
    // Francés - ACTUALIZADO con las mejores Neural2
    case 'female-french':
      return 'fr-FR-Neural2-F';  // Optimizada para narración femenina
    case 'male-french':
      return 'fr-FR-Neural2-G';  // Optimizada para narración masculina
    
    default:
      return 'es-ES-Neural2-F';  // Voz por defecto optimizada para narración
  }
}

// Helper function to process text and add intelligent pauses automatically
function processTextWithIntelligentPauses(text) {
  console.log("🎛️ === APLICANDO PAUSAS INTELIGENTES AUTOMÁTICAS ===");
  console.log("📝 Texto original (primeros 100 caracteres):", text.substring(0, 100) + "...");
  
  // Configuración optimizada para fluidez y naturalidad máxima
  const intelligentPauses = {
    sentencePause: '0.6s',      // Pausas más naturales entre oraciones
    paragraphPause: '1.2s',     // Respiración suave entre párrafos
    dialoguePause: '1.0s',      // Cambio natural entre diálogos
    chapterPause: '2.0s',       // Transición suave entre capítulos
    shortPhrasePause: '0.3s',   // Micro-pausas muy sutiles
    longSentencePause: '0.8s'   // Pausas moderadas en oraciones complejas
  };

  console.log("⚙️ Configuración de pausas naturales:");
  console.log("   - Oraciones normales: 0.6s");
  console.log("   - Oraciones largas: 0.8s");
  console.log("   - Párrafos: 1.2s");
  console.log("   - Diálogos: 1.0s");
  console.log("   - Capítulos: 2.0s");

  // Preparar el texto para procesamiento inteligente
  let processedText = polishTextForNaturalFlow(text);
  
  // Procesar línea por línea para control preciso
  let lines = processedText.split('\n');
  let processedLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    // Saltar líneas vacías y añadir pausas de párrafo
    if (line === '') {
      if (processedLines.length > 0 && processedLines[processedLines.length - 1] !== '') {
        processedLines.push(`<break time="${intelligentPauses.paragraphPause}"/>`);
      }
      continue;
    }
    
    // Detectar y procesar títulos/capítulos con entonación natural
    const isChapterTitle = /^[A-ZÁÉÍÓÚÑÜÇ][A-ZÁÉÍÓÚÑÜÇ\s]+$/.test(line) || 
                          /^CAPÍTULO\s+/i.test(line) ||
                          /^CHAPTER\s+/i.test(line) ||
                          /^[A-ZÁÉÍÓÚÑÜÇ\s]+:\s*/i.test(line);
    
    if (isChapterTitle) {
      processedLines.push(`<break time="${intelligentPauses.chapterPause}"/>`);
      // Títulos con entonación muy natural y suave
      processedLines.push(`<prosody rate="0.95" pitch="-0.5st" volume="medium">${line}</prosody>`);
      processedLines.push(`<break time="${intelligentPauses.chapterPause}"/>`);
      console.log(`📚 Capítulo con entonación natural suave: "${line}"`);
      continue;
    }
    
    // Procesar diálogos con entonación muy natural y conversacional
    line = line.replace(/"([^"]+)"/g, (match, dialogue) => {
      // Diálogos con entonación apenas perceptible, muy natural
      return `<break time="0.2s"/><prosody rate="1.01" pitch="+0.2st">"${dialogue}"</prosody>`;
    });
    
    // Pausas inteligentes basadas en la longitud y complejidad de la oración
    line = processIntelligentSentencePauses(line, intelligentPauses);
    
    // Respiración muy sutil antes de conjunciones
    line = line.replace(/,\s+(y|pero|aunque|sin embargo|además)\s+/gi, (match, conjunction) => {
      return `, <break time="${intelligentPauses.shortPhrasePause}"/>${conjunction.trim()} `;
    });
    
    processedLines.push(line);
  }
  
  // Unir todas las líneas con espaciado natural
  let ssmlText = processedLines.join(' ').replace(/\s+/g, ' ').trim();
  
  // Aplicar ajustes finales para fluidez
  ssmlText = addNaturalBreathing(ssmlText, intelligentPauses);
  
  // Envolver en etiquetas SSML
  const finalSSML = `<speak>${ssmlText}</speak>`;
  
  // Contar pausas aplicadas
  const totalPauses = (finalSSML.match(/<break time="[^"]+"/g) || []).length;
  console.log(`✅ SSML inteligente generado con ${totalPauses} pausas naturales`);
  
  // Log de muestra para debugging
  console.log("📄 Primeros 200 caracteres del SSML:");
  console.log(finalSSML.substring(0, 200) + "...");
  console.log("🎛️ === FIN PROCESAMIENTO INTELIGENTE ===");
  
  return finalSSML;
}

// Función auxiliar para pulir el texto y hacerlo más natural
function polishTextForNaturalFlow(text) {
  // Expandir abreviaciones para pronunciación natural
  text = text.replace(/Sr\./g, 'Señor');
  text = text.replace(/Sra\./g, 'Señora');
  text = text.replace(/Dr\./g, 'Doctor');
  text = text.replace(/etc\./g, 'etcétera');
  
  // Números en palabras para mayor fluidez
  text = text.replace(/\b1\b/g, 'uno');
  text = text.replace(/\b2\b/g, 'dos');
  text = text.replace(/\b3\b/g, 'tres');
  text = text.replace(/\b4\b/g, 'cuatro');
  text = text.replace(/\b5\b/g, 'cinco');
  
  return text;
}

// Función para procesar pausas inteligentes en oraciones
function processIntelligentSentencePauses(sentence, pauses) {
  // Oraciones largas (más de 80 caracteres) necesitan pausas más largas
  const isLongSentence = sentence.length > 80;
  const pauseToUse = isLongSentence ? pauses.longSentencePause : pauses.sentencePause;
  
  // Entonación muy sutil y natural al final de oraciones declarativas
  sentence = sentence.replace(/([^.!?]+)([.])(\s+|$)/g, (match, content, punct, space) => {
    return `<prosody pitch="-0.3st">${content}</prosody>${punct}<break time="${pauseToUse}"/>${space}`;
  });
  
  // Entonación natural para signos de exclamación
  sentence = sentence.replace(/([^.!?]+)([!])(\s+|$)/g, (match, content, punct, space) => {
    return `<prosody pitch="+0.5st">${content}</prosody>${punct}<break time="${pauseToUse}"/>${space}`;
  });
  
  // Entonación ligeramente ascendente para preguntas
  sentence = sentence.replace(/([^.!?]+)([?])(\s+|$)/g, (match, content, punct, space) => {
    return `<prosody pitch="+0.8st">${content}</prosody>${punct}<break time="${pauseToUse}"/>${space}`;
  });
  
  // Si la oración termina con puntuación pero no se procesó arriba, añadir pausa
  if (/[.!?]$/.test(sentence.trim()) && !sentence.includes('<break time=')) {
    sentence = sentence + `<break time="${pauseToUse}"/>`;
  }
  
  // Pausas muy sutiles después de comas en oraciones largas
  if (isLongSentence) {
    sentence = sentence.replace(/([^,]+),(\s+)/g, (match, beforeComma, space) => {
      return `${beforeComma},<break time="${pauses.shortPhrasePause}"/>${space}`;
    });
  }
  
  return sentence;
}

// Función para añadir respiración natural
function addNaturalBreathing(text, pauses) {
  // Respiración antes de frases importantes
  text = text.replace(/(\. )([A-Z][a-z]+(mente|ción|dad|mente))/g, `$1<break time="${pauses.shortPhrasePause}"/>$2`);
  
  // Micro-pausas antes de adverbios de tiempo
  text = text.replace(/(\s)(entonces|después|luego|finalmente|mientras tanto)/gi, `$1<break time="${pauses.shortPhrasePause}"/>$2`);
  
  return text;
}

exports.synthesizeSpeech = async (text, voiceId, speechRate) => {
  try {
    // Debugging logs
    console.log("=============== DEBUG INFO ===============");
    console.log("Texto recibido:", text.substring(0, 30) + "...");
    console.log("Voz seleccionada:", voiceId);
    console.log("Pausas inteligentes: ACTIVADAS AUTOMÁTICAMENTE");
    console.log("API Key configurada:", process.env.GOOGLE_TTS_API_KEY ? "Sí (longitud: " + process.env.GOOGLE_TTS_API_KEY.length + ")" : "No");
    console.log("==========================================");
    
    // Ensure the API key is defined
    const apiKey = process.env.GOOGLE_TTS_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_TTS_API_KEY is not defined');
    }

    // Map our voice IDs to Google's voice names
    const voiceName = getGoogleVoiceName(voiceId);
    
    // Determinar el código de idioma correcto
    let languageCode;
    if (voiceId.includes('english')) {
      languageCode = 'en-US';
    } else if (voiceId.includes('latam')) {
      languageCode = 'es-US';
    } else if (voiceId.includes('catalan')) {
      languageCode = 'ca-ES';
    } else if (voiceId.includes('galician')) {
      languageCode = 'gl-ES';
    } else if (voiceId.includes('basque')) {
      languageCode = 'eu-ES';
    } else if (voiceId.includes('german')) {
      languageCode = 'de-DE';
    } else if (voiceId.includes('italian')) {
      languageCode = 'it-IT';
    } else if (voiceId.includes('french')) {
      languageCode = 'fr-FR';
    } else {
      languageCode = 'es-ES';
    }
    
    // Determinar el género correcto según las voces Neural2 españolas
    let ssmlGender;
    if (voiceId === 'female') {
      ssmlGender = 'FEMALE';  // es-ES-Neural2-E es FEMALE
    } else if (voiceId === 'male') {
      ssmlGender = 'MALE';    // es-ES-Neural2-F es MALE
    } else {
      // Para otras voces, usar la lógica anterior
      ssmlGender = voiceId.includes('male') && !voiceId.includes('female') ? 'MALE' : 'FEMALE';
    }
    
    // Aplicar pausas inteligentes automáticamente para TODOS los textos
    const ssmlText = processTextWithIntelligentPauses(text);
    const inputContent = { ssml: ssmlText };
    
    console.log("🎛️ SSML inteligente generado automáticamente:");
    console.log(ssmlText);
    console.log("🎛️ Longitud del SSML:", ssmlText.length);

    console.log("Using voice:", voiceName);
    console.log("Using language code:", languageCode);
    console.log("Input type: SSML (pausas inteligentes automáticas)");

    try {
      const response = await axios.post(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
        {
          input: inputContent,
          voice: {
            languageCode,
            name: voiceName,
            ssmlGender: ssmlGender
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: speechRate,
            pitch: 0.0,
            volumeGainDb: 0.0
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    
      return response.data.audioContent; // Base64 encoded audio
    } catch (error) {
      console.error("Error in axios.post:", error.message);
      throw error;
    }
  } catch (error) {
    console.error('Google TTS API Error:', error.response?.data || error.message);

    if (error.response?.status === 403) {
      throw new Error('Authentication error with Google TTS API. Check your API key.');
    } else {
      throw new Error('Failed to generate audio: ' + (error.response?.data?.error?.message || error.message));
    }
  }
};