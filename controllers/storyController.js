// controllers/storyController.js
const User = require('../models/User');
const Story = require('../models/Story');
const googleTtsService = require('../utils/googleTtsService');
const { mixAudioWithBackground, getRandomMusicTrack, BACKGROUND_MUSIC_TRACKS } = require('../utils/audioMixer');
const openaiService = require('../utils/openaiService');
const { constructPrompt, extractTitle } = require('../utils/helpers');
console.log("OpenAI API Key:", process.env.OPENAI_API_KEY ? "Configurada (primeros caracteres: " + process.env.OPENAI_API_KEY.substring(0, 5) + "...)" : "No configurada");

exports.generateStory = async (req, res, next) => {
  try {
    const { email, ...storyParams } = req.body;
    
    // Validate request body
    if (!storyParams.topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email });
    }

    // Check and reset monthly count if needed
    user.checkAndResetMonthlyCount();

    // Check if user can generate more stories
    const canGenerateStory = await checkStoryGenerationLimit(user);
    if (!canGenerateStory) {
      // If user is premium and has reached monthly limit
      if (user.subscriptionStatus === 'active' && user.monthlyStoriesGenerated >= 30) {
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
    const prompt = constructPrompt(storyParams);
    const storyContent = await openaiService.generateCompletion(prompt, storyParams);
    
    // Extract or generate a title and clean content
    const { title, content } = extractTitle(storyContent, storyParams.topic, storyParams.language);
    
    // Create new story document
    const story = new Story({
      title,
      content,
      user: user._id
    });
    await story.save();
    
    // Update user's story counts AFTER successful story generation and save
    user.storiesGenerated += 1;
    if (user.subscriptionStatus === 'active') {
      user.monthlyStoriesGenerated += 1;
    }
    await user.save();
    
    // Return the generated story
    return res.json({
      title,
      content,
      parameters: storyParams,
      timestamp: new Date().toISOString(),
      storiesRemaining: await getStoriesRemaining(user)
    });
  } catch (error) {
    console.error('Error generating story:', error);
    const language = req.body.language || 'es';
    return res.status(500).json({ 
      error: 'Story generation failed',
      message: language === 'es'
        ? 'Ha ocurrido un error al generar el cuento. Por favor, inténtalo de nuevo.'
        : 'An error occurred while generating the story. Please try again.'
    });
  }
};

exports.generateAudio = async (req, res, next) => {
  try {
    const { storyId } = req.params;
    const { email, voiceId, speechRate } = req.body;

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
    
    // Mix with random background music (use 'random' to get a random track)
    const finalAudioData = await mixAudioWithBackground(
      audioData,
      'random', // Use the random selection functionality
      0.3  // Fixed volume at 30%
    );
    
    // Return the audio data
    res.status(200).json({
      success: true,
      audioUrl: `data:audio/mp3;base64,${finalAudioData}`,
      format: 'mp3',
      parameters: {
        voiceId,
        speechRate,
        musicTrack: 'random', // Indicate that a random track was used
        musicVolume: 0.3
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