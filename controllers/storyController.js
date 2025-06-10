// controllers/storyController.js
const storyService = require('../services/storyService');
// TEMPORARILY DISABLED - const audioService = require('../services/audioService');
const { auth } = require('../middleware/auth');
const openaiService = require('../utils/openaiService');
const googleTtsService = require('../utils/googleTtsService');
const { mixAudioWithBackground, getRandomMusicTrack, BACKGROUND_MUSIC_TRACKS } = require('../utils/audioMixer');
const { constructPrompt, extractTitle } = require('../utils/helpers');
const { admin, db } = require('../config/firebase');
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
console.log("OpenAI API Key:", process.env.OPENAI_API_KEY ? "Configurada (primeros caracteres: " + process.env.OPENAI_API_KEY.substring(0, 5) + "...)" : "No configurada");

// Use Firebase instances from config
let bucket = null;

// Function to get Firebase Storage bucket
const getFirebaseStorageBucket = () => {
  if (!bucket) {
    try {
      bucket = admin.storage().bucket();
      console.log('✅ Firebase Storage bucket configured for story controller');
    } catch (error) {
      console.error('❌ Error configuring Firebase Storage bucket:', error.message);
      throw new Error('Firebase Storage not available');
    }
  }
  return bucket;
};

exports.generateStory = async (req, res, next) => {
  console.log('📝 Story generation request received:', req.body?.topic || 'No topic provided');
  
  try {
    const { topic, language = 'es', storyLength, storyType, creativityLevel, ageGroup, childNames, englishLevel, spanishLevel } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: 'Missing required parameter: topic' });
    }

    // User comes from auth middleware with Firestore data
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Use the authenticated user's email
    const email = user.email;

    // Check if user's email is verified (Firebase Auth)
    if (!user.emailVerified) {
      return res.status(403).json({ 
        error: 'Email not verified',
        message: 'Debes verificar tu email antes de crear cuentos. Revisa tu bandeja de entrada.',
        details: 'Please verify your email address before creating stories.'
      });
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

    // Get system message by language
    let systemMessage;
    switch (language) {
      case 'en':
        systemMessage = `You are a creative children's story writer in English. Create original, coherent and captivating stories that are fun and engaging for children.

SPECIAL INSTRUCTIONS FOR FUN AND ORIGINAL STORIES:
- Intelligent humor appropriate for children
- Characters with unique personalities and funny flaws
- Absurd but believable situations  
- Natural and spontaneous dialogues
- You avoid being cheesy, cloying or overly sweet
- You don't use typical fairy tale clichés
- You create satisfying but not predictable endings

IMPORTANT: You must respond with a JSON object containing exactly two fields:
{
  "title": "A creative and engaging title for the story",
  "content": "The complete story content in English"
}

Write the story in English.`;
        break;
      case 'de':
        systemMessage = `Du bist ein kreativer Geschichtenschreiber auf Deutsch. Erstelle originelle, kohärente und fesselnde Geschichten.

WICHTIG: Du musst mit einem JSON-Objekt antworten, das genau zwei Felder enthält:
{
  "title": "Ein kreativer und ansprechender Titel für die Geschichte",
  "content": "Der vollständige Geschichteninhalt auf Deutsch"
}

Schreibe die Geschichte auf Deutsch.`;
        break;
      case 'fr':
        systemMessage = `Vous êtes un écrivain créatif en français. Créez des histoires originales, cohérentes et captivantes.

IMPORTANT: Vous devez répondre avec un objet JSON contenant exactement deux champs:
{
  "title": "Un titre créatif et engageant pour l'histoire",
  "content": "Le contenu complet de l'histoire en français"
}

Écrivez l'histoire en français.`;
        break;
      case 'ca':
        systemMessage = `Ets un escriptor creatiu en català. Crea històries originals, coherents i captivadores.

IMPORTANT: Has de respondre amb un objecte JSON que contingui exactamente dos camps:
{
  "title": "Un títol creatiu i atractiu per a la història",
  "content": "El contingut complet de la història en català"
}

Escriu la història en català.`;
        break;
      case 'it':
        systemMessage = `Sei uno scrittore creativo in italiano. Crea storie originali, coerenti e avvincenti.

IMPORTANTE: Devi rispondere con un oggetto JSON contenente esattamente due campi:
{
  "title": "Un titolo creativo e coinvolgente per la storia",
  "content": "Il contenuto completo della storia in italiano"
}

Scrivi la storia in italiano.`;
        break;
      case 'gl':
        systemMessage = `Es un escritor creativo en galego. Crea historias orixinais, coherentes e cativadoras.

IMPORTANTE: Debes responder cun obxecto JSON que conteña exactamente dous campos:
{
  "title": "Un título creativo e atractivo para a historia",
  "content": "O contido completo da historia en galego"
}

Escribe a historia en galego.`;
        break;
      case 'eu':
        systemMessage = `Euskal ipuin idazle sortzailea zara. Jatorrizko, koherente eta erakargarriak diren ipuinak sortu.

GARRANTZITSUA: JSON objektu batekin erantzun behar duzu bi eremu zehatz dituela:
{
  "title": "Ipuinaren izenburu sortzaile eta erakargarria",
  "content": "Ipuinaren eduki osoa euskaraz"
}

Ipuina euskaraz idatzi.`;
        break;
      case 'pt':
        systemMessage = `Você é um escritor criativo em português. Crie histórias originais, coerentes e cativantes.

IMPORTANTE: Você deve responder com um objeto JSON contendo exatamente dois campos:
{
  "title": "Um título criativo e envolvente para a história",
  "content": "O conteúdo completo da história em português"
}

Escreva a história em português.`;
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

IMPORTANTE: Debes responder con un objeto JSON que contenga exactamente dos campos:
{
  "title": "Un título creativo y atractivo para la historia",
  "content": "El contenido completo de la historia en español"
}

Escribe la historia en español.`;
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

    console.log('👤 User from auth middleware:', {
      email: user.email,
      storiesGenerated: user.storiesGenerated,
      monthlyStoriesGenerated: user.monthlyStoriesGenerated,
      subscriptionStatus: user.subscriptionStatus
    });

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
    
    // Include title in the content for audio generation
    const contentWithTitle = `${story.title}\n\n${story.content}`;
    
    console.log('📑 Generated story:', {
      title: story.title,
      contentLength: story.content.length,
      contentWithTitleLength: contentWithTitle.length
    });

    // Save to database
    console.log('💾 Saving story to database...');
    const savedStory = await storyService.create({
      title: story.title,
      content: contentWithTitle,  // Save content with title included
      email,  // Guardar el email del usuario
      user: user.uid,  // Associate with Firebase user UID
      language: language,  // Save language
      ageGroup: ageGroup,  // Save age group
      englishLevel: englishLevel,  // Save English level
      spanishLevel: spanishLevel,  // Save Spanish level
      storyType: storyType,  // Save story type
      storyLength: storyLength,  // Save story length
      childNames: childNames,  // Save child names
    });

    // Update user story counts (skip for admins)
    if (!user.isAdmin) {
      console.log('👤 Updating user story counts in Firestore...');
      
      // Update in Firestore
      const userRef = db.collection('users').doc(user.uid);
      await userRef.update({
        storiesGenerated: user.storiesGenerated + 1,
        monthlyStoriesGenerated: user.monthlyStoriesGenerated + 1,
        updatedAt: new Date()
      });
      
      // Update local user object for immediate use
      user.storiesGenerated += 1;
      user.monthlyStoriesGenerated += 1;
      
      console.log('✅ User story counts updated in Firestore');
    } else {
      console.log('👑 Admin user - skipping story count increment');
    }

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
    const { voiceId, speechRate, musicTrack } = req.body;

    if (!storyId) {
      return res.status(400).json({ error: 'Story ID is required' });
    }

    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Use the authenticated user's email
    const email = req.user.email;

    // Check if user's email is verified (Firebase Auth)
    if (!req.user.emailVerified) {
      return res.status(403).json({ 
        error: 'Email not verified',
        message: 'Debes verificar tu email antes de generar audio. Revisa tu bandeja de entrada.',
        details: 'Please verify your email address before generating audio.'
      });
    }

    // Find the story
    const story = await storyService.findById(storyId);
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
    // Since content now includes title, we need to separate them
    const contentLines = story.content.split('\n');
    const titleFromContent = contentLines[0];
    const contentWithoutTitle = contentLines.slice(2).join('\n'); // Skip title and empty line
    
    const audioData = await googleTtsService.synthesizeSpeech(
      contentWithoutTitle,  // Content without title
      voiceId || 'female',
      speechRate || 1.0,
      true,  // useIntelligentPauses
      titleFromContent  // Pass the title separately for automatic pause detection
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
  // Admins have unlimited access
  if (user.isAdmin) {
    console.log('👑 Admin user detected - unlimited access granted');
    return true;
  }

  // Check and reset monthly count if needed
  if (user.checkAndResetMonthlyCount) {
    user.checkAndResetMonthlyCount();
  }

  // Free users get 3 stories total
  if (user.subscriptionStatus !== 'active') {
    return user.storiesGenerated < 3;
  }

  // Subscribed users get 30 stories per month
  return user.monthlyStoriesGenerated < 30;
}

async function getStoriesRemaining(user) {
  // Admins have unlimited access
  if (user.isAdmin) {
    return 999999; // Infinite for display purposes
  }

  // Check and reset monthly count if needed
  if (user.checkAndResetMonthlyCount) {
    user.checkAndResetMonthlyCount();
  }

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
  try {
    const { id } = req.params;
    const story = await storyService.findById(id);
    
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    res.json({
      success: true,
      story: story.toObject()
    });
  } catch (error) {
    console.error('Error fetching story by ID:', error);
    res.status(500).json({ error: 'Error fetching story' });
  }
};

// New function to get all stories for a specific user
exports.getUserStories = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    // Validate user authorization - use Firebase UID instead of MongoDB ObjectId
    if (req.user.uid !== userId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized to access these stories' });
    }

    // Use Firestore service to find stories by user ID
    const result = await storyService.findByEmail(req.user.email, {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    });

    res.json({
      success: true,
      stories: result.stories,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching user stories:', error);
    res.status(500).json({ error: 'Error fetching user stories' });
  }
};

// New function to get all stories for current authenticated user (by email)
exports.getMyStories = async (req, res, next) => {
  try {
    console.log('🔍 [CONTROLLER] getMyStories called');
    console.log('User from auth middleware:', req.user ? {
      email: req.user.email,
      id: req.user._id,
      subscriptionStatus: req.user.subscriptionStatus
    } : 'No user found');
    
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    console.log('Query params:', { page, limit, sortBy, sortOrder });
    
    if (!req.user || !req.user.email) {
      console.log('❌ No user email found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const userEmail = req.user.email;
    console.log('Searching stories for user email:', userEmail);
    
    const result = await storyService.findByEmail(userEmail, {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    });

    console.log('Found stories:', result.stories.length);
    console.log('Total stories for user:', result.totalStories);

    res.json({
      success: true,
      stories: result.stories,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching user stories:', error);
    res.status(500).json({ error: 'Error fetching user stories' });
  }
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
    const count = await storyService.countDocuments();
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

// Function to upload file to Firebase Storage
async function uploadToFirebaseStorage(localFilePath, storagePath) {
    try {
        const bucket = getFirebaseStorageBucket();
        await bucket.upload(localFilePath, {
            destination: storagePath,
            metadata: {
                cacheControl: 'public, max-age=31536000',
            },
        });
        
        console.log(`✅ Uploaded to Firebase Storage: ${storagePath}`);
        return storagePath;
    } catch (error) {
        console.error(`❌ Error uploading to Firebase Storage ${storagePath}:`, error);
        throw error;
    }
}

// Function to generate image with OpenAI
async function generateStoryImage(title) {
    try {
        const prompt = `Create a children's storybook illustration for the title "${title}". Style: vintage storybook, warm colors, detailed but child-friendly. IMPORTANT: NO TEXT OR WORDS should appear in the image - only visual elements like characters, scenery, and objects. Pure illustration without any written text, letters, or captions.`;
        const response = await openaiService.generateImage(prompt);
        return response.data[0].url;
    } catch (error) {
        console.error('Error generating image:', error);
        throw error;
    }
}

