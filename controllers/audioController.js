// controllers/audioController.js
const googleTtsService = require('../utils/googleTtsService');
const { mixAudioWithBackground, getRandomMusicTrack, BACKGROUND_MUSIC_TRACKS } = require('../utils/audioMixer');

exports.generateAudio = async (req, res, next) => {
  try {
    const { text, voiceId, speechRate, musicTrack, musicVolume } = req.body;
    
    console.log('Audio generation request:', { 
      textLength: text ? text.length : 0, 
      voiceId, 
      speechRate, 
      musicTrack, 
      musicVolume 
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
    
    // Generate audio using TTS service
    const audioData = await googleTtsService.synthesizeSpeech(
      text,
      voiceId || 'female',
      speechRate || 1.0
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
        musicVolume: musicTrack === 'none' ? 0 : (musicVolume !== undefined ? musicVolume : 0.1)
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