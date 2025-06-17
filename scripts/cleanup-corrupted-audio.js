#!/usr/bin/env node

/**
 * 🧹 SCRIPT DE LIMPIEZA DE AUDIOS CORRUPTOS
 * 
 * Este script busca y elimina:
 * - Audios corruptos/cortados
 * - Imágenes asociadas 
 * - Texto/contenido corrupto
 * - Entradas completas en la base de datos
 * 
 * Uso: node scripts/cleanup-corrupted-audio.js [--dry-run] [--force] [--after-date YYYY-MM-DD]
 */

const { db } = require('../config/firebase');
const admin = require('firebase-admin');

// Obtener el bucket directamente
function getFirebaseStorageBucket() {
  return admin.storage().bucket();
}

class AudioCleanupTool {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.force = options.force || false;
    this.afterDate = options.afterDate || null; // Nueva opción para filtrar por fecha
    this.stats = {
      totalStories: 0,
      storiesWithAudio: 0,
      corruptedAudio: 0,
      cleaned: 0,
      errors: 0,
      skippedByDate: 0
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = this.dryRun ? '[DRY-RUN] ' : '';
    
    switch (type) {
      case 'error':
        console.error(`🚨 ${prefix}[${timestamp}] ${message}`);
        break;
      case 'warning':
        console.warn(`⚠️  ${prefix}[${timestamp}] ${message}`);
        break;
      case 'success':
        console.log(`✅ ${prefix}[${timestamp}] ${message}`);
        break;
      default:
        console.log(`ℹ️  ${prefix}[${timestamp}] ${message}`);
    }
  }

  async isAudioCorrupted(audioData, audioPath, storyId) {
    try {
      // Verificar si hay datos de audio
      if (!audioData && !audioPath) {
        return { corrupted: false, reason: 'No audio data' };
      }

      // Si es base64, verificar tamaño y validez
      if (audioData) {
        // Verificar si es base64 válido
        if (typeof audioData !== 'string' || audioData.length === 0) {
          return { corrupted: true, reason: 'Empty or invalid base64 data' };
        }

        // Verificar si el base64 es válido
        try {
          const buffer = Buffer.from(audioData, 'base64');
          
          // Audio muy pequeño probablemente está corrupto (menos de 1KB)
          if (buffer.length < 1024) {
            return { corrupted: true, reason: `Audio too small: ${buffer.length} bytes` };
          }

          // Verificar cabeceras MP3 básicas
          const firstBytes = buffer.slice(0, 4);
          const hexString = firstBytes.toString('hex').toUpperCase();
          
          // Verificar si tiene cabeceras MP3 válidas
          if (!hexString.startsWith('FF') && !hexString.includes('494433')) { // FF = MP3 sync, ID3 = ID3 tag
            return { corrupted: true, reason: `Invalid MP3 header: ${hexString}` };
          }

          return { corrupted: false, reason: 'Valid base64 audio' };
        } catch (error) {
          return { corrupted: true, reason: `Base64 decode error: ${error.message}` };
        }
      }

      // Si es un path a Firebase Storage, verificar si el archivo existe
      if (audioPath) {
        try {
          const bucket = getFirebaseStorageBucket();
          const cleanPath = audioPath.replace('https://storage.googleapis.com/' + bucket.name + '/', '');
          const file = bucket.file(cleanPath);
          
          const [exists] = await file.exists();
          if (!exists) {
            return { corrupted: true, reason: 'Audio file not found in storage' };
          }

          // Verificar metadatos del archivo
          const [metadata] = await file.getMetadata();
          const fileSize = parseInt(metadata.size);
          const createdDate = new Date(metadata.timeCreated);
          
          if (fileSize < 1024) {
            return { corrupted: true, reason: `Storage file too small: ${fileSize} bytes`, createdDate };
          }

          // Si hay filtro de fecha, verificar si el archivo es demasiado antiguo
          if (this.afterDate && createdDate < this.afterDate) {
            return { corrupted: false, reason: `Audio too old (created: ${createdDate.toISOString()})`, skippedByDate: true };
          }

          // Análisis avanzado para archivos grandes - descargar y verificar estructura
          if (fileSize > 100000) { // Solo para archivos > 100KB
            try {
              const [buffer] = await file.download();
              
              // Verificar marcos MP3
              let frameCount = 0;
              let lastFramePos = -1;
              
              for (let i = 0; i < buffer.length - 1; i++) {
                if ((buffer[i] === 0xFF && (buffer[i + 1] & 0xE0) === 0xE0)) {
                  frameCount++;
                  lastFramePos = i;
                }
              }

              // Verificar si el archivo termina abruptamente
              const distanceFromEnd = buffer.length - lastFramePos;
              
              if (frameCount < 10) {
                return { corrupted: true, reason: `Too few MP3 frames: ${frameCount}` };
              }

              if (distanceFromEnd > 1000) {
                return { corrupted: true, reason: `Audio possibly truncated - last frame ${distanceFromEnd} bytes from end` };
              }

              // Verificar últimos bytes para detectar terminación abrupta
              const lastBytes = buffer.slice(-50);
              const hasTrailingZeros = lastBytes.slice(-10).every(byte => byte === 0);
              
              // Umbral más estricto: si no hay silencio al final Y está muy cerca del final
              if (!hasTrailingZeros && distanceFromEnd < 50) {
                return { corrupted: true, reason: `Audio ends abruptly - last frame only ${distanceFromEnd} bytes from end, no trailing silence` };
              }
              
              // También verificar si termina de forma no natural (último byte no es silencio)
              if (distanceFromEnd < 20 && buffer[buffer.length - 1] !== 0) {
                return { corrupted: true, reason: 'Audio file ends abruptly without proper closure' };
              }
              
            } catch (downloadError) {
              this.log(`⚠️ No se pudo descargar para análisis avanzado: ${downloadError.message}`, 'warn');
            }
          }

          return { corrupted: false, reason: 'Valid storage file' };
        } catch (error) {
          return { corrupted: true, reason: `Storage verification error: ${error.message}` };
        }
      }

      return { corrupted: false, reason: 'No audio to check' };
    } catch (error) {
      this.log(`Error verificando audio de historia ${storyId}: ${error.message}`, 'error');
      return { corrupted: true, reason: `Verification error: ${error.message}` };
    }
  }

