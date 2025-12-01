// Script para verificar el estado de los archivos de audio Learn English en Firebase Storage
const { admin } = require('../config/firebase');

async function checkAudioFiles() {
  console.log('\n🔍 VERIFICANDO ARCHIVOS DE AUDIO EN FIREBASE STORAGE\n');
  console.log('='.repeat(60));
  
  const bucket = admin.storage().bucket();
  console.log(`📦 Bucket: ${bucket.name}\n`);
  
  // Lista de archivos a verificar
  const filesToCheck = [
    'learn-english-audio/intro-en.mp3',
    'learn-english-audio/m1w1s1-vocab-es.mp3',
    'learn-english-audio/m1w1s1-story.mp3',
    'learn-english-audio/m1w1s2-vocab-es.mp3',
    'learn-english-audio/m1w1s2-story.mp3',
    'learn-english-audio/m1w1s3-vocab-es.mp3',
    'learn-english-audio/m1w1s3-story.mp3',
  ];
  
  let totalSize = 0;
  let existingFiles = 0;
  let corruptedFiles = 0;
  let missingFiles = 0;
  
  for (const filePath of filesToCheck) {
    try {
      const file = bucket.file(filePath);
      const [exists] = await file.exists();
      
      if (!exists) {
        console.log(`❌ NO EXISTE: ${filePath}`);
        missingFiles++;
        continue;
      }
      
      const [metadata] = await file.getMetadata();
      const sizeInBytes = parseInt(metadata.size);
      const sizeInKB = (sizeInBytes / 1024).toFixed(2);
      
      if (sizeInBytes === 0) {
        console.log(`🔴 CORRUPTO (0 bytes): ${filePath}`);
        corruptedFiles++;
      } else if (sizeInBytes < 1000) {
        console.log(`⚠️  SOSPECHOSO (${sizeInKB} KB): ${filePath}`);
        corruptedFiles++;
      } else {
        console.log(`✅ OK (${sizeInKB} KB): ${filePath}`);
        existingFiles++;
        totalSize += sizeInBytes;
      }
      
      // Mostrar URL pública
      const encodedPath = encodeURIComponent(filePath);
      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;
      console.log(`   URL: ${publicUrl.substring(0, 80)}...`);
      
      // Verificar si es público
      try {
        const [acl] = await file.acl.get({ entity: 'allUsers' });
        if (acl.role === 'READER') {
          console.log(`   🌐 Público: SÍ`);
        }
      } catch (aclError) {
        console.log(`   🔒 Público: NO (error de acceso)`);
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`❌ ERROR al verificar ${filePath}: ${error.message}\n`);
      missingFiles++;
    }
  }
  
  console.log('='.repeat(60));
  console.log('\n📊 RESUMEN:');
  console.log(`   ✅ Archivos correctos: ${existingFiles}`);
  console.log(`   🔴 Archivos corruptos: ${corruptedFiles}`);
  console.log(`   ❌ Archivos faltantes: ${missingFiles}`);
  console.log(`   💾 Tamaño total: ${(totalSize / 1024).toFixed(2)} KB`);
  console.log('');
  
  if (missingFiles > 0 || corruptedFiles > 0) {
    console.log('⚠️  ACCIÓN NECESARIA:');
    console.log('   Los archivos faltantes o corruptos deben regenerarse.');
    console.log('   Ejecuta: node scripts/regenerate-learn-english-audio.js');
  } else {
    console.log('✅ Todos los archivos están en buen estado.');
  }
  
  console.log('\n');
}

// Ejecutar
checkAudioFiles()
  .then(() => {
    console.log('✅ Verificación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en la verificación:', error);
    process.exit(1);
  });





