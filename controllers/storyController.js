// controllers/storyController.js
const User = require('../models/User');
const Story = require('../models/Story');
const googleTtsService = require('../utils/googleTtsService');
const { mixAudioWithBackground, getRandomMusicTrack, BACKGROUND_MUSIC_TRACKS } = require('../utils/audioMixer');
const openaiService = require('../utils/openaiService');
const { constructPrompt, extractTitle } = require('../utils/helpers');
console.log("OpenAI API Key:", process.env.OPENAI_API_KEY ? "Configurada (primeros caracteres: " + process.env.OPENAI_API_KEY.substring(0, 5) + "...)" : "No configurada");

exports.generateStory = async (req, res, next) => {
  console.log('📝 Story generation request received:', req.body?.topic || 'No topic provided');
  
  try {
    const { email, ...storyParams } = req.body;
    
    // Log the entire request body for debugging
    console.log('📥 Full request body:', JSON.stringify(req.body, null, 2));
    
    // Validate request body
    if (!storyParams.topic) {
      console.log('❌ Missing topic in story generation request');
      return res.status(400).json({ error: 'Topic is required' });
    }

    if (!email) {
      console.log('❌ Missing email in story generation request');
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log(`👤 Story generation for email: ${email}, topic: ${storyParams.topic}`);

    // Find or create user
    let user;
    try {
      user = await User.findOne({ email });
      if (!user) {
        console.log(`🆕 Creating new user for email: ${email}`);
        user = await User.create({ email });
      }
    } catch (dbError) {
      console.error('❌ Database error when finding/creating user:', dbError);
      return res.status(500).json({ 
        error: 'Database error',
        message: storyParams.language === 'es'
          ? 'Error en la base de datos. Por favor, inténtalo de nuevo.'
          : 'Database error. Please try again.'
      });
    }

    // Check and reset monthly count if needed
    user.checkAndResetMonthlyCount();

    // Check if user can generate more stories
    const canGenerateStory = await checkStoryGenerationLimit(user);
    if (!canGenerateStory) {
      // If user is premium and has reached monthly limit
      if (user.subscriptionStatus === 'active' && user.monthlyStoriesGenerated >= 30) {
        console.log(`⚠️ User ${email} has reached monthly premium story limit`);
        return res.status(403).json({ 
          error: 'Monthly limit reached',
          message: storyParams.language === 'es' 
            ? 'Has alcanzado tu límite mensual de 30 historias. Podrás generar más historias el próximo mes.'
            : 'You have reached your monthly story generation limit of 30 stories. You will be able to generate more stories next month.',
          subscriptionRequired: false,
          storiesRemaining: 0
        });
      }
      
      // For free users or cancelled subscriptions
      console.log(`⚠️ User ${email} has reached free story limit`);
      return res.status(403).json({ 
        error: 'Story limit reached',
        message: storyParams.language === 'es'
          ? 'Has alcanzado tu límite de historias gratuitas. Por favor, suscríbete para generar más historias.'
          : 'You have reached your free story limit. Please subscribe to generate more stories.',
        subscriptionRequired: true,
        storiesRemaining: await getStoriesRemaining(user)
      });
    }

    // Generate story text via OpenAI
    console.log('🔄 Constructing prompt for OpenAI...');
    const prompt = constructPrompt(storyParams);
    // Log the prompt for debugging
    console.log('🔍 Generated prompt:', prompt);
    console.log('🤖 Calling OpenAI API for story generation...');
    
    let storyContent;
    try {
      storyContent = await openaiService.generateCompletion(prompt, storyParams);
      console.log('✅ OpenAI API call successful');
    } catch (aiError) {
      console.error('❌ OpenAI API error:', aiError.message);
      console.error('Full OpenAI error details:', JSON.stringify(aiError, null, 2));
      
      // Check for specific OpenAI errors
      if (aiError.message.includes('API key')) {
        console.error('🔑 API Key error detected');
        return res.status(500).json({
          error: 'API configuration error',
          message: storyParams.language === 'es'
            ? 'Error de configuración del servidor. Por favor, contacta a soporte.'
            : 'Server configuration error. Please contact support.'
        });
      }
      
      // Check for quota exceeded errors
      if (aiError.message.includes('quota exceeded') || aiError.message.includes('insufficient quota')) {
        console.error('🚫 API Quota exceeded error detected');
        return res.status(402).json({
          error: 'Quota exceeded',
          code: 'insufficient_quota',
          message: storyParams.language === 'es'
            ? 'El servicio de generación de cuentos no está disponible temporalmente. Por favor, inténtalo más tarde.'
            : 'The story generation service is temporarily unavailable. Please try again later.'
        });
      }
      
      if (aiError.message.includes('rate limit')) {
        console.error('⏱️ Rate limit error detected');
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: storyParams.language === 'es'
            ? 'Demasiadas solicitudes. Por favor, inténtalo de nuevo más tarde.'
            : 'Too many requests. Please try again later.'
        });
      }
      
      if (aiError.message.includes('timed out')) {
        console.error('⏱️ Timeout error detected');
        return res.status(504).json({
          error: 'Request timeout',
          message: storyParams.language === 'es'
            ? 'La solicitud tardó demasiado tiempo. Por favor, inténtalo de nuevo.'
            : 'The request took too long. Please try again.'
        });
      }
      
      // Default error - provide detailed error info to aid debugging
      return res.status(500).json({ 
        error: 'Story generation failed',
        details: aiError.message,
        message: storyParams.language === 'es'
          ? 'Ha ocurrido un error al generar el cuento. Por favor, inténtalo de nuevo.'
          : 'An error occurred while generating the story. Please try again.'
      });
    }
    
    // Extract or generate a title and clean content
    console.log('📑 Extracting title and formatting content...');
    const { title, content } = extractTitle(storyContent, storyParams.topic, storyParams.language);
    
    // Create new story document
    console.log('💾 Saving story to database...');
    let story;
    try {
      story = new Story({
        title,
        content,
        user: user._id
      });
      await story.save();
    } catch (saveError) {
      console.error('❌ Error saving story to database:', saveError);
      // Even if saving fails, return the generated story to user
      console.log('⚠️ Story save failed but returning content to user anyway');
      return res.json({
        title,
        content,
        parameters: storyParams,
        timestamp: new Date().toISOString(),
        storiesRemaining: await getStoriesRemaining(user),
        saveError: true
      });
    }
    
    // Update user's story counts AFTER successful story generation and save
    console.log('👤 Updating user story counts...');
    try {
      user.storiesGenerated += 1;
      if (user.subscriptionStatus === 'active') {
        user.monthlyStoriesGenerated += 1;
      }
      await user.save();
    } catch (userUpdateError) {
      console.error('❌ Error updating user story counts:', userUpdateError);
      // Continue anyway - this is a non-critical error
    }
    
    // Return the generated story
    console.log('✅ Story generation complete, returning to client');
    return res.json({
      title,
      content,
      parameters: storyParams,
      timestamp: new Date().toISOString(),
      storiesRemaining: await getStoriesRemaining(user)
    });
  } catch (error) {
    console.error('❌ Unhandled error in story generation:', error);
    console.error('Error stack:', error.stack);
    
    // Add specific error information for detailed diagnosis
    let errorType = 'unknown';
    if (error.name) errorType = error.name;
    if (error.code) errorType += `-${error.code}`;
    
    const language = req.body?.language || 'es';
    return res.status(500).json({ 
      error: 'Story generation failed',
      errorType,
      details: error.message,
      message: language === 'es'
        ? 'Ha ocurrido un error al generar el cuento. Por favor, inténtalo de nuevo.'
        : 'An error occurred while generating the story. Please try again.'
    });
  }
};

