// routes/storyRoutes.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const storyController = require('../controllers/storyController');

// Generate story
router.post('/generate', auth, (req, res, next) => {
  console.log('📝 Story generation route hit:', req.body?.topic || 'No topic provided');
  console.log('👤 User from auth middleware:', req.user?.email || 'No user email');
  console.log('🌍 Language:', req.body?.language || 'No language provided');
  
  // Verificar que la solicitud viene de un origen permitido
  const origin = req.headers.origin;
  console.log('🌐 Request origin:', origin);
  
  if (!origin) {
    console.log('❌ No origin header in request');
    return res.status(403).json({ error: 'Forbidden: No origin header' });
  }
  
  // Verificar que el origen es válido
  const allowedOrigins = [
    'http://localhost:3000',
    'https://www.audiogretel.com',
    'https://audiogretel.com'
  ];
  
  if (!allowedOrigins.includes(origin)) {
    console.log('❌ Invalid origin:', origin);
    return res.status(403).json({ error: 'Forbidden: Invalid origin' });
  }
  
  // El usuario ya está verificado por el middleware auth
  // req.user ya está disponible con los datos de Firebase/Firestore
  
  // Continuar con la generación de la historia
  storyController.generateStory(req, res, next);
});

// 📡 SSE endpoint for streaming story generation
router.get('/stream', (req, res, next) => {
  console.log('📡 [SSE] Stream endpoint hit:', req.query?.storyId || 'No storyId provided');
  
  // Verificar origen para SSE también
  const origin = req.headers.origin;
  console.log('📡 [SSE] Request origin:', origin);
  
  const allowedOrigins = [
    'http://localhost:3000',
    'https://www.audiogretel.com',
    'https://audiogretel.com'
  ];
  
  if (origin && origin !== 'null' && !allowedOrigins.includes(origin)) {
    console.log('❌ [SSE] Invalid origin:', origin);
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden: Invalid origin');
    return;
  }
  
  // Continuar con el streaming
  storyController.streamStoryGeneration(req, res, next);
});

// OpenAI API Health check
router.get('/health', storyController.healthCheck);

// Get remaining stories count for current user
router.get('/remaining', auth, async (req, res) => {
  try {
    const user = req.user;
    
    console.log('📊 [REMAINING] User data from auth middleware:', {
      email: user.email,
      storiesGenerated: user.storiesGenerated,
      monthlyStoriesGenerated: user.monthlyStoriesGenerated,
      subscriptionStatus: user.subscriptionStatus
    });
    
    // Check and reset monthly count if needed
    if (user.checkAndResetMonthlyCount) {
      user.checkAndResetMonthlyCount();
    }
    
    // Calculate remaining stories
    let storiesRemaining = 0;
    let totalAllowed = 3;
    let used = user.storiesGenerated || 0;
    
    if (user.subscriptionStatus === 'active') {
      totalAllowed = 30;
      used = user.monthlyStoriesGenerated || 0;
      storiesRemaining = Math.max(0, 30 - used);
    } else {
      storiesRemaining = Math.max(0, 3 - used);
    }
    
    console.log('📊 [REMAINING] Calculated values:', {
      storiesRemaining,
      totalAllowed,
      used,
      subscriptionStatus: user.subscriptionStatus
    });
    
    res.json({
      storiesRemaining,
      totalAllowed,
      used
    });
  } catch (error) {
    console.error('Error getting remaining stories:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user's stories (authenticated route)
router.get('/my-stories', auth, (req, res, next) => {
  console.log('🔍 [MY-STORIES] Route hit - Debug info:');
  console.log('Authorization header:', req.headers.authorization ? req.headers.authorization.substring(0, 20) + '...' : 'None');
  console.log('Request method:', req.method);
  console.log('Request path:', req.path);
  console.log('User from auth middleware:', req.user ? req.user.email : 'No user');
  
  // Call the controller
  storyController.getMyStories(req, res, next);
});

// Get signed URL for library images (prioritizes WebP)
// GET /api/stories/image-url?path=images/filename.jpg
router.get('/image-url', storyController.getLibraryImageUrl);

// Get story by ID
router.get('/:storyId', auth, storyController.getStoryById);

// Publish story
router.post('/:storyId/publish', auth, storyController.publishStory);

// NEW: Diagnostic endpoint for publish process
router.post('/:storyId/publish-test', auth, storyController.testPublishProcess);

// Generate audio for a story
router.post('/:storyId/audio', storyController.generateAudio);

// Get stories for a specific user (admin or owner only)
router.get('/user/:userId', auth, storyController.getUserStories);

// Get top rated stories
router.get('/top-rated', storyController.getTopRatedStories);

// Rate a story (authenticated route)
router.post('/:storyId/rate', auth, storyController.rateStory);

// Get story ratings
router.get('/:storyId/ratings', storyController.getStoryRatings);

// TEMPORARY: Generate test image with Memphis style (NO AUTH for testing)
router.get('/test-memphis-image', async (req, res) => {
  const { generateImage } = require('../utils/openaiService');
  const { admin } = require('../config/firebase');
  const fs = require('fs').promises;
  const path = require('path');
  const os = require('os');
  
  const tempDir = os.tmpdir();
  let imagePath;
  
  try {
    console.log('🎨 Generating Memphis style test image...');
    
    const prompt = `Memphis style, geometric shapes, vibrant electric blue, hot pink, yellow, and deep purples. 
Night space theme. Energetic and educational. Show Sara in a girl playing videogames in a futuristic room with space elements. 
IMPORTANT: NO TEXT OR WORDS should appear in the image - only visual elements.`;
    
    const response = await generateImage(prompt);
    
    if (!response.data || !response.data[0] || !response.data[0].url) {
      throw new Error('Invalid response from image generation service');
    }
    
    const imageUrl = response.data[0].url;
    console.log('✅ Image generated, downloading...');
    
    let imageBuffer;
    if (imageUrl.startsWith('data:')) {
      const base64Data = imageUrl.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.status}`);
      }
      const imageArrayBuffer = await imageResponse.arrayBuffer();
      imageBuffer = Buffer.from(imageArrayBuffer);
    }
    
    console.log('✅ Image downloaded, saving to Firebase...');
    
    const imageFileName = `test-memphis-${Date.now()}.png`;
    imagePath = path.join(tempDir, imageFileName);
    await fs.writeFile(imagePath, imageBuffer);
    
    const bucket = admin.storage().bucket();
    const storagePath = `learn-english-images/${imageFileName}`;
    
    await bucket.upload(imagePath, {
      destination: storagePath,
      metadata: {
        cacheControl: 'public, max-age=31536000',
        contentType: 'image/png'
      },
    });
    
    const file = bucket.file(storagePath);
    await file.makePublic();
    
    const encodedPath = encodeURIComponent(storagePath);
    const firebaseUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;
    
    console.log('✅ Image uploaded to Firebase Storage');
    
    if (imagePath) await fs.unlink(imagePath);
    
    res.json({
      success: true,
      imageUrl: firebaseUrl,
      message: 'Memphis style test image generated!'
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    if (imagePath) {
      try { await fs.unlink(imagePath); } catch (e) {}
    }
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 