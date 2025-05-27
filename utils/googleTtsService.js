const axios = require('axios');


// Helper function to map our voice IDs to Google's voice names

function getGoogleVoiceName(voiceId) {
  switch (voiceId) {
    // Español
    case 'female':
      return 'es-ES-Neural2-H';
    case 'male':
      return 'es-ES-Neural2-B';
    case 'female-latam':
      return 'es-US-Neural2-A';
    case 'male-latam':
      return 'es-US-Neural2-B';
    
    // Inglés
    case 'female-english':
      return 'en-US-Neural2-F';
    case 'male-english':
      return 'en-US-Neural2-D';
    
    // Catalán
    case 'female-catalan':
      return 'ca-ES-Neural2-A';
    case 'male-catalan':
      return 'ca-ES-Neural2-B';
    
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
    
    // Alemán
    case 'female-german':
      return 'de-DE-Neural2-A';
    case 'male-german':
      return 'de-DE-Neural2-B';
    
    // Italiano
    case 'female-italian':
      return 'it-IT-Neural2-A';
    case 'male-italian':
      return 'it-IT-Neural2-B';
    
    // Francés
    case 'female-french':
      return 'fr-FR-Neural2-A';
    case 'male-french':
      return 'fr-FR-Neural2-B';
    
    default:
      return 'es-ES-Neural2-A';
  }
}

exports.synthesizeSpeech = async (text, voiceId, speechRate) => {
  try {
    // Debugging logs
    console.log("=============== DEBUG INFO ===============");
    console.log("Texto recibido:", text.substring(0, 30) + "...");
    console.log("Voz seleccionada:", voiceId);
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
    
    console.log("Using voice:", voiceName);
    console.log("Using language code:", languageCode);

    try {
      const response = await axios.post(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
        {
          input: { text },
          voice: {
            languageCode,
            name: voiceName,
            ssmlGender: voiceId.startsWith('male') ? 'MALE' : 'FEMALE'
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