const axios = require('axios');

// Helper function to escape special characters for SSML
function escapeSSML(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

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
  
  // Configuración muy conservadora para Neural2
  const intelligentPauses = {
    sentencePause: '0.6s',      
    paragraphPause: '1.2s',     
    shortPhrasePause: '0.3s'   
  };

  console.log("⚙️ Configuración de pausas conservadora para Neural2:");
  console.log("   - Oraciones: 0.6s");
  console.log("   - Párrafos: 1.2s");
  console.log("   - Frases: 0.3s");

  // Escapar caracteres especiales SSML PRIMERO
  let processedText = escapeSSML(text);
  
  // VERSIÓN ULTRA SIMPLE - Solo pausas básicas
  // Pausas después de puntos
  processedText = processedText.replace(/\.\s+/g, `. <break time="${intelligentPauses.sentencePause}"/> `);
  
  // Pausas después de signos de exclamación
  processedText = processedText.replace(/!\s+/g, `! <break time="${intelligentPauses.sentencePause}"/> `);
  
  // Pausas después de preguntas
  processedText = processedText.replace(/\?\s+/g, `? <break time="${intelligentPauses.sentencePause}"/> `);
  
  // Pausas después de comas (solo en oraciones largas)
  if (text.length > 200) {
    processedText = processedText.replace(/,\s+/g, `, <break time="${intelligentPauses.shortPhrasePause}"/> `);
  }
  
  // Pausas para párrafos (doble salto de línea)
  processedText = processedText.replace(/\n\s*\n/g, ` <break time="${intelligentPauses.paragraphPause}"/> `);
  
  // Limpiar espacios múltiples
  processedText = processedText.replace(/\s+/g, ' ').trim();
  
  // Envolver en etiquetas SSML simples
  const finalSSML = `<speak>${processedText}</speak>`;
  
  // Contar pausas aplicadas
  const totalPauses = (finalSSML.match(/<break time="[^"]+"/g) || []).length;
  console.log(`✅ SSML simple generado con ${totalPauses} pausas`);
  
  // Validación ultra básica
  if (!finalSSML.includes('<speak>') || !finalSSML.includes('</speak>')) {
    console.warn("⚠️ SSML inválido, usando texto plano");
    return `<speak>${escapeSSML(text)}</speak>`;
  }
  
  console.log("📄 SSML generado:");
  console.log(finalSSML.substring(0, 300) + "...");
  console.log("🎛️ === FIN PROCESAMIENTO SIMPLE ===");
  
  return finalSSML;
}

// Función para validar SSML básico
function isValidSSML(ssml) {
  try {
    // Verificar que las etiquetas principales estén balanceadas
    const speakOpen = (ssml.match(/<speak>/g) || []).length;
    const speakClose = (ssml.match(/<\/speak>/g) || []).length;
    const prosodyOpen = (ssml.match(/<prosody[^>]*>/g) || []).length;
    const prosodyClose = (ssml.match(/<\/prosody>/g) || []).length;
    
    if (speakOpen !== speakClose || prosodyOpen !== prosodyClose) {
      console.log("❌ SSML no balanceado:", { speakOpen, speakClose, prosodyOpen, prosodyClose });
      return false;
    }
    
    // Verificar que no hay caracteres problemáticos sin escapar
    if (ssml.includes('<') && !ssml.includes('&lt;') && ssml.match(/<(?![/\w\s="-]+>)/)) {
      console.log("❌ Caracteres < sin escapar detectados");
      return false;
    }
    
    return true;
  } catch (error) {
    console.log("❌ Error validando SSML:", error.message);
    return false;
  }
}

// Función para limpiar SSML mal formado
function cleanupSSML(ssml) {
  // Remover etiquetas SSML vacías o mal formadas
  ssml = ssml.replace(/<prosody[^>]*><\/prosody>/g, '');
  ssml = ssml.replace(/<break time="[^"]*"\/>\s*<break time="[^"]*"\/>/g, '<break time="0.8s"/>');
  ssml = ssml.replace(/\s{2,}/g, ' ');
  
  return ssml.trim();
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
      
      // Si el SSML falla, intentar con texto plano como fallback
      if (error.response?.data?.error?.message?.includes('Invalid SSML')) {
        console.log("⚠️ SSML falló, intentando con texto plano...");
        
        const fallbackResponse = await axios.post(
          `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
          {
            input: { text: text },
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
        
        console.log("✅ Texto plano funcionó como fallback");
        return fallbackResponse.data.audioContent;
      }
      
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