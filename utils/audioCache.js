const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

// 🚀 SISTEMA DE CACHÉ INTELIGENTE PARA AUDIO
class AudioCache {
  constructor() {
    this.cacheDir = path.join(__dirname, '../temp/audio-cache');
    this.maxCacheSize = 100; // Máximo 100 archivos en caché
    this.maxCacheAge = 24 * 60 * 60 * 1000; // 24 horas en ms
    
    // Inicializar directorio de caché
    this.initCache();
  }
  
  async initCache() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      console.log('📁 Directorio de caché de audio inicializado:', this.cacheDir);
      
      // Limpiar caché al iniciar
      await this.cleanOldCache();
    } catch (error) {
      console.error('❌ Error inicializando caché de audio:', error.message);
    }
  }
  
  // Generar clave única para el contenido de audio
  generateCacheKey(text, voiceId, speed, useIntelligentPauses, title) {
    const content = JSON.stringify({
      text: text.trim(),
      voiceId,
      speed,
      useIntelligentPauses,
      title: title || ''
    });
    
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }
  
  // Verificar si existe en caché
  async exists(cacheKey) {
    try {
      const cacheFile = path.join(this.cacheDir, `${cacheKey}.mp3`);
      const metaFile = path.join(this.cacheDir, `${cacheKey}.meta.json`);
      
      // Verificar que ambos archivos existen
      await fs.access(cacheFile);
      await fs.access(metaFile);
      
      // Verificar que no ha expirado
      const meta = JSON.parse(await fs.readFile(metaFile, 'utf8'));
      const age = Date.now() - meta.timestamp;
      
      if (age > this.maxCacheAge) {
        console.log(`🗑️ Caché expirado para ${cacheKey} (${Math.round(age/1000/60/60)}h)`);
        await this.delete(cacheKey);
        return false;
      }
      
      console.log(`✅ Audio encontrado en caché: ${cacheKey} (${Math.round(age/1000/60)}min de antigüedad)`);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  // Obtener audio del caché
  async get(cacheKey) {
    try {
      const cacheFile = path.join(this.cacheDir, `${cacheKey}.mp3`);
      const audioBuffer = await fs.readFile(cacheFile);
      
      console.log(`⚡ Audio recuperado del caché: ${audioBuffer.length} bytes`);
      return audioBuffer.toString('base64');
    } catch (error) {
      console.error(`❌ Error recuperando del caché ${cacheKey}:`, error.message);
      throw error;
    }
  }
  
  // Guardar audio en caché
  async set(cacheKey, audioBase64, metadata = {}) {
    try {
      const cacheFile = path.join(this.cacheDir, `${cacheKey}.mp3`);
      const metaFile = path.join(this.cacheDir, `${cacheKey}.meta.json`);
      
      // Convertir base64 a buffer y guardar
      const audioBuffer = Buffer.from(audioBase64, 'base64');
      await fs.writeFile(cacheFile, audioBuffer);
      
      // Guardar metadatos
      const meta = {
        timestamp: Date.now(),
        size: audioBuffer.length,
        ...metadata
      };
      await fs.writeFile(metaFile, JSON.stringify(meta, null, 2));
      
      console.log(`💾 Audio guardado en caché: ${cacheKey} (${audioBuffer.length} bytes)`);
      
      // Limpiar caché si está lleno
      await this.maintainCacheSize();
    } catch (error) {
      console.error(`❌ Error guardando en caché ${cacheKey}:`, error.message);
    }
  }
  
  // Eliminar entrada del caché
  async delete(cacheKey) {
    try {
      const cacheFile = path.join(this.cacheDir, `${cacheKey}.mp3`);
      const metaFile = path.join(this.cacheDir, `${cacheKey}.meta.json`);
      
      await fs.unlink(cacheFile).catch(() => {});
      await fs.unlink(metaFile).catch(() => {});
      
      console.log(`🗑️ Entrada eliminada del caché: ${cacheKey}`);
    } catch (error) {
      console.warn(`⚠️ Error eliminando del caché ${cacheKey}:`, error.message);
    }
  }
  
  // Limpiar caché antiguo
  async cleanOldCache() {
    try {
      const files = await fs.readdir(this.cacheDir);
      const metaFiles = files.filter(f => f.endsWith('.meta.json'));
      
      let cleaned = 0;
      for (const metaFile of metaFiles) {
        try {
          const metaPath = path.join(this.cacheDir, metaFile);
          const meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
          const age = Date.now() - meta.timestamp;
          
          if (age > this.maxCacheAge) {
            const cacheKey = metaFile.replace('.meta.json', '');
            await this.delete(cacheKey);
            cleaned++;
          }
        } catch (error) {
          // Archivo meta corrupto, eliminar
          const cacheKey = metaFile.replace('.meta.json', '');
          await this.delete(cacheKey);
          cleaned++;
        }
      }
      
      if (cleaned > 0) {
        console.log(`🧹 Limpieza de caché: ${cleaned} archivos antiguos eliminados`);
      }
    } catch (error) {
      console.warn('⚠️ Error limpiando caché:', error.message);
    }
  }
  
  // Mantener tamaño del caché
  async maintainCacheSize() {
    try {
      const files = await fs.readdir(this.cacheDir);
      const metaFiles = files.filter(f => f.endsWith('.meta.json'));
      
      if (metaFiles.length <= this.maxCacheSize) {
        return; // No necesita limpieza
      }
      
      // Ordenar por antigüedad y eliminar los más antiguos
      const filesWithAge = [];
      for (const metaFile of metaFiles) {
        try {
          const metaPath = path.join(this.cacheDir, metaFile);
          const meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
          filesWithAge.push({
            cacheKey: metaFile.replace('.meta.json', ''),
            timestamp: meta.timestamp
          });
        } catch (error) {
          // Archivo corrupto, marcar para eliminación
          filesWithAge.push({
            cacheKey: metaFile.replace('.meta.json', ''),
            timestamp: 0
          });
        }
      }
      
      // Ordenar por timestamp (más antiguos primero)
      filesWithAge.sort((a, b) => a.timestamp - b.timestamp);
      
      // Eliminar los más antiguos
      const toDelete = filesWithAge.length - this.maxCacheSize;
      for (let i = 0; i < toDelete; i++) {
        await this.delete(filesWithAge[i].cacheKey);
      }
      
      console.log(`🧹 Mantenimiento de caché: ${toDelete} archivos eliminados (límite: ${this.maxCacheSize})`);
    } catch (error) {
      console.warn('⚠️ Error manteniendo caché:', error.message);
    }
  }
  
  // Obtener estadísticas del caché
  async getStats() {
    try {
      const files = await fs.readdir(this.cacheDir);
      const metaFiles = files.filter(f => f.endsWith('.meta.json'));
      
      let totalSize = 0;
      let oldestTimestamp = Date.now();
      let newestTimestamp = 0;
      
      for (const metaFile of metaFiles) {
        try {
          const metaPath = path.join(this.cacheDir, metaFile);
          const meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
          
          totalSize += meta.size || 0;
          oldestTimestamp = Math.min(oldestTimestamp, meta.timestamp);
          newestTimestamp = Math.max(newestTimestamp, meta.timestamp);
        } catch (error) {
          // Ignorar archivos corruptos
        }
      }
      
      return {
        entries: metaFiles.length,
        totalSizeMB: Math.round(totalSize / 1024 / 1024 * 100) / 100,
        oldestAge: oldestTimestamp === Date.now() ? 0 : Math.round((Date.now() - oldestTimestamp) / 1000 / 60),
        newestAge: newestTimestamp === 0 ? 0 : Math.round((Date.now() - newestTimestamp) / 1000 / 60)
      };
    } catch (error) {
      return { entries: 0, totalSizeMB: 0, oldestAge: 0, newestAge: 0 };
    }
  }
}

// Instancia global del caché
const audioCache = new AudioCache();

module.exports = { audioCache }; 