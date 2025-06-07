// controllers/storyController.js
const User = require('../models/User');
const Story = require('../models/Story');
const googleTtsService = require('../utils/googleTtsService');
const { mixAudioWithBackground, getRandomMusicTrack, BACKGROUND_MUSIC_TRACKS } = require('../utils/audioMixer');
const openaiService = require('../utils/openaiService');
const { constructPrompt, extractTitle } = require('../utils/helpers');
const admin = require('firebase-admin');
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
console.log("OpenAI API Key:", process.env.OPENAI_API_KEY ? "Configurada (primeros caracteres: " + process.env.OPENAI_API_KEY.substring(0, 5) + "...)" : "No configurada");

// Initialize Firebase Admin if not already initialized and credentials exist
let firebaseInitialized = false;
let db = null;
let bucket = null;

if (!admin.apps.length) {
    try {
        // Use environment variables for Firebase credentials
        if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
            const serviceAccount = {
                type: "service_account",
                project_id: process.env.FIREBASE_PROJECT_ID,
                private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
                private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                client_email: process.env.FIREBASE_CLIENT_EMAIL,
                client_id: process.env.FIREBASE_CLIENT_ID,
                auth_uri: "https://accounts.google.com/o/oauth2/auth",
                token_uri: "https://oauth2.googleapis.com/token",
                auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
                client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
            };

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'cuentacuentos-b2e64.firebasestorage.app'
            });
            db = admin.firestore();
            bucket = admin.storage().bucket();
            firebaseInitialized = true;
            console.log('🔥 Firebase initialized successfully from environment variables');
        } else {
            console.log('⚠️  Firebase credentials not found in environment variables');
            console.log('📝 Story publishing will be disabled until Firebase is configured');
        }
    } catch (error) {
        console.error('❌ Error initializing Firebase:', error.message);
        console.log('📝 Story publishing will be disabled until Firebase is configured');
    }
}