// Function to publish story
exports.publishStory = async (req, res) => {
    console.log('🎯 [PUBLISH] Controller started - received request');
    console.log('🎯 [PUBLISH] User from middleware:', req.user ? req.user.email : 'No user');
    console.log('🎯 [PUBLISH] Story ID:', req.params.storyId);
    
    try {
        // Check if Firebase Storage is available
        try {
            getFirebaseStorageBucket();
        } catch (error) {
            return res.status(503).json({ 
                error: 'Publishing service unavailable', 
                message: 'Firebase Storage is not configured. Please contact administrator.' 
            });
        }

        const { storyId } = req.params;

        if (!storyId) {
            return res.status(400).json({ error: 'Story ID is required' });
        }

        // Check if user is authenticated
        if (!req.user || !req.user.email) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const authenticatedUserEmail = req.user.email;

        // Check if user's email is verified (Firebase Auth)
        if (!req.user.emailVerified) {
            return res.status(403).json({ 
                error: 'Email not verified',
                message: 'Debes verificar tu email antes de publicar cuentos. Revisa tu bandeja de entrada.',
                details: 'Please verify your email address before publishing stories.'
            });
        }

        // Find the story
        const story = await storyService.findById(storyId);
        if (!story) {
            return res.status(404).json({ error: 'Story not found' });
        }

        // Debug logging for authorization
        console.log('🔍 [PUBLISH] Authorization check:');
        console.log('Story email:', story.email);
        console.log('Authenticated user email:', authenticatedUserEmail);
        console.log('Story email type:', typeof story.email);
        console.log('Auth email type:', typeof authenticatedUserEmail);
        console.log('Emails match:', story.email === authenticatedUserEmail);

        // Verify ownership using authenticated user's email
        if (story.email !== authenticatedUserEmail) {
            console.log('❌ [PUBLISH] Email mismatch - Authorization failed');
            console.log('❌ Story belongs to:', story.email);
            console.log('❌ User is authenticated as:', authenticatedUserEmail);
            return res.status(403).json({ 
                error: 'Unauthorized to publish this story',
                message: 'You can only publish stories that you created.'
            });
        }

        console.log('✅ [PUBLISH] Authorization successful - proceeding with publish');

        // Create temp directory if it doesn't exist
        const tempDir = path.join(__dirname, '../temp');
        await fs.mkdir(tempDir, { recursive: true });

        // Save text file
        const textFileName = `${storyId}.txt`;
        const textFilePath = path.join(tempDir, textFileName);
        await fs.writeFile(textFilePath, story.content, 'utf8');

        // Generate and save audio if not already generated
        let audioPath = story.audioPath;
        if (!audioPath) {
            const audioContent = await googleTtsService.synthesizeSpeech(
                story.content,
                'female',
                1.0,
                true
            );
            const audioFileName = `${storyId}.mp3`;
            const audioFilePath = path.join(tempDir, audioFileName);
            await fs.writeFile(audioFilePath, audioContent);
            audioPath = await uploadToFirebaseStorage(audioFilePath, `audio/${audioFileName}`);
        }

        // Generate and save image
        const imageUrl = await generateStoryImage(story.title);
        const imageResponse = await fetch(imageUrl);
        const imageArrayBuffer = await imageResponse.arrayBuffer();
        const imageBuffer = Buffer.from(imageArrayBuffer);
        
        // Compress image to reduce file size (keep quality but reduce size)
        const compressedImageBuffer = await sharp(imageBuffer)
            .resize(800, 800, { 
                fit: 'inside', 
                withoutEnlargement: true 
            })
            .jpeg({ 
                quality: 85,
                progressive: true 
            })
            .toBuffer();
        
        console.log(`📊 Image compression: ${imageBuffer.length} bytes → ${compressedImageBuffer.length} bytes (${Math.round((1 - compressedImageBuffer.length/imageBuffer.length) * 100)}% reduction)`);
        
        const imageFileName = `${storyId}.jpg`;
        const imageFilePath = path.join(tempDir, imageFileName);
        await fs.writeFile(imageFilePath, compressedImageBuffer);
        const imagePath = await uploadToFirebaseStorage(imageFilePath, `images/${imageFileName}`);

        // Upload text file
        const textPath = await uploadToFirebaseStorage(textFilePath, `stories/${textFileName}`);

        // Update story with paths and published status
        await storyService.update(story.id, {
          audioPath: audioPath,
          textPath: textPath,
          imagePath: imagePath,
          published: true
        });

        // Get the updated story
        const updatedStory = await storyService.findById(story.id);

        // Create Firestore document for frontend gallery display
        try {
            // Language mapping to display correct language names
            const languageDisplayMap = {
                'es': 'spanish',
                'en': 'english', 
                'ca': 'catalan',
                'de': 'german',
                'fr': 'french',
                'it': 'italian',
                'gl': 'galician',
                'eu': 'basque',
                'pt': 'portuguese'
            };

            // Get the appropriate level based on language
            const getStoryLevel = () => {
                switch(story.language) {
                    case 'en':
                        return story.englishLevel || "beginner";
                    case 'es':
                    case 'ca': // Catalan uses Spanish level system
                    case 'gl': // Galician uses Spanish level system
                        return story.spanishLevel || "beginner";
                    default:
                        return "intermediate"; // Default for other languages
                }
            };

            const firestoreDoc = {
                age: story.ageGroup || "6to8", // Default age group is now 6to8
                audioPath: audioPath,
                imagePath: imagePath,
                language: languageDisplayMap[story.language] || "spanish", // Map language code to display name
                level: getStoryLevel(), // Use appropriate level mapping
                protagonista: extractProtagonist(story.content, story.title) || (story.childNames ? story.childNames.split(',')[0].trim() : "Personaje Principal"), // Use child names if available
                textPath: textPath,
                title: story.title,
                createdAt: new Date(),
                email: authenticatedUserEmail, // Use authenticated user's email
                published: true,
                storyType: story.storyType || "original", // Use actual story type
                storyLength: story.storyLength || "medium" // Use actual story length
            };

            // Add to Firestore collection
            const docRef = await db.collection('storyExamples').add(firestoreDoc);
            console.log('✅ Story added to Firestore with ID:', docRef.id);
            console.log('📊 Firestore document:', firestoreDoc);
            
        } catch (firestoreError) {
            console.error('❌ Error adding story to Firestore:', firestoreError);
            // Don't fail the entire request if Firestore fails
        }

        // Clean up temp files
        try {
            await fs.unlink(textFilePath);
            await fs.unlink(imageFilePath);
            if (!story.audioPath) {
                await fs.unlink(path.join(tempDir, `${storyId}.mp3`));
            }
        } catch (cleanupError) {
            console.warn('Warning: Error cleaning up temp files:', cleanupError);
        }

        res.json({
            success: true,
            story: {
                id: updatedStory.id,
                title: updatedStory.title,
                audioPath: updatedStory.audioPath,
                textPath: updatedStory.textPath,
                imagePath: updatedStory.imagePath,
                published: updatedStory.published
            }
        });

    } catch (error) {
        console.error('❌ [PUBLISH] Error publishing story:', error);
        console.error('❌ [PUBLISH] Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        
        // Provide more specific error messages based on error type
        let errorMessage = 'Failed to publish story';
        let statusCode = 500;
        
        if (error.message.includes('OpenAI') || error.message.includes('quota')) {
            errorMessage = 'Image generation service temporarily unavailable';
            statusCode = 503;
        } else if (error.message.includes('Firebase') || error.message.includes('Storage')) {
            errorMessage = 'File upload service temporarily unavailable';
            statusCode = 503;
        } else if (error.message.includes('Story not found')) {
            errorMessage = 'Story not found';
            statusCode = 404;
        } else if (error.message.includes('Unauthorized')) {
            errorMessage = 'Unauthorized to publish this story';
            statusCode = 403;
        }
        
        res.status(statusCode).json({ 
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Function to extract protagonist from story content
function extractProtagonist(content, title) {
    try {
        // Try to find names in the story content
        // Look for capitalized words that appear multiple times (likely character names)
        const words = content.match(/\b[A-Z][a-z]+\b/g) || [];
        const wordCount = {};
        
        // Count occurrences of each capitalized word
        words.forEach(word => {
            // Skip common words that aren't names
            if (!['The', 'A', 'An', 'And', 'But', 'Or', 'So', 'Then', 'When', 'Where', 'What', 'Who', 'How', 'Why', 'Once', 'Upon', 'Time'].includes(word)) {
                wordCount[word] = (wordCount[word] || 0) + 1;
            }
        });
        
        // Find the most frequent name (appearing more than once)
        let protagonist = null;
        let maxCount = 1;
        
        for (const [word, count] of Object.entries(wordCount)) {
            if (count > maxCount && word.length > 2) {
                protagonist = word;
                maxCount = count;
            }
        }
        
        return protagonist;
    } catch (error) {
        console.warn('Error extracting protagonist:', error);
        return null;
    }
}

// Rate a story
exports.rateStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const { rating } = req.body;
    
    console.log('🌟 Rating story request:', { storyId, rating, user: req.user?.email });
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return res.status(400).json({ 
        error: 'Rating must be an integer between 1 and 5' 
      });
    }
    
    // Find the story
    const story = await storyService.findById(storyId);
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }
    
    // Add or update rating - use Firebase UID instead of MongoDB ObjectId
    if (story.addRating) {
      story.addRating(req.user.uid, req.user.email, rating);
      await story.save();
    } else {
      // For now, just update the story with basic rating info
      await storyService.update(storyId, {
        averageRating: rating,
        totalRatings: 1
      });
    }
    
    console.log('✅ Story rated successfully:', {
      storyId,
      rating,
      averageRating: story.averageRating,
      totalRatings: story.totalRatings
    });
    
    res.json({
      success: true,
      message: 'Story rated successfully',
      data: {
        averageRating: story.averageRating || rating,
        totalRatings: story.totalRatings || 1,
        userRating: rating
      }
    });
  } catch (error) {
    console.error('Error rating story:', error);
    res.status(500).json({ error: 'Error rating story' });
  }
};

// Get story ratings
exports.getStoryRatings = async (req, res) => {
  try {
    const { storyId } = req.params;
    
    const story = await storyService.findById(storyId);
    
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }
    
    let userRating = null;
    if (req.user) {
      userRating = story.getUserRating ? story.getUserRating(req.user.uid) : null;
    }
    
    res.json({
      success: true,
      data: {
        averageRating: story.averageRating,
        totalRatings: story.totalRatings,
        userRating: userRating
      }
    });
  } catch (error) {
    console.error('Error fetching story ratings:', error);
    res.status(500).json({ error: 'Error fetching story ratings' });
  }
};

