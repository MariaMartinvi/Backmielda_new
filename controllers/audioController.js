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

    // Always add background music
    // Use the provided track, or 'random' if not specified or invalid
    const selectedMusicTrack = (musicTrack && BACKGROUND_MUSIC_TRACKS[musicTrack]) 
      ? musicTrack 
      : 'random'; // Default to random selection
    
    // Set a reasonable default volume
    const selectedMusicVolume = musicVolume !== undefined ? musicVolume : 0.1;
    
    console.log('Adding background music:', {
      track: selectedMusicTrack,
      volume: selectedMusicVolume
    });
    
    // Mix with background music
    const finalAudioData = await mixAudioWithBackground(
      audioData,
      selectedMusicTrack,
      selectedMusicVolume
    );
    
    // Return audio data (base64 encoded)
    res.status(200).json({
      audioUrl: `data:audio/mp3;base64,${finalAudioData}`,
      format: 'mp3',
      parameters: {
        voiceId,
        speechRate,
        musicTrack: selectedMusicTrack,
        musicVolume: selectedMusicVolume
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