  async cleanupStoryAssets(storyData) {
    try {
      const bucket = getFirebaseStorageBucket();

      // 1. Limpiar audio temporal
      if (storyData.tempAudioPath) {
        try {
          const cleanPath = storyData.tempAudioPath.replace('https://storage.googleapis.com/' + bucket.name + '/', '');
          const file = bucket.file(cleanPath);
          const [exists] = await file.exists();
          if (exists) {
            if (!this.dryRun) {
              await file.delete();
            }
            this.log(`🗑️ Audio temporal: ${cleanPath}`, 'success');
          }
        } catch (error) {
          this.log(`Error eliminando audio temporal: ${error.message}`, 'error');
        }
      }

      // 2. Limpiar audio publicado (audioUrl)
      if (storyData.audioUrl && storyData.audioUrl.includes('firebase')) {
        try {
          const urlParts = storyData.audioUrl.split('/');
          const fileName = urlParts[urlParts.length - 1].split('?')[0];
          const audioPath = `stories/${storyData.id}/${fileName}`;
          
          const file = bucket.file(audioPath);
          const [exists] = await file.exists();
          if (exists) {
            if (!this.dryRun) {
              await file.delete();
            }
            this.log(`🗑️ Audio publicado (audioUrl): ${audioPath}`, 'success');
          }
        } catch (error) {
          this.log(`Error eliminando audio publicado: ${error.message}`, 'error');
        }
      }

      // 3. Limpiar audio legacy (audioPath)
      if (storyData.audioPath) {
        try {
          const file = bucket.file(storyData.audioPath);
          const [exists] = await file.exists();
          if (exists) {
            if (!this.dryRun) {
              await file.delete();
            }
            this.log(`🗑️ Audio legacy (audioPath): ${storyData.audioPath}`, 'success');
          }
        } catch (error) {
          this.log(`Error eliminando audio legacy: ${error.message}`, 'error');
        }
      }

              // 4. Limpiar imagen
      if (storyData.imageUrl && storyData.imageUrl.includes('firebase')) {
        try {
          const urlParts = storyData.imageUrl.split('/');
          const fileName = urlParts[urlParts.length - 1].split('?')[0];
          const imagePath = `stories/${storyData.id}/${fileName}`;
          
          const file = bucket.file(imagePath);
          const [exists] = await file.exists();
          if (exists) {
            if (!this.dryRun) {
              await file.delete();
            }
            this.log(`🗑️ Imagen: ${imagePath}`, 'success');
          }
        } catch (error) {
          this.log(`Error eliminando imagen: ${error.message}`, 'error');
        }
      }

    } catch (error) {
      this.log(`Error en limpieza de assets para historia ${storyData.id}: ${error.message}`, 'error');
      this.stats.errors++;
    }
  }

