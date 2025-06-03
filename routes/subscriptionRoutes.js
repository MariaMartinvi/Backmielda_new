const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const subscriptionController = require('../controllers/subscriptionController');

// Debug logging
console.log('subscriptionController:', subscriptionController);
console.log('subscriptionController.cancelSubscription:', subscriptionController.cancelSubscription);
console.log('typeof subscriptionController.cancelSubscription:', typeof subscriptionController.cancelSubscription);

// Cancel subscription
router.post('/cancel', auth, subscriptionController.cancelSubscription);

module.exports = router; 