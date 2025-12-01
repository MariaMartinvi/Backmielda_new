// Load environment variables FIRST (before anything else)
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables IMMEDIATELY
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

// NOW import Firebase (after .env is loaded)
const { admin, db } = require('./config/firebase'); // Use Firebase instead of MongoDB

// Log environment variables (without sensitive data)
console.log('Environment Variables Check:');
console.log('STRIPE_SECRET_KEY length:', process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.length : 'NOT SET');
console.log('STRIPE_SECRET_KEY prefix:', process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 7) : 'NOT SET');
console.log('STRIPE_PRICE_ID:', process.env.STRIPE_PRICE_ID || 'NOT SET');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'NOT SET');
// MongoDB removed - using Firebase/Firestore only
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'NOT SET');
console.log('GOOGLE_TTS_API_KEY:', process.env.GOOGLE_TTS_API_KEY ? `Set (${process.env.GOOGLE_TTS_API_KEY.substring(0, 10)}...)` : 'NOT SET');

if (process.env.OPENAI_API_KEY) {
console.log('OpenAI API Key: Configurada (primeros caracteres: ' + process.env.OPENAI_API_KEY.substring(0, 5) + '...)');
} else {
console.log('OpenAI API Key: No configurada');
}

// Initialize Firebase Admin asynchronously (don't block server startup)
console.log('🔥 Starting Firebase Admin initialization...');
setImmediate(async () => {
  try {
    require('./config/firebase');
    console.log('✅ Firebase Admin initialization complete');
  } catch (error) {
    console.error('❌ Critical Firebase initialization error:', error);
    console.error('This will cause authentication failures');
    
    // Log environment variables for debugging
    console.error('🔍 Firebase Environment Variables Debug:');
    console.error('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID || 'NOT SET');
    console.error('GOOGLE_PROJECT_ID:', process.env.GOOGLE_PROJECT_ID || 'NOT SET');
    console.error('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'NOT SET');
    console.error('FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? 'SET' : 'NOT SET');
    console.error('GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS || 'NOT SET');
    
    // Don't exit the process, but warn about limited functionality
    console.error('⚠️ Server will continue but authentication may not work properly');
  }
});

// Only after environment variables are loaded, require other modules
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const storyRoutes = require('./routes/storyRoutes');
// const authRoutes = require('./routes/authRoutes'); // Firebase Auth handled in frontend
const stripeRoutes = require('./routes/stripeRoutes'); // Updated for Firebase
// const subscriptionRoutes = require('./routes/subscriptionRoutes'); // Needs Firebase update
// const newsletterRoutes = require('./routes/newsletterRoutes'); // Needs Firebase update
// const ratingsRoutes = require('./routes/ratingsRoutes'); // Needs Firebase update
const audioRoutes = require('./routes/audioRoutes');
const learnEnglishRoutes = require('./routes/learnEnglishRoutes'); // Learn English with audio stories

// Create Express app
const app = express();

// Configurar trust proxy para Render
if (process.env.NODE_ENV === 'production') {
  console.log('🌐 Production mode: configuring trust proxy for Render');
  app.set('trust proxy', true);
} else {
  console.log('🔧 Development mode: trust proxy disabled');
  app.set('trust proxy', false);
}

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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Firebase is configured in ./config/firebase and imported at the top
console.log('🔥 Using Firebase/Firestore instead of MongoDB');

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Define allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'https://www.audiogretel.com',
      'https://audiogretel.com'
    ];
    
    // Allow requests with no origin (like mobile apps, curl requests, or local files)
    if (!origin || origin === 'null') return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  // Permitimos también Cache-Control para evitar errores CORS en peticiones con caché explícita
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control'],
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));

// Security middleware - optimizado para Firebase Auth
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "https://apis.google.com", "https://js.stripe.com"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://identitytoolkit.googleapis.com"],
      frameSrc: ["https://js.stripe.com", "https://hooks.stripe.com"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  } : false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  crossOriginEmbedderPolicy: false,
  frameguard: { action: 'deny' }
}));

