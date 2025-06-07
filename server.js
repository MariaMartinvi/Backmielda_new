// Load environment variables first
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo');

// Load environment variables
const envPath = path.resolve(__dirname, '.env');
console.log('Loading environment variables from:', envPath);

// Only try to load .env file if it exists (development environment)
if (fs.existsSync(envPath)) {
  console.log('.env file found, loading from file');
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.error('Error loading .env file:', result.error);
    process.exit(1);
  }
} else {
  console.log('No .env file found, using environment variables from system');
}

// Log environment variables (without sensitive data)
console.log('Environment Variables Check:');
console.log('STRIPE_SECRET_KEY length:', process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.length : 'NOT SET');
console.log('STRIPE_SECRET_KEY prefix:', process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 7) : 'NOT SET');
console.log('STRIPE_PRICE_ID:', process.env.STRIPE_PRICE_ID || 'NOT SET');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'NOT SET');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'NOT SET');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'NOT SET');
console.log('GOOGLE_TTS_API_KEY:', process.env.GOOGLE_TTS_API_KEY ? `Set (${process.env.GOOGLE_TTS_API_KEY.substring(0, 10)}...)` : 'NOT SET');

if (process.env.OPENAI_API_KEY) {
console.log('OpenAI API Key: Configurada (primeros caracteres: ' + process.env.OPENAI_API_KEY.substring(0, 5) + '...)');
} else {
console.log('OpenAI API Key: No configurada');
}

// Initialize Firebase Admin
console.log('🔥 Initializing Firebase Admin...');
require('./config/firebase');

// Only after environment variables are loaded, require other modules
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('./config/passport');
const storyRoutes = require('./routes/storyRoutes');
const authRoutes = require('./routes/authRoutes');
const googleAuthRoutes = require('./routes/auth');
const stripeRoutes = require('./routes/stripeRoutes');
const audioRoutes = require('./routes/audioRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');
const ratingsRoutes = require('./routes/ratingsRoutes');

// Create Express app
const app = express();

// Middleware para logging de todas las solicitudes
app.use((req, res, next) => {
  console.log('🔍 Incoming request:', {
    method: req.method,
    path: req.path,
    origin: req.headers.origin,
    referer: req.headers.referer,
    userAgent: req.headers['user-agent']
  });
  next();
});