exports.generateAudio = async (req, res, next) => {
  try {
    const { storyId } = req.params;
    const { email, voiceId, speechRate, musicTrack } = req.body;

    if (!storyId || !email) {
      return res.status(400).json({ error: 'Story ID and email are required' });
    }

    // Find the story
    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    // Check if user can generate more audio for this story
    if (!story.canGenerateAudio()) {
      return res.status(403).json({ 
        error: 'Audio limit reached',
        message: 'Create a new story to generate another audio.'
      });
    }

    // Increment audio generations
    const canIncrement = story.incrementAudioGenerations();
    if (!canIncrement) {
      return res.status(403).json({ 
        error: 'Audio limit reached',
        message: 'Create a new story to generate another audio.'
      });
    }

    await story.save();

    // Generate audio with Google TTS
    const audioData = await googleTtsService.synthesizeSpeech(
      story.content,
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
        0.1  // Fixed volume at 10%
      );
    }
    
    // Return the audio data
    res.status(200).json({
      success: true,
      audioUrl: `data:audio/mp3;base64,${finalAudioData}`,
      format: 'mp3',
      parameters: {
        voiceId,
        speechRate,
        musicTrack: usedMusicTrack, // Return the track that was used
        musicVolume: musicTrack === 'none' ? 0 : 0.1
      },
      audioGenerations: story.audioGenerations
    });
  } catch (error) {
    console.error('Error generating audio:', error);
    next(error);
  }
};

