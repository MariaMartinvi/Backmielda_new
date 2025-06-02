// controllers/audioController.js
const googleTtsService = require('../utils/googleTtsService');
const { mixAudioWithBackground, getRandomMusicTrack, BACKGROUND_MUSIC_TRACKS } = require('../utils/audioMixer');

exports.generateAudio = async (req, res, next) => {
  try {
    const { text, voiceId, speechRate, musicTrack, musicVolume, title } = req.body;
    
    console.log('Audio generation request:', { 
      textLength: text ? text.length : 0, 
      voiceId, 
      speechRate, 
      musicTrack, 
      musicVolume,
      title: title || 'No title provided',
      pausesMode: 'INTELLIGENT_AUTO'
    });
    
    // Validate request
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    // Check text length to avoid extremely large requests
    if (text.length > 5000) {
      return res.status(400).json({ 
        error: 'Text too long. Maximum length is 5000 characters.' 
      });
    }
    
    // Generate audio using TTS service with intelligent pauses automatically applied
    const audioData = await googleTtsService.synthesizeSpeech(
      text,
      voiceId || 'female',
      speechRate || 1.0,
      true,  // useIntelligentPauses
      title  // Pass the title for automatic pause detection
    );

    let finalAudioData;
    let usedMusicTrack = musicTrack;
    
    // Verificar explícitamente si musicTrack es exactamente "none"
    if (musicTrack === 'none') {
      console.log('🔇 No background music requested, returning TTS audio only');
      finalAudioData = audioData;
    } else {
      // Use the specified track or random if not specified
      usedMusicTrack = musicTrack || 'random';
      console.log(`🎵 Using background music track: ${usedMusicTrack}`);
      
      // Mix with background music
      finalAudioData = await mixAudioWithBackground(
        audioData,
        usedMusicTrack,
        musicVolume !== undefined ? musicVolume : 0.1
      );
    }
    
    // Return audio data (base64 encoded)
    res.status(200).json({
      audioUrl: `data:audio/mp3;base64,${finalAudioData}`,
      format: 'mp3',
      parameters: {
        voiceId,
        speechRate,
        musicTrack: usedMusicTrack,
        musicVolume: musicTrack === 'none' ? 0 : (musicVolume !== undefined ? musicVolume : 0.1),
        pausesApplied: 'intelligent_automatic'
      }
    });
  } catch (error) {
    console.error('Error in audio generation:', error);
    next(error);
  }
};

// Get available background music tracks
exports.getBackgroundMusicTracks = (req, res) => {
  res.json({
    tracks: Object.keys(BACKGROUND_MUSIC_TRACKS).map(track => ({
      id: track,
      name: track.charAt(0).toUpperCase() + track.slice(1),
      filename: BACKGROUND_MUSIC_TRACKS[track]
    }))
  });
};

// Test endpoint for pause functionality
exports.testPauses = async (req, res) => {
  try {
    const { text, pauseSettings } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        error: 'El texto es obligatorio para el test de pausas' 
      });
    }

    console.log("🧪 === TEST DE PAUSAS INICIADO ===");
    console.log("📝 Texto recibido:", text.substring(0, 100) + "...");
    console.log("⚙️ Configuración de pausas:", pauseSettings);

    // Process text with pauses using our TTS service function
    const { processTextWithPauses } = require('../utils/googleTtsService');
    
    // Since processTextWithPauses is not exported, we'll recreate the logic here
    const {
      sentencePause = '1s',
      paragraphPause = '2s',   
      dialoguePause = '1.5s',  
      chapterPause = '3s'
    } = pauseSettings || {};

    // Process the text line by line
    let lines = text.split('\n');
    let processedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      
      if (line === '') {
        if (processedLines.length > 0 && processedLines[processedLines.length - 1] !== '') {
          processedLines.push(`<break time="${paragraphPause}"/>`);
        }
        continue;
      }
      
      // Detect chapter titles
      if (/^[A-ZÁÉÍÓÚÑÜÇ][A-ZÁÉÍÓÚÑÜÇ\s]+$/.test(line)) {
        processedLines.push(`<break time="${chapterPause}"/>`);
        processedLines.push(line);
        processedLines.push(`<break time="${chapterPause}"/>`);
        continue;
      }
      
      // Process dialogues
      line = line.replace(/"([^"]+)"/g, `<break time="${dialoguePause}"/> "$1" <break time="${dialoguePause}"/>`);
      
      // Process sentence pauses
      line = line.replace(/([.!?])(\s+)/g, `$1<break time="${sentencePause}"/> `);
      
      if (/[.!?]$/.test(line.trim())) {
        line = line + `<break time="${sentencePause}"/>`;
      }
      
      processedLines.push(line);
    }
    
    let ssmlText = processedLines.join(' ').replace(/\s+/g, ' ').trim();
    const finalSSML = `<speak>${ssmlText}</speak>`;
    
    const totalPauses = (finalSSML.match(/<break time="[^"]+"/g) || []).length;
    
    console.log(`✅ Test completado: ${totalPauses} pausas generadas`);
    console.log("🧪 === TEST DE PAUSAS FINALIZADO ===");

    res.json({
      success: true,
      originalText: text,
      ssmlGenerated: finalSSML,
      pauseSettings: pauseSettings,
      totalPauses: totalPauses,
      message: `SSML generado exitosamente con ${totalPauses} pausas`
    });

  } catch (error) {
    console.error('Error en test de pausas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor durante el test de pausas',
      details: error.message 
    });
  }
};