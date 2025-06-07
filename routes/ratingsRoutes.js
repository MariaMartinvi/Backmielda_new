const express = require('express');
const router = express.Router();
const { auth, optionalAuth } = require('../middleware/auth');
const {
  rateStory,
  getStoryRatings,
  getTopRatedStories
} = require('../controllers/ratingsController');

// Rate a story (requires authentication)
router.post('/:storyId/rate', auth, rateStory);

// Get story ratings (optional authentication for user's rating)
router.get('/:storyId/ratings', optionalAuth, getStoryRatings);

// Get top rated stories (public)
router.get('/top-rated', getTopRatedStories);

module.exports = router; 