// Get top rated stories
exports.getTopRatedStories = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const result = await storyService.findPublished({
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      stories: result.stories,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching top rated stories:', error);
    res.status(500).json({ error: 'Error fetching top rated stories' });
  }
};

// Test if backend is reachable
fetch('https://generadorcuentos.onrender.com/api/health')
  .then(response => response.json())
  .then(data => console.log('Backend health:', data))
  .catch(error => console.error('Backend unreachable:', error));

// Test publish process step by step
exports.testPublishProcess = async (req, res) => {
    const { storyId } = req.params;
    const testResults = {};
    
    try {
        console.log(`🧪 [PUBLISH TEST] Starting diagnostic for story ${storyId}`);
        
        // Step 1: Check if story exists
        console.log('📝 [STEP 1] Checking if story exists...');
        try {
            const story = await storyService.findById(storyId);
            if (!story) {
                throw new Error('Story not found');
            }
            testResults.step1_storyExists = { success: true, data: { id: story.id, title: story.title } };
            console.log('✅ [STEP 1] Story found');
        } catch (error) {
            testResults.step1_storyExists = { success: false, error: error.message };
            console.log('❌ [STEP 1] Story not found:', error.message);
            return res.json({ success: false, testResults, failedAt: 'step1_storyExists' });
        }
        
        // Step 2: Test Firebase Storage bucket access
        console.log('📦 [STEP 2] Testing Firebase Storage access...');
        try {
            const bucket = getFirebaseStorageBucket();
            testResults.step2_firebaseStorage = { success: true, data: { bucketName: bucket.name } };
            console.log('✅ [STEP 2] Firebase Storage accessible');
        } catch (error) {
            testResults.step2_firebaseStorage = { success: false, error: error.message };
            console.log('❌ [STEP 2] Firebase Storage error:', error.message);
            return res.json({ success: false, testResults, failedAt: 'step2_firebaseStorage' });
        }
        
        // Step 3: Test OpenAI image generation (without actually generating)
        console.log('🎨 [STEP 3] Testing OpenAI access...');
        try {
            const openaiService = require('../services/openaiService');
            // Just check if the service is properly configured
            if (!openaiService.generateImage) {
                throw new Error('OpenAI service not properly configured');
            }
            testResults.step3_openaiAccess = { success: true, data: { serviceAvailable: true } };
            console.log('✅ [STEP 3] OpenAI service accessible');
        } catch (error) {
            testResults.step3_openaiAccess = { success: false, error: error.message };
            console.log('❌ [STEP 3] OpenAI service error:', error.message);
            return res.json({ success: false, testResults, failedAt: 'step3_openaiAccess' });
        }
        
        // Step 4: Test temp directory creation
        console.log('📁 [STEP 4] Testing temp directory creation...');
        try {
            const tempDir = path.join(__dirname, '..', 'temp', `publish-test-${Date.now()}`);
            await fs.mkdir(tempDir, { recursive: true });
            await fs.rmdir(tempDir); // Clean up immediately
            testResults.step4_tempDirectory = { success: true, data: { canCreateTemp: true } };
            console.log('✅ [STEP 4] Temp directory creation works');
        } catch (error) {
            testResults.step4_tempDirectory = { success: false, error: error.message };
            console.log('❌ [STEP 4] Temp directory error:', error.message);
            return res.json({ success: false, testResults, failedAt: 'step4_tempDirectory' });
        }
        
        // Step 5: Test TTS service
        console.log('🎤 [STEP 5] Testing TTS service...');
        try {
            const googleTtsService = require('../utils/googleTtsService');
            if (!googleTtsService.convertTextToSpeech) {
                throw new Error('TTS service not properly configured');
            }
            testResults.step5_ttsService = { success: true, data: { serviceAvailable: true } };
            console.log('✅ [STEP 5] TTS service accessible');
        } catch (error) {
            testResults.step5_ttsService = { success: false, error: error.message };
            console.log('❌ [STEP 5] TTS service error:', error.message);
            return res.json({ success: false, testResults, failedAt: 'step5_ttsService' });
        }
        
        // Step 6: Test Sharp (image processing)
        console.log('🖼️ [STEP 6] Testing Sharp image processing...');
        try {
            const sharp = require('sharp');
            testResults.step6_sharpProcessing = { success: true, data: { sharpAvailable: true } };
            console.log('✅ [STEP 6] Sharp available');
        } catch (error) {
            testResults.step6_sharpProcessing = { success: false, error: error.message };
            console.log('❌ [STEP 6] Sharp error:', error.message);
            return res.json({ success: false, testResults, failedAt: 'step6_sharpProcessing' });
        }
        
        console.log('🎉 [PUBLISH TEST] All tests passed!');
        res.json({ 
            success: true, 
            testResults, 
            message: 'All publish process components are working correctly' 
        });
        
    } catch (error) {
        console.error('❌ [PUBLISH TEST] Unexpected error:', error);
        res.status(500).json({ 
            success: false, 
            testResults, 
            error: error.message,
            failedAt: 'unexpected_error'
        });
    }
};