// Middleware adicional para manejar COOP específicamente para Firebase Auth
app.use((req, res, next) => {
  // Permitir popups para autenticación de Firebase
  res.header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  
  // Headers adicionales para Firebase
  if (req.path.includes('/auth') || req.path.includes('/api/auth')) {
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Private-Network', 'true');
  }
  
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use(limiter);

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
    console.error('Error in test-mix-audio:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Debug endpoint to check FFmpeg status and reset cache
app.get('/debug-ffmpeg', async (req, res) => {
  try {
    const { checkFFmpegAvailability, resetFFmpegCache } = require('./utils/audioMixer');
    const FFMPEG_PATHS = require('./config/ffmpeg');
    
    console.log('🔍 DEBUG: FFmpeg status check requested');
    
    // Reset cache to force fresh check
    resetFFmpegCache();
    
    // Check FFmpeg availability
    const isAvailable = await checkFFmpegAvailability();
    
    // Additional system info
    const systemInfo = {
      platform: process.platform,
      nodeEnv: process.env.NODE_ENV,
      ffmpegPath: FFMPEG_PATHS.ffmpeg,
      ffprobePath: FFMPEG_PATHS.ffprobe
    };
    
    console.log('📊 System info:', systemInfo);
    
    res.json({
      ffmpegAvailable: isAvailable,
      systemInfo: systemInfo,
      message: isAvailable ? 'FFmpeg is working correctly' : 'FFmpeg is not available',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in debug-ffmpeg:', error);
    res.status(500).json({ 
      error: 'Error checking FFmpeg status',
      details: error.message
    });
  }
});

// Routes
console.log('Registering routes...');
app.use('/api/stories', storyRoutes);
console.log('Story routes registered');

// Auth routes - Firebase Auth is handled in the frontend, no backend routes needed
// app.use('/api/auth', authRoutes);
// console.log('Auth routes registered');

app.use('/api/stripe', stripeRoutes);
console.log('Stripe routes registered');

app.use('/api/audio', audioRoutes);
console.log('Audio routes registered');

app.use('/api/learn-english', learnEnglishRoutes);
console.log('Learn English routes registered');

// Subscription routes - need to be updated for Firebase  
// app.use('/api/subscription', subscriptionRoutes);
// console.log('Subscription routes registered');

// Newsletter routes - need to be updated for Firebase
// app.use('/api/newsletter', newsletterRoutes);
// console.log('Newsletter routes registered');

// Ratings routes - should work with story service
// app.use('/api/ratings', ratingsRoutes);
// console.log('Ratings routes registered');

// TEST: Transform image to Memphis style using image-to-image (NO AUTH - for testing only)
app.post('/api/transform-to-memphis', express.json({ limit: '10mb' }), async (req, res) => {
  const axios = require('axios');
  const { admin } = require('./config/firebase');
  const fs = require('fs').promises;
  const path = require('path');
  const os = require('os');
  
  const tempDir = os.tmpdir();
  let imagePath;
  
  try {
    console.log('🎨 Transforming image to Memphis style...');
    
    const { imageUrl, characterName, scene, description } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'imageUrl is required' });
    }
    
    // Usar Fal.ai con image-to-image
    const prompt = `Transform this character portrait into Memphis Espacial Nocturno style: geometric shapes, vibrant electric blue, hot pink, yellow, and deep purples. 
Night space theme with stars and planets. 
KEEP THE SAME CHARACTER: ${description || 'young person'}. Maintain exact facial features, hair style and color, skin tone, age, and overall appearance from the reference image.
Scene: ${scene || 'portrait with space elements'}. 
IMPORTANT: NO TEXT OR WORDS in the image - only visual elements.`;
    
    console.log('🚀 Calling Fal.ai img2img API...');
    
    const response = await axios.post('https://fal.run/fal-ai/fast-sdxl', {
      prompt: prompt,
      image_url: imageUrl,
      strength: 0.4, // 0.4 = mantiene MÁS el original (cara, rasgos), solo cambia estilo
      image_size: "square_hd",
      num_inference_steps: 35,
      guidance_scale: 8.0, // Más alto = sigue mejor el prompt
      num_images: 1,
      enable_safety_checker: true,
      sync_mode: true
    }, {
      headers: {
        'Authorization': `Key ${process.env.FAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });
    
    console.log('✅ Image transformed, downloading...');
    
    let imageBuffer;
    const generatedUrl = response.data.images[0].url;
    
    if (generatedUrl.startsWith('data:')) {
      const base64Data = generatedUrl.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      const imageResponse = await fetch(generatedUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download: ${imageResponse.status}`);
      }
      const arrayBuffer = await imageResponse.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    }
    
    console.log('✅ Downloaded, uploading to Firebase...');
    
    const imageFileName = `${characterName || 'character'}-memphis-${Date.now()}.png`;
    imagePath = path.join(tempDir, imageFileName);
    await fs.writeFile(imagePath, imageBuffer);
    
    const bucket = admin.storage().bucket();
    const storagePath = `learn-english-images/${imageFileName}`;
    
    await bucket.upload(imagePath, {
      destination: storagePath,
      metadata: {
        cacheControl: 'public, max-age=31536000',
        contentType: 'image/png'
      },
    });
    
    const file = bucket.file(storagePath);
    await file.makePublic();
    
    const encodedPath = encodeURIComponent(storagePath);
    const firebaseUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;
    
    console.log('✅ Uploaded to Firebase Storage');
    
    if (imagePath) await fs.unlink(imagePath);
    
    res.json({
      success: true,
      imageUrl: firebaseUrl,
      message: `${characterName} transformed to Memphis style!`
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    if (imagePath) {
      try { await fs.unlink(imagePath); } catch (e) {}
    }
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check route (simple, no auth required)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'AudioGretel Story Generator Backend',
    version: '2.0.0-firebase'
  });
});

// Additional health check route at /api/health for frontend compatibility
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'AudioGretel Story Generator Backend',
    version: '2.0.0-firebase'
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
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Available routes:');
  app._router.stack.forEach(function(r){
    if (r.route && r.route.path){
      console.log(`${r.route.stack[0].method.toUpperCase()} ${r.route.path}`);
    }
  });
});

// Configurar timeouts del servidor para audios largos
server.timeout = 600000; // 10 minutos
server.keepAliveTimeout = 650000; // 10 minutos + 50 segundos  
server.headersTimeout = 660000; // 11 minutos

console.log('⏱️ Server timeouts configured for long audio files:');
console.log('- Server timeout:', server.timeout, 'ms');
console.log('- Keep-alive timeout:', server.keepAliveTimeout, 'ms');
console.log('- Headers timeout:', server.headersTimeout, 'ms');