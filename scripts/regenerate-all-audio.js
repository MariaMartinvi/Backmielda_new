// Script para ELIMINAR archivos corruptos y FORZAR regeneración
const { admin } = require('../config/firebase');

async function deleteCorruptedAudio() {
  console.log('\n🗑️  ELIMINANDO ARCHIVOS CORRUPTOS\n');
  console.log('='.repeat(60));
  
  const bucket = admin.storage().bucket();
  console.log(`📦 Bucket: ${bucket.name}\n`);
  
  // Lista de archivos corruptos a eliminar
  const filesToDelete = [
    'learn-english-audio/intro-en.mp3',
    'learn-english-audio/m1w1s1-vocab-es.mp3',
    'learn-english-audio/m1w1s1-story.mp3',
    'learn-english-audio/m1w1s2-vocab-es.mp3',
    'learn-english-audio/m1w1s2-story.mp3',
    'learn-english-audio/m1w1s3-vocab-es.mp3',
    'learn-english-audio/m1w1s3-story.mp3',
    'learn-english-audio/m1w2s1-vocab-es.mp3',
    'learn-english-audio/m1w2s1-story.mp3',
    'learn-english-audio/m1w2s2-vocab-es.mp3',
    'learn-english-audio/m1w2s2-story.mp3',
    'learn-english-audio/m1w2s3-vocab-es.mp3',
    'learn-english-audio/m1w2s3-story.mp3',
  ];
  
  let deletedCount = 0;
  let notFoundCount = 0;
  
  for (const filePath of filesToDelete) {
    try {
      const file = bucket.file(filePath);
      const [exists] = await file.exists();
      
      if (!exists) {
        console.log(`⏭️  NO EXISTE: ${filePath}`);
        notFoundCount++;
        continue;
      }
      
      await file.delete();
      console.log(`✅ ELIMINADO: ${filePath}`);
      deletedCount++;
      
    } catch (error) {
      console.log(`❌ ERROR eliminando ${filePath}: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 RESUMEN:');
  console.log(`   ✅ Archivos eliminados: ${deletedCount}`);
  console.log(`   ⏭️  Archivos no encontrados: ${notFoundCount}`);
  console.log('');
  console.log('✅ LISTO! Los archivos corruptos han sido eliminados.');
  console.log('   La próxima vez que cargues una historia, se regenerarán correctamente.');
  console.log('   El código ya está arreglado para decodificar base64 → binario.');
  console.log('');
}

// Ejecutar
deleteCorruptedAudio()
  .then(() => {
    console.log('✅ Proceso completado');
    console.log('\n📋 PRÓXIMOS PASOS:');
    console.log('   1. Reinicia el servidor backend (npm start)');
    console.log('   2. Recarga la aplicación web');
    console.log('   3. Carga una historia de Learn English');
    console.log('   4. Los audios se generarán correctamente esta vez!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });





