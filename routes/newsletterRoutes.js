const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');

// Debug middleware para las rutas de newsletter
router.use((req, res, next) => {
  console.log('Newsletter Route:', req.method, req.path);
  next();
});

// Ruta para suscribirse a la newsletter
router.post('/subscribe', (req, res, next) => {
  console.log('Subscribe request received:', req.body);
  newsletterController.subscribe(req, res, next);
});

// Ruta para cancelar la suscripción
router.post('/unsubscribe', (req, res, next) => {
  console.log('Unsubscribe request received:', req.body);
  newsletterController.unsubscribe(req, res, next);
});

module.exports = router; 