// routes/storyRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const storyController = require('../controllers/storyController');

// Generate story
router.post('/generate', storyController.generateStory);

// Generate audio for a story
router.post('/:storyId/audio', storyController.generateAudio);

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

// Get story by ID
router.get('/:id', storyController.getStoryById);

module.exports = router;