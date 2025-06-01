const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'http://localhost:5001',
  'http://10.0.2.2:5001',  // Emulador de Android
  'https://www.audiogretel.com',
  'https://audiogretel.com',
  'http://10.0.2.2'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir solicitudes sin origen (como las de Postman o el emulador)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Origin not allowed:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

module.exports = corsOptions; 