// controllers/audioController.js
const googleTtsService = require('../utils/googleTtsService');
const { mixAudioWithBackground, prepareMusicTrack, mixWithPreparedMusic, getRandomMusicTrack, BACKGROUND_MUSIC_TRACKS } = require('../utils/audioMixer');
const storyService = require('../services/storyService');
const { admin } = require('../config/firebase');
const fs = require('fs').promises;
const path = require('path');

// Function to get Firebase Storage bucket
const getFirebaseStorageBucket = () => {
  try {
    return admin.storage().bucket();
  } catch (error) {
    console.error('❌ Error getting Firebase Storage bucket:', error.message);
    throw new Error('Firebase Storage not available');
  }
};

exports.generateAudio = async (req, res, next) => {
  try {
    const { text, voiceId, speechRate, musicTrack, musicVolume, title, storyId } = req.body;
    
    console.log('🎤 === AUDIO GENERATION REQUEST ===');
    console.log('📝 Text length:', text ? text.length : 0);
    console.log('🎙️ VoiceId received:', voiceId);
    console.log('⚡ Speech rate:', speechRate);
    console.log('🎵 Music track:', musicTrack);
    console.log('🔊 Music volume:', musicVolume);
    console.log('📖 Title:', title || 'No title provided');
    console.log('📋 Story ID:', storyId || 'No story ID provided');
    console.log('⏸️ Pauses mode: INTELLIGENT_AUTO');
    console.log('=====================================');
    
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
    
    // 🚀 OPTIMIZACIÓN: Preparar música en paralelo mientras se genera TTS
    const shouldMixMusic = musicTrack !== 'none';
    const usedMusicTrack = musicTrack || 'random';
    
    let audioData, preparedMusic;
    
    if (shouldMixMusic) {
      console.log('🚀 INICIANDO PIPELINE PARALELO: TTS + Preparación de Música');
      // Ejecutar TTS y preparación de música en paralelo
      [audioData, preparedMusic] = await Promise.all([
        googleTtsService.synthesizeSpeech(
          text,
          voiceId || 'female',
          speechRate || 0.8,
          true,  // useIntelligentPauses
          title  // Pass the title for automatic pause detection
        ),
        prepareMusicTrack(usedMusicTrack)
      ]);
      console.log('✅ PIPELINE PARALELO COMPLETADO');
    } else {
      console.log('🔇 No background music requested, generating TTS only');
      audioData = await googleTtsService.synthesizeSpeech(
        text,
        voiceId || 'female',
        speechRate || 0.8,
        true,  // useIntelligentPauses
        title
      );
    }

    let finalAudioData;
    
    if (shouldMixMusic && preparedMusic.available) {
      console.log('🎵 Usando mixing optimizado con música pre-preparada');
      // Mix using prepared music (faster)
      const mixedAudioBase64 = await mixWithPreparedMusic(
        audioData,
        preparedMusic,
        musicVolume !== undefined ? musicVolume : 0.1
      );
      finalAudioData = Buffer.from(mixedAudioBase64, 'base64');
      console.log(`🎵 [DEBUG] Converted mixed audio to Buffer, size: ${finalAudioData.length} bytes`);
    } else {
      console.log('🔇 Using TTS audio only (no music or music unavailable)');
      finalAudioData = audioData;  // This is a Buffer
    }
    
    // Save the generated audio data temporarily with the story (for use during publish)
    const audioParams = {
      voiceId,
      speechRate,
      musicTrack: usedMusicTrack,
      musicVolume: musicTrack === 'none' ? 0 : (musicVolume !== undefined ? musicVolume : 0.1),
      lastGenerated: new Date(),
      pausesApplied: 'intelligent_automatic'
    };
    
    if (storyId) {
      try {
        console.log('🎯 [DEBUG] Starting temporary data save process...');
        
        // Ensure finalAudioData is always a Buffer for consistent handling
        let audioBuffer = finalAudioData;
        let audioBase64 = finalAudioData.toString('base64');
        
        console.log(`📊 [AUDIO] Final audio - Buffer size: ${audioBuffer.length} bytes, base64 size: ${audioBase64.length} characters`);
        
        // ADDITIONAL DEBUGGING: Verify audioBuffer contains valid MP3
        if (audioBuffer && audioBuffer.length > 0) {
          const first4Bytes = audioBuffer.slice(0, 4);
          const hexString = first4Bytes.toString('hex').toUpperCase();
          console.log(`🧪 [DEBUG] Generated audio first 4 bytes (hex): ${hexString}`);
          
          if (hexString.startsWith('FF') || hexString.includes('ID3')) {
            console.log('✅ [DEBUG] Generated audio appears to be valid MP3 format');
          } else {
            console.log('⚠️ [DEBUG] Generated audio may not be valid MP3 format');
            console.log(`🧪 [DEBUG] Raw bytes: ${audioBuffer.slice(0, 10)}`);
          }
        } else {
          console.error('❌ [DEBUG] audioBuffer is empty or null!');
        }

        // Check if audio is too large for database storage (Firestore has 1MB limit per document)
        if (audioBase64.length > 800000) { // Leave some margin (800KB)
          console.log('⚠️ [AUDIO] Audio too large for database storage, saving to temporary Firebase Storage instead');
          
          // Save to temporary file in Firebase Storage (same system as storyController.js)
          const tempDir = path.join(__dirname, '../temp');
          await fs.mkdir(tempDir, { recursive: true });
          
          const tempAudioFileName = `temp_${storyId}_${Date.now()}.mp3`;
          const tempAudioFilePath = path.join(tempDir, tempAudioFileName);
          await fs.writeFile(tempAudioFilePath, audioBuffer);
          
          // Upload to temporary Firebase Storage
          const bucket = getFirebaseStorageBucket();
          await bucket.upload(tempAudioFilePath, {
            destination: `temp-audio/${tempAudioFileName}`,
            metadata: {
              cacheControl: 'public, max-age=31536000',
              contentType: 'audio/mpeg'
            },
          });
          
          const tempAudioStoragePath = `temp-audio/${tempAudioFileName}`;
          
          // Clean up local temp file
          await fs.unlink(tempAudioFilePath);
          
          await storyService.update(storyId, { 
            lastAudioParams: audioParams,
            tempAudioPath: tempAudioStoragePath // Store path instead of truncated data
          });
          
          console.log('💾 [AUDIO] Saved complete audio to temporary Firebase Storage for future publish');
        } else {
          await storyService.update(storyId, { 
            lastAudioParams: audioParams,
            tempAudioData: audioBase64
          });
          console.log('💾 [AUDIO] Saved audio data and parameters for future publish (no regeneration needed)');
        }
      } catch (error) {
        console.error('❌ [AUDIO] Failed to save audio data:', error.message);
        console.error('❌ [AUDIO] Error details:', error);
      }
    } else {
      console.log('⚠️ [AUDIO] No story ID provided, skipping temporary data save');
    }
    
    // Return audio data (base64 encoded for immediate playback)
    console.log('🎵 [AUDIO] Returning temporary audio for immediate playback');
    res.status(200).json({
      audioUrl: `data:audio/mp3;base64,${finalAudioData.toString('base64')}`,
      format: 'mp3',
      parameters: audioParams
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