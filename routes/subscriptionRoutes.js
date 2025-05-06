const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const subscriptionController = require('../controllers/subscriptionController');

// Cancel subscription
router.post('/cancel', auth, subscriptionController.cancelSubscription);

module.exports = router; 