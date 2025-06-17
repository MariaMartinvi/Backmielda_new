// server-simple.js - Minimal server for diagnostics
const express = require('express');
const cors = require('cors');

const app = express();

// Trust proxy for Render
app.set('trust proxy', true);

// Basic middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'https://www.audiogretel.com', 'https://audiogretel.com'],
  credentials: true
}));

// Simple health checks that respond immediately
app.get('/health', (req, res) => {
  console.log('Health check hit');
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Simple Diagnostic Server',
    version: '1.0.0'
  });
});

app.get('/api/health', (req, res) => {
  console.log('API health check hit');
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Simple Diagnostic Server API',
    version: '1.0.0'
  });
});

app.get('/api/stories/health', (req, res) => {
  console.log('Stories health check hit');
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Simple Stories Health Check',
    version: '1.0.0'
  });
});

// Test route
app.get('/test', (req, res) => {
  console.log('Test route hit');
  res.json({ message: 'Simple server is working!' });
});

// Catch all
app.use('*', (req, res) => {
  console.log(`404 for ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Not Found', 
    message: `Route ${req.originalUrl} not found in simple server`,
    method: req.method
  });
});

// Start server
const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () => {
  console.log(`Simple diagnostic server running on port ${PORT}`);
  console.log('Available routes:');
  console.log('GET /health');
  console.log('GET /api/health');
  console.log('GET /api/stories/health');
  console.log('GET /test');
});

// Basic timeouts
server.timeout = 30000; // 30 seconds
server.keepAliveTimeout = 35000;
server.headersTimeout = 40000;

console.log('✅ Simple server started successfully'); 