// Middleware
app.use((req, res, next) => {
  if (req.originalUrl === '/api/stripe/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});
app.use(express.urlencoded({ extended: true }));

// Configuración de sesión
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 24 * 60 * 60 // 1 day
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5001',
  'https://www.audiogretel.com',
  'https://audiogretel.com'
];

console.log('Allowed origins:', allowedOrigins);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) {
      console.log('ℹ️ Request with no origin header');
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ Allowed origin:', origin);
      callback(null, true);
    } else {
      console.log('❌ Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" },
  frameguard: false // Desactiva X-Frame-Options para permitir WebView
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // Más permisivo en desarrollo
  message: {
    error: 'Too many requests',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Aplicar rate limiter solo a rutas específicas
app.use('/api/stories/generate', limiter);
app.use('/api/auth', limiter);
app.use('/api/stripe', limiter);

// Test route that will help confirm the server is working
app.get('/test', (req, res) => {
  res.status(200).json({ message: 'Server is running!' });
});

// Test route to generate a sample audio file for mixing tests
app.get('/generate-test-audio', async (req, res) => {
  try {
    const googleTtsService = require('./utils/googleTtsService');
    const fs = require('fs').promises;
    const path = require('path');
    
    console.log('Generating test audio file...');
    
    // Generate a simple audio file with TTS
    const testText = 'This is a test audio file for background music mixing. The quick brown fox jumps over the lazy dog.';
    const audioData = await googleTtsService.synthesizeSpeech(testText, 'male', 1.0);
    
    // Save to file
    const testAudioPath = path.join(__dirname, 'test-audio.mp3');
    await fs.writeFile(testAudioPath, Buffer.from(audioData, 'base64'));
    
    console.log(`Test audio file generated at: ${testAudioPath}`);
    
    res.status(200).json({ 
      message: 'Test audio file generated successfully',
      path: testAudioPath
    });
  } catch (error) {
    console.error('Error generating test audio:', error);
    res.status(500).json({ error: 'Failed to generate test audio' });
  }
});

// Test route to mix audio with background music
app.get('/test-mix-audio', async (req, res) => {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    const { execSync } = require('child_process');
    const FFMPEG_PATHS = require('./config/ffmpeg');
    
    console.log('Testing direct audio mixing...');
    
    // Paths for the test
    const testAudioPath = path.join(__dirname, 'test-audio.mp3');
    const musicPath = path.join(__dirname, 'assets/background-music/relaxing-ambient.mp3');
    const outputPath = path.join(__dirname, 'test-mixed-output.mp3');
    
    // Check if test audio exists
    try {
      await fs.access(testAudioPath);
      console.log('Test audio file found:', testAudioPath);
    } catch (error) {
      res.status(404).json({ 
        error: 'Test audio file not found',
        message: 'Please generate a test audio file first by visiting /generate-test-audio'
      });
      return;
    }
    
    // Run ffmpeg command directly
    try {
      const ffmpegCommand = `"${FFMPEG_PATHS.ffmpeg}" -y -i "${testAudioPath}" -i "${musicPath}" -filter_complex "[1:a]volume=0.15,aloop=loop=-1:size=512k[m];[0:a][m]amix=inputs=2:dropout_transition=3" -ac 2 -c:a libmp3lame -b:a 192k "${outputPath}"`;
      
      console.log('Running FFmpeg command:', ffmpegCommand);
      execSync(ffmpegCommand);
      console.log('FFmpeg command completed successfully');
      
      // Return the mixed audio file
      const mixedAudio = await fs.readFile(outputPath);
      const mixedAudioBase64 = mixedAudio.toString('base64');
      
      res.status(200).json({
        message: 'Audio mixed successfully',
        mixedAudioUrl: `data:audio/mp3;base64,${mixedAudioBase64}`
      });
    } catch (error) {
      console.error('Error mixing audio:', error);
      res.status(500).json({ error: 'Failed to mix audio' });
    }
  } catch (error) {
    console.error('Error in test endpoint:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// Routes
console.log('Registering routes...');
app.use('/api/stories', storyRoutes);
console.log('Story routes registered');
app.use('/api/auth', authRoutes);
console.log('Auth routes registered');
app.use('/api/auth', googleAuthRoutes);
console.log('Google auth routes registered');
app.use('/api/stripe', stripeRoutes);
console.log('Stripe routes registered');
app.use('/api/audio', audioRoutes);
console.log('Audio routes registered');
app.use('/api/subscription', subscriptionRoutes);
console.log('Subscription routes registered');
app.use('/api/newsletter', newsletterRoutes);
console.log('Newsletter routes registered');
app.use('/api/ratings', ratingsRoutes);
console.log('Ratings routes registered');

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'ok',
      openai: process.env.OPENAI_API_KEY ? 'ok' : 'not_configured'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Log routes after they're all registered
console.log('All routes registered. Listing routes:');
// List registered routes AFTER they've been added
const listRoutes = () => {
  const routes = [];
  
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Routes registered directly on the app
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      // Router middleware
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const basePath = middleware.regexp.toString().split('?')[1].slice(0, -3);
          routes.push({
            path: basePath + handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  
  return routes;
};

console.log('Routes:', JSON.stringify(listRoutes(), null, 2));

// Catch-all route for debugging
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not Found', 
    message: `Route ${req.originalUrl} not found`,
    method: req.method
  });
});

// Debug middleware para ver todas las rutas registradas
app._router.stack.forEach(function(r){
    if (r.route && r.route.path){
        console.log('Route:', r.route.stack[0].method.toUpperCase(), r.route.path);
    }
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Available routes:');
  app._router.stack.forEach(function(r){
    if (r.route && r.route.path){
      console.log(`${r.route.stack[0].method.toUpperCase()} ${r.route.path}`);
    }
  });
});