async function checkStoryGenerationLimit(user) {
  // Check and reset monthly count if needed
  user.checkAndResetMonthlyCount();

  // Free users get 3 stories total
  if (user.subscriptionStatus !== 'active') {
    return user.storiesGenerated < 3;
  }

  // Subscribed users get 30 stories per month
  return user.monthlyStoriesGenerated < 30;
}

async function getStoriesRemaining(user) {
  // Check and reset monthly count if needed
  user.checkAndResetMonthlyCount();

  if (user.subscriptionStatus === 'free') {
    return Math.max(0, 3 - user.storiesGenerated);
  }
  
  if (user.subscriptionStatus === 'active') {
    if (user.subscriptionEndDate && user.subscriptionEndDate < new Date()) {
      return Math.max(0, 3 - user.storiesGenerated);
    }
    return Math.max(0, 30 - user.monthlyStoriesGenerated);
  }

  return Math.max(0, 3 - user.storiesGenerated);
}

exports.getStoryById = async (req, res, next) => {
  // Implementation for retrieving saved stories
  // This would require a database connection
  res.status(501).json({ message: 'Not implemented yet' });
};

// Health check with OpenAI API test
exports.healthCheck = async (req, res) => {
  console.log('🏥 Health check requested');
  
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'checking...',
      openai: 'checking...',
      openai_quota: 'unknown'
    }
  };
  
  // Check database connection
  try {
    const count = await User.countDocuments().limit(1);
    health.services.database = 'ok';
  } catch (dbError) {
    console.error('❌ Database health check failed:', dbError);
    health.services.database = 'error';
    health.status = 'degraded';
  }
  
  // Check OpenAI API connection using our enhanced status check
  try {
    const openaiStatus = await openaiService.checkOpenAIStatus();
    console.log('OpenAI API status check result:', openaiStatus);
    
    // Map OpenAI status to our health check format
    if (openaiStatus.status === 'ok') {
      health.services.openai = 'ok';
      health.services.openai_quota = 'available';
      health.openai_details = openaiStatus.details;
    } else if (openaiStatus.status === 'quota_exceeded') {
      health.services.openai = 'error';
      health.services.openai_quota = 'exceeded';
      health.status = 'critical';
      health.openai_error = openaiStatus.message;
      health.admin_action_required = true;
      
      // Notify admin about quota issues
      try {
        await openaiService.notifyAdminOfCriticalError('OpenAI API quota exceeded detected during health check');
      } catch (notifyError) {
        console.error('Failed to notify admin:', notifyError);
      }
    } else if (openaiStatus.status === 'not_configured') {
      health.services.openai = 'not_configured';
      health.status = 'degraded';
      health.openai_error = 'OpenAI API key is not configured';
    } else if (openaiStatus.status === 'rate_limited') {
      health.services.openai = 'rate_limited';
      health.status = 'degraded';
      health.openai_error = openaiStatus.message;
    } else {
      health.services.openai = 'error';
      health.status = 'degraded';
      health.openai_error = openaiStatus.message;
    }
  } catch (openaiError) {
    console.error('❌ OpenAI health check failed:', openaiError.message);
    health.services.openai = 'error';
    health.openai_error = openaiError.message;
    health.status = 'degraded';
  }
  
  // Set appropriate status code based on health
  const statusCode = health.status === 'ok' ? 200 : (health.status === 'critical' ? 503 : 500);
  return res.status(statusCode).json(health);
};