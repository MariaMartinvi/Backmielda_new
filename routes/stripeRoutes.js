const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

// Importar controladores
const { 
  createCheckoutSession, 
  handleSuccess,
  handleWebhook,
  fixPremiumUser
} = require('../controllers/stripeController');

// Importar middlewares de webhook
const webhookAvailabilityCheck = require('../middleware/webhookAvailability');

// Ruta del webhook de Stripe
router.post('/webhook', 
  // Importante: parsear el body como raw
  bodyParser.raw({type: 'application/json'}),
  
  // Middleware de verificación de disponibilidad
  webhookAvailabilityCheck,
  
  // Manejador final del webhook
  handleWebhook
);

// Otras rutas de Stripe
router.post('/create-checkout-session', createCheckoutSession);
router.get('/success', handleSuccess);
router.post('/fix-premium-user', fixPremiumUser);

module.exports = router;