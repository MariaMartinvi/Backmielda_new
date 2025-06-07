// routes/storyRoutes.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const storyController = require('../controllers/storyController');

// Generate story
router.post('/generate', (req, res, next) => {
  console.log('📝 Story generation route hit:', req.body?.topic || 'No topic provided');
  console.log('👤 User email:', req.body?.email || 'No email provided');
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
  
  // Verificar que el usuario está autenticado
  if (!req.body?.email) {
    console.log('❌ No email provided in request');
    return res.status(401).json({ error: 'Unauthorized: No email provided' });
  }
  
  // Verificar que hay un token de autenticación
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('❌ No authorization header in request');
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  
  // Continuar con la generación de la historia
  storyController.generateStory(req, res, next);
});

// Generate audio for a story
router.post('/:storyId/audio', (req, res, next) => {
  storyController.generateAudio(req, res, next);
});

// Publish story
router.post('/:storyId/publish', storyController.publishStory);

// OpenAI API Health check
router.get('/health', storyController.healthCheck);

// Get remaining stories count for current user
router.get('/remaining', auth, async (req, res) => {
  try {
    const user = req.user;
    
    // Check and reset monthly count if needed
    user.checkAndResetMonthlyCount();
    
    // Calculate remaining stories
    let storiesRemaining = 0;
    
    if (user.subscriptionStatus === 'active') {
      storiesRemaining = Math.max(0, 30 - user.monthlyStoriesGenerated);
    } else {
      storiesRemaining = Math.max(0, 3 - user.storiesGenerated);
    }
    
    res.json({
      storiesRemaining,
      totalAllowed: user.subscriptionStatus === 'active' ? 30 : 3,
      used: user.subscriptionStatus === 'active' ? user.monthlyStoriesGenerated : user.storiesGenerated
    });
  } catch (error) {
    console.error('Error getting remaining stories:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user's stories (authenticated route)
router.get('/my-stories', (req, res, next) => {
  console.log('🔍 [MY-STORIES] Route hit - Debug info:');
  console.log('Authorization header:', req.headers.authorization ? req.headers.authorization.substring(0, 20) + '...' : 'None');
  console.log('Request method:', req.method);
  console.log('Request path:', req.path);
  
  // Call auth middleware
  auth(req, res, next);
}, storyController.getMyStories);

// Get stories for a specific user (admin or owner only)
router.get('/user/:userId', auth, storyController.getUserStories);

// Get top rated stories
router.get('/top-rated', storyController.getTopRatedStories);

// Rate a story (authenticated route)
router.post('/:storyId/rate', auth, storyController.rateStory);

// Get story ratings
router.get('/:storyId/ratings', storyController.getStoryRatings);

// Get story by ID
router.get('/:id', storyController.getStoryById);

module.exports = router; 