exports.generateStory = async (req, res, next) => {
  console.log('📝 Story generation request received:', req.body?.topic || 'No topic provided');
  
  try {
    const { topic, email, language = 'es', storyLength, storyType, creativityLevel, ageGroup, childNames, englishLevel, spanishLevel } = req.body;
    
    if (!topic || !email) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Check if user's email is verified (Firebase Auth)
    if (req.user && !req.user.emailVerified) {
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
    
    // Include title in the content for audio generation
    const contentWithTitle = `${story.title}\n\n${story.content}`;
    
    console.log('📑 Generated story:', {
      title: story.title,
      contentLength: story.content.length,
      contentWithTitleLength: contentWithTitle.length
    });

    // Save to database
    console.log('💾 Saving story to database...');
    const savedStory = await Story.create({
      title: story.title,
      content: contentWithTitle,  // Save content with title included
      email,  // Guardar el email del usuario
      user: user._id,  // Associate with user
      language: language,  // Save language
      ageGroup: ageGroup,  // Save age group
      englishLevel: englishLevel,  // Save English level
      spanishLevel: spanishLevel,  // Save Spanish level
      storyType: storyType,  // Save story type
      storyLength: storyLength,  // Save story length
      childNames: childNames,  // Save child names
      createdAt: new Date()
    });

    // Update user story counts (skip for admins)
    if (!user.isAdmin) {
      console.log('👤 Updating user story counts...');
      await User.findByIdAndUpdate(user._id, {
        $inc: { 
          storiesGenerated: 1,
          monthlyStoriesGenerated: 1
        }
      });
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
    const { email, voiceId, speechRate, musicTrack } = req.body;

    if (!storyId || !email) {
      return res.status(400).json({ error: 'Story ID and email are required' });
    }

    // Check if user's email is verified (Firebase Auth)
    if (req.user && !req.user.emailVerified) {
      return res.status(403).json({ 
        error: 'Email not verified',
        message: 'Debes verificar tu email antes de generar audio. Revisa tu bandeja de entrada.',
        details: 'Please verify your email address before generating audio.'
      });
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
  user.checkAndResetMonthlyCount();

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
  try {
    const { id } = req.params;
    const story = await Story.findById(id).populate('user', 'email');
    
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
    
    // Validate user authorization
    if (req.user._id.toString() !== userId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized to access these stories' });
    }

    const skip = (page - 1) * limit;
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const stories = await Story.find({ user: userId })
      .populate('user', 'email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const totalStories = await Story.countDocuments({ user: userId });

    res.json({
      success: true,
      stories,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(totalStories / limit),
        totalStories,
        hasNext: page * limit < totalStories,
        hasPrev: page > 1
      }
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
    
    const skip = (page - 1) * limit;
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const stories = await Story.find({ email: userEmail })
      .populate('user', 'email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    console.log('Found stories:', stories.length);

    const totalStories = await Story.countDocuments({ email: userEmail });
    console.log('Total stories for user:', totalStories);

    res.json({
      success: true,
      stories,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(totalStories / limit),
        totalStories,
        hasNext: page * limit < totalStories,
        hasPrev: page > 1
      }
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

// Function to upload file to Firebase Storage
async function uploadToFirebaseStorage(localFilePath, storagePath) {
    try {
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
        const prompt = `Create a children's storybook illustration for the title "${title}". Style: vintage storybook, warm colors, detailed but child-friendly.`;
        const response = await openaiService.generateImage(prompt);
        return response.data[0].url;
    } catch (error) {
        console.error('Error generating image:', error);
        throw error;
    }
}

// Function to publish story
exports.publishStory = async (req, res) => {
    try {
        // Check if Firebase is initialized
        if (!firebaseInitialized) {
            return res.status(503).json({ 
                error: 'Publishing service unavailable', 
                message: 'Firebase Storage is not configured. Please contact administrator.' 
            });
        }

        const { storyId } = req.params;
        const { email } = req.body;

        if (!storyId || !email) {
            return res.status(400).json({ error: 'Story ID and email are required' });
        }

        // Check if user's email is verified (Firebase Auth)
        if (req.user && !req.user.emailVerified) {
            return res.status(403).json({ 
                error: 'Email not verified',
                message: 'Debes verificar tu email antes de publicar cuentos. Revisa tu bandeja de entrada.',
                details: 'Please verify your email address before publishing stories.'
            });
        }

        // Find the story
        const story = await Story.findById(storyId);
        if (!story) {
            return res.status(404).json({ error: 'Story not found' });
        }

        // Verify ownership
        if (story.email !== email) {
            return res.status(403).json({ error: 'Unauthorized to publish this story' });
        }

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
        story.audioPath = audioPath;
        story.textPath = textPath;
        story.imagePath = imagePath;
        story.published = true;
        await story.save();

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
                email: email,
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
                id: story._id,
                title: story.title,
                audioPath: story.audioPath,
                textPath: story.textPath,
                imagePath: story.imagePath,
                published: story.published
            }
        });

    } catch (error) {
        console.error('Error publishing story:', error);
        res.status(500).json({ error: 'Failed to publish story' });
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
    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }
    
    // Add or update rating
    story.addRating(req.user._id, req.user.email, rating);
    await story.save();
    
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
        averageRating: story.averageRating,
        totalRatings: story.totalRatings,
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
    
    const story = await Story.findById(storyId)
      .select('averageRating totalRatings ratings');
    
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }
    
    let userRating = null;
    if (req.user) {
      userRating = story.getUserRating(req.user._id);
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
    const skip = (page - 1) * limit;
    
    const stories = await Story.find({ published: true })
      .populate('user', 'email')
      .sort({ averageRating: -1, totalRatings: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-ratings'); // Don't send individual ratings for privacy
    
    const totalStories = await Story.countDocuments({ published: true });
    
    res.json({
      success: true,
      stories,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(totalStories / limit),
        totalStories,
        hasNext: page * limit < totalStories,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching top rated stories:', error);
    res.status(500).json({ error: 'Error fetching top rated stories' });
  }
};