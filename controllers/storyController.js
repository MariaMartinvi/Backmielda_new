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
    const { topic, email, language = 'es', storyLength, storyType, creativityLevel, ageGroup, childNames, englishLevel, spanishLevel } = req.body;
    
    if (!topic || !email) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    console.log('👤 Story parameters:', {
      email,
      topic,
      language,
      storyLength,
      storyType,
      creativityLevel,
      ageGroup,
      childNames,
      englishLevel,
      spanishLevel
    });

    // Get the appropriate system message based on language
    let systemMessage;
    switch (language) {
      case 'en':
        systemMessage = `You are a creative writer specialized in FUN and ORIGINAL children's stories. Your mission is to create stories that make children laugh and keep them engaged.

CHARACTERISTICS OF YOUR STYLE:
- Intelligent humor appropriate for children
- Characters with unique personalities and funny flaws
- Absurd but believable situations  
- Natural and spontaneous dialogues
- You avoid being cheesy, cloying or overly sweet
- You don't use typical fairy tale clichés
- You create satisfying but not predictable endings

Write the story in English. Include a creative and engaging title at the beginning of the story, separated by a newline.`;
        break;
      case 'de':
        systemMessage = `Du bist ein kreativer Geschichtenschreiber auf Deutsch. Erstelle originelle, kohärente und fesselnde Geschichten. Schreibe die Geschichte auf Deutsch. Füge einen kreativen und ansprechenden Titel am Anfang der Geschichte ein, getrennt durch einen Zeilenumbruch.`;
        break;
      case 'fr':
        systemMessage = `Vous êtes un écrivain créatif en français. Créez des histoires originales, cohérentes et captivantes. Écrivez l'histoire en français. Incluez un titre créatif et engageant au début de l'histoire, séparé par un saut de ligne.`;
        break;
      case 'ca':
        systemMessage = `Ets un escriptor creatiu en català. Crea històries originals, coherents i captivadores. Escriu la història en català. Inclou un títol creatiu i atractiu al principi de la història, separat per un salt de línia.`;
        break;
      case 'it':
        systemMessage = `Sei uno scrittore creativo in italiano. Crea storie originali, coerenti e avvincenti. Scrivi la storia in italiano. Includi un titolo creativo e coinvolgente all'inizio della storia, separato da una nuova riga.`;
        break;
      case 'gl':
        systemMessage = `Es un escritor creativo en galego. Crea historias orixinais, coherentes e cativadoras. Escribe a historia en galego. Inclúe un título creativo e atractivo ao principio da historia, separado por un salto de liña.`;
        break;
      case 'eu':
        systemMessage = `Euskal ipuin idazle sortzailea zara. Jatorrizko, koherente eta erakargarriak diren ipuinak sortu. Ipuina euskaraz idatzi. Ipuinaren hasieran, lerro-jauzi batez bereizita, izenburu sortzaile eta erakargarri bat gehitu.`;
        break;
      case 'pt':
        systemMessage = `Você é um escritor criativo em português. Crie histórias originais, coerentes e cativantes. Escreva a história em português. Inclua um título criativo e envolvente no início da história, separado por uma quebra de linha.`;
        break;
      case 'es':
      default:
        systemMessage = `Eres un escritor creativo especializado en cuentos infantiles DIVERTIDOS y ORIGINALES. Tu misión es crear historias que hagan reír a los niños y los mantengan enganchados. 

CARACTERÍSTICAS DE TU ESTILO:
- Humor inteligente pero apropiado para niños
- Personajes con personalidades únicas y defectos graciosos  
- Situaciones absurdas pero creíbles
- Diálogos naturales y espontáneos
- Evitas ser cursi, empalagoso o demasiado dulce
- No usas clichés típicos de cuentos tradicionales
- Creas finales satisfactorios pero no predecibles

Escribe la historia en español. Incluye un título creativo y atractivo al principio de la historia, separado por un salto de línea.`;
        break;
    }

    // Construct the prompt
    const prompt = constructPrompt(req.body);

    // Log complete OpenAI request with better formatting
    console.log('\n' + '🔥'.repeat(40));
    console.log('📝 GENERACIÓN DE CUENTO INICIADA');
    console.log('🔥'.repeat(40));
    
    console.log('\n📊 PARÁMETROS RECIBIDOS:');
    console.log('------------------------');
    console.log('📧 Email:', email);
    console.log('🌍 Idioma:', language);
    console.log('📏 Longitud:', storyLength);
    console.log('🎭 Tipo:', storyType);
    console.log('💡 Creatividad:', creativityLevel);
    console.log('👶 Grupo de edad:', ageGroup);
    console.log('👦👧 Nombres de niños:', childNames || 'Ninguno');
    console.log('🇬🇧 Nivel de inglés:', englishLevel);
    console.log('🇪🇸 Nivel de español:', spanishLevel);
    console.log('🎯 Tema:', topic);
    
    console.log('\n🎭 MENSAJE DEL SISTEMA CONSTRUIDO:');
    console.log('----------------------------------');
    console.log(systemMessage);
    
    console.log('\n📝 PROMPT CONSTRUIDO PARA OPENAI:');
    console.log('---------------------------------');
    console.log(prompt);
    
    console.log('\n' + '🔥'.repeat(40));
    console.log('🚀 ENVIANDO A OPENAI SERVICE...');
    console.log('🔥'.repeat(40) + '\n');

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      console.log('👤 Creating new user for email:', email);
      user = await User.create({ 
        email,
        storiesGenerated: 0,
        monthlyStoriesGenerated: 0
      });
    }

    // Check story generation limits
    const canGenerate = await checkStoryGenerationLimit(user);
    if (!canGenerate) {
      // Calculate next renewal date for premium users
      let errorMessage;
      if (user.subscriptionStatus === 'active') {
        const nextRenewalDate = new Date(user.lastMonthReset);
        nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 1);
        const dayOfMonth = nextRenewalDate.getDate();
        errorMessage = {
          key: 'storyForm.premiumStoryLimitReached',
          params: { day: dayOfMonth }
        };
      } else {
        errorMessage = {
          key: 'storyForm.storyLimitReached'
        };
      }

      return res.status(403).json({
        error: 'Story limit reached',
        message: errorMessage,
        storiesRemaining: await getStoriesRemaining(user)
      });
    }

    // Generate the story
    const story = await openaiService.generateCompletion(prompt, systemMessage, req.body);

    if (!story || !story.content) {
      console.error('❌ No story content received from OpenAI');
      return res.status(500).json({ error: 'Failed to generate story content' });
    }

    // Extract title from the story content
    const extractedTitle = extractTitle(story.content, topic, language);
    const title = typeof extractedTitle === 'object' ? extractedTitle.title : extractedTitle;
    console.log('📑 Generated story:', {
      title,
      contentLength: story.content.length
    });

    // Save to database
    console.log('💾 Saving story to database...');
    const savedStory = await Story.create({
      title: title,
      content: story.content,
      topic,
      email,
      language,
      user: user._id,  // Associate with user
      createdAt: new Date()
    });

    // Update user story counts
    console.log('👤 Updating user story counts...');
    await User.findByIdAndUpdate(user._id, {
      $inc: { 
        storiesGenerated: 1,
        monthlyStoriesGenerated: 1
      }
    });

    console.log('✅ Story generation complete');
    res.json({
      story: savedStory.toObject(),
      storiesRemaining: await getStoriesRemaining(user)
    });
  } catch (error) {
    console.error('Error generating story:', error);
    res.status(500).json({ error: 'Story generation failed' });
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