  async deleteStoryFromDatabase(storyId) {
    try {
      if (!this.dryRun) {
        await db.collection('stories').doc(storyId).delete();
      }
      this.log(`🗑️ Historia eliminada de la base de datos: ${storyId}`, 'success');
    } catch (error) {
      this.log(`Error eliminando historia ${storyId} de la base de datos: ${error.message}`, 'error');
      this.stats.errors++;
      throw error;
    }
  }

  async scanAndCleanup() {
    this.log('🧹 Iniciando limpieza de audios corruptos...');
    
    try {
      const storiesSnapshot = await db.collection('stories').get();
      this.stats.totalStories = storiesSnapshot.size;
      
      this.log(`📊 Total de historias encontradas: ${this.stats.totalStories}`);

      const corruptedStories = [];

      for (const doc of storiesSnapshot.docs) {
        const storyData = { id: doc.id, ...doc.data() };
        
        const hasAudio = storyData.tempAudioData || storyData.tempAudioPath || storyData.audioUrl || storyData.audioPath;
        
        if (hasAudio) {
          this.stats.storiesWithAudio++;
          
          this.log(`🔍 Verificando historia: ${storyData.id} (${storyData.title || 'Sin título'})`);
          
          let audioCorrupted = false;
          let corruptionReason = '';

          if (storyData.tempAudioData) {
            const result = await this.isAudioCorrupted(storyData.tempAudioData, null, storyData.id);
            if (result.corrupted) {
              audioCorrupted = true;
              corruptionReason = result.reason;
            }
          }

          if (!audioCorrupted && storyData.tempAudioPath) {
            const result = await this.isAudioCorrupted(null, storyData.tempAudioPath, storyData.id);
            if (result.corrupted) {
              audioCorrupted = true;
              corruptionReason = result.reason;
            }
          }

          if (!audioCorrupted && storyData.audioUrl) {
            const result = await this.isAudioCorrupted(null, storyData.audioUrl, storyData.id);
            if (result.corrupted) {
              audioCorrupted = true;
              corruptionReason = result.reason;
            }
          }

          // Verificar audioPath (estructura antigua)
          if (!audioCorrupted && storyData.audioPath) {
            const result = await this.isAudioCorrupted(null, storyData.audioPath, storyData.id);
            if (result.corrupted) {
              audioCorrupted = true;
              corruptionReason = result.reason;
            }
          }

          // Verificar si fue omitido por fecha (usando el último resultado de verificación)
          let skippedByDate = false;
          if (!audioCorrupted && corruptionReason.includes('too old')) {
            skippedByDate = true;
          }

          if (audioCorrupted) {
            this.stats.corruptedAudio++;
            this.log(`🚨 AUDIO CORRUPTO DETECTADO: ${storyData.id} - ${corruptionReason}`, 'error');
            corruptedStories.push({ ...storyData, corruptionReason });
          } else if (skippedByDate) {
            this.stats.skippedByDate++;
            this.log(`⏰ Audio omitido por fecha: ${storyData.id}`, 'warning');
          } else {
            this.log(`✅ Audio válido: ${storyData.id}`, 'success');
          }
        }
      }

      this.log('\n📊 RESUMEN DEL ANÁLISIS:');
      this.log(`- Total de historias: ${this.stats.totalStories}`);
      this.log(`- Historias con audio: ${this.stats.storiesWithAudio}`);
      this.log(`- Audios corruptos encontrados: ${this.stats.corruptedAudio}`);
      if (this.afterDate) {
        this.log(`- Audios omitidos por fecha (anteriores a ${this.afterDate.toISOString()}): ${this.stats.skippedByDate}`);
      }

      if (corruptedStories.length === 0) {
        this.log('🎉 ¡No se encontraron audios corruptos!', 'success');
        return;
      }

      this.log('\n🚨 HISTORIAS CON AUDIO CORRUPTO:');
      corruptedStories.forEach((story, index) => {
        this.log(`${index + 1}. ${story.id} - "${story.title || 'Sin título'}" - ${story.corruptionReason}`);
      });

      if (!this.dryRun && !this.force) {
        const readline = require('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });

        const answer = await new Promise(resolve => {
          rl.question(`\n❓ ¿Deseas eliminar estas ${corruptedStories.length} historias corruptas? (y/N): `, resolve);
        });
        rl.close();

        if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
          this.log('❌ Operación cancelada por el usuario');
          return;
        }
      }

      this.log('\n🧹 Iniciando limpieza...');
      
      for (const story of corruptedStories) {
        try {
          this.log(`🗑️ Limpiando historia: ${story.id} - "${story.title || 'Sin título'}"`);
          
          await this.cleanupStoryAssets(story);
          await this.deleteStoryFromDatabase(story.id);
          
          this.stats.cleaned++;
          
        } catch (error) {
          this.log(`Error limpiando historia ${story.id}: ${error.message}`, 'error');
          this.stats.errors++;
        }
      }

      this.log('\n🎯 LIMPIEZA COMPLETADA:');
      this.log(`- Historias limpiadas: ${this.stats.cleaned}`);
      this.log(`- Errores: ${this.stats.errors}`);
      
      if (this.stats.cleaned > 0) {
        this.log('✅ ¡Limpieza exitosa!', 'success');
      }

    } catch (error) {
      this.log(`Error durante la limpieza: ${error.message}`, 'error');
      throw error;
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force')
  };

  // Buscar parámetro de fecha
  const afterDateIndex = args.findIndex(arg => arg === '--after-date');
  if (afterDateIndex !== -1 && args[afterDateIndex + 1]) {
    try {
      options.afterDate = new Date(args[afterDateIndex + 1]);
      if (isNaN(options.afterDate.getTime())) {
        throw new Error('Fecha inválida');
      }
    } catch (error) {
      console.error('❌ Error: Fecha inválida. Usa formato YYYY-MM-DD o YYYY-MM-DD HH:MM:SS');
      console.error('   Ejemplo: --after-date 2024-01-01');
      process.exit(1);
    }
  }

  console.log('🧹 HERRAMIENTA DE LIMPIEZA DE AUDIOS CORRUPTOS');
  console.log('=============================================\n');

  if (options.dryRun) {
    console.log('🔍 MODO DRY-RUN: Solo se analizará, no se eliminará nada\n');
  }

  if (options.force) {
    console.log('⚡ MODO FORZADO: No se pedirá confirmación\n');
  }

  if (options.afterDate) {
    console.log(`📅 FILTRO DE FECHA: Solo audios creados después del ${options.afterDate.toISOString()}\n`);
  }

  const cleaner = new AudioCleanupTool(options);
  
  try {
    await cleaner.scanAndCleanup();
  } catch (error) {
    console.error('💥 Error fatal:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { AudioCleanupTool }; 