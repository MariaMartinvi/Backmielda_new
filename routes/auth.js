const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');

// Ruta de prueba
router.get('/test', (req, res) => {
  res.json({ message: 'Google auth routes are working' });
});

// Ruta para iniciar el proceso de autenticación con Google
router.get('/google',
  (req, res, next) => {
    const redirectUri = req.query.redirect_uri;
    if (redirectUri) {
      req.session.redirectUri = redirectUri;
    }
    next();
  },
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

// Ruta de callback después de la autenticación con Google
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/login',
    failureMessage: true
  }),
  (req, res) => {
    try {
      // Generar token JWT
      const token = jwt.sign(
        { 
          id: req.user._id,
          email: req.user.email,
          isPremium: req.user.isPremium,
          subscriptionStatus: req.user.subscriptionStatus
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Usar la URL de redirección guardada en la sesión o la URL por defecto
      const frontendUrl = req.session.redirectUri || (process.env.NODE_ENV === 'production'
        ? 'https://micuentacuentos.com'
        : process.env.FRONTEND_URL || 'http://localhost:3000');
      
      // Limpiar la URL de redirección de la sesión
      delete req.session.redirectUri;
      
      res.redirect(`${frontendUrl}/auth/google/callback?token=${token}`);
    } catch (error) {
      console.error('Error in Google callback:', error);
      const frontendUrl = req.session.redirectUri || (process.env.NODE_ENV === 'production'
        ? 'https://micuentacuentos.com'
        : process.env.FRONTEND_URL || 'http://localhost:3000');
      res.redirect(`${frontendUrl}/login?error=auth_failed`);
    }
  }
);

// Ruta para obtener el usuario actual
router.get('/current-user', (req, res) => {
  if (req.user) {
    res.json({
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
      isPremium: req.user.isPremium,
      subscriptionStatus: req.user.subscriptionStatus
    });
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

// Ruta para cerrar sesión
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error during logout' });
    }
    res.redirect('/');
  });
});

module.exports = router; 