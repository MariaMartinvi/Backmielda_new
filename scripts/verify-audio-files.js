// Script para verificar si los archivos MP3 son válidos
const { admin } = require('../config/firebase');
const fs = require('fs').promises;
const path = require('path');

async function verifyAudioFiles() {
  console.log('\n🔍 VERIFICANDO VALIDEZ DE ARCHIVOS MP3\n');
  console.log('='.repeat(60));
  
  const bucket = admin.storage().bucket();
  const tempDir = path.join(__dirname, '../temp/audio-check');
  
  // Crear directorio temporal
  await fs.mkdir(tempDir, { recursive: true });
  
  const filesToCheck = [
    'learn-english-audio/intro-en.mp3',
    'learn-english-audio/m1w1s1-vocab-es.mp3',
    'learn-english-audio/m1w1s1-story.mp3',
  ];
  
  for (const filePath of filesToCheck) {
    try {
      console.log(`\n📁 Verificando: ${filePath}`);
      
      const file = bucket.file(filePath);
      const [exists] = await file.exists();
      
      if (!exists) {
        console.log('   ❌ No existe');
        continue;
      }
      
      // Descargar archivo
      const localPath = path.join(tempDir, path.basename(filePath));
      await file.download({ destination: localPath });
      
      // Leer primeros bytes para verificar header MP3
      const buffer = await fs.readFile(localPath);
      const header = buffer.slice(0, 20);
      
      console.log(`   📊 Tamaño: ${buffer.length} bytes`);
      console.log(`   🔤 Primeros 20 bytes (hex): ${header.toString('hex')}`);
      console.log(`   📝 Primeros 10 caracteres: ${header.toString('ascii', 0, 10).replace(/[^\x20-\x7E]/g, '.')}`);
      
      // Verificar header MP3 (debe empezar con ID3 o FF FB/FF FA)
      const isID3 = buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33; // "ID3"
      const isMPEG = buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0;
      
      if (isID3) {
        console.log('   ✅ Header válido: ID3 (MP3 con metadata)');
      } else if (isMPEG) {
        console.log('   ✅ Header válido: MPEG Audio Frame');
      } else {
        console.log('   ❌ Header INVÁLIDO - NO es un archivo MP3 válido');
        console.log('   ⚠️  Este archivo está CORRUPTO o no es MP3');
      }
      
      // Verificar que no sea todo ceros
      const allZeros = buffer.every(byte => byte === 0);
      if (allZeros) {
        console.log('   ❌ CORRUPTO: Archivo lleno de ceros');
      }
      
      // Verificar que tenga contenido variado (entropía básica)
      const uniqueBytes = new Set(buffer.slice(0, 1000)).size;
      console.log(`   📈 Bytes únicos en primeros 1000: ${uniqueBytes}`);
      if (uniqueBytes < 20) {
        console.log('   ⚠️  Baja variedad de datos - posiblemente corrupto');
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📋 ARCHIVOS DESCARGADOS EN: ' + tempDir);
  console.log('   Puedes intentar reproducirlos manualmente con un reproductor de audio.');
  console.log('');
}

// Ejecutar
verifyAudioFiles()
  .then(() => {
    console.log('✅ Verificación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });





