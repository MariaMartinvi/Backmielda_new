// routes/learnEnglishRoutes.js
const express = require('express');
const router = express.Router();
const learnEnglishController = require('../controllers/learnEnglishController');

// Get all image URLs
router.get('/image-urls', learnEnglishController.getAllImageUrls);

// Get story with audio
router.get('/stories/:storyId', learnEnglishController.getStory);

// Endpoint temporal para limpiar archivos corruptos
router.delete('/clear-corrupted-audio', learnEnglishController.clearCorruptedAudio);

module.exports = router;

