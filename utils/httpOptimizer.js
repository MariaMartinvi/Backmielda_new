const https = require('https');

// 🚀 AGENTE HTTP OPTIMIZADO PARA GOOGLE TTS
const optimizedAgent = new https.Agent({
  keepAlive: true,              // Reutilizar conexiones
  keepAliveMsecs: 30000,        // 30 segundos keep-alive
  maxSockets: 10,               // Máximo 10 sockets simultáneos
  maxFreeSockets: 5,            // Mantener 5 sockets libres
  timeout: 30000,               // 30s timeout
  family: 4                     // IPv4 para consistencia
});

// Pool de conexiones reutilizables
class ConnectionPool {
  constructor() {
    this.connections = new Map();
    this.stats = {
      reused: 0,
      created: 0,
      total: 0
    };
  }
  
  getAgent() {
    this.stats.total++;
    return optimizedAgent;
  }
  
  getStats() {
    return {
      ...this.stats,
      reuseRate: this.stats.total > 0 ? Math.round((this.stats.reused / this.stats.total) * 100) : 0
    };
  }
}

const connectionPool = new ConnectionPool();

module.exports = {
  getOptimizedAgent: () => connectionPool.getAgent(),
  getConnectionStats: () => connectionPool.getStats(),
  resetStats: () => {
    connectionPool.stats = { reused: 0, created: 0, total: 0 };
  }
}; 