// Script para hacer públicos los archivos de audio Learn English en Firebase Storage
const { admin } = require('../config/firebase');

async function makeAudioFilesPublic() {
  console.log('\n🔓 HACIENDO PÚBLICOS LOS ARCHIVOS DE AUDIO\n');
  console.log('='.repeat(60));
  
  const bucket = admin.storage().bucket();
  console.log(`📦 Bucket: ${bucket.name}\n`);
  
  // Lista de archivos a hacer públicos
  const filesToMakePublic = [
    'learn-english-audio/intro-en.mp3',
    'learn-english-audio/m1w1s1-vocab-es.mp3',
    'learn-english-audio/m1w1s1-story.mp3',
    'learn-english-audio/m1w1s2-vocab-es.mp3',
    'learn-english-audio/m1w1s2-story.mp3',
    'learn-english-audio/m1w1s3-vocab-es.mp3',
    'learn-english-audio/m1w1s3-story.mp3',
    // Añadir otros idiomas si existen
    'learn-english-audio/m1w1s1-vocab-fr.mp3',
    'learn-english-audio/m1w1s2-vocab-fr.mp3',
    'learn-english-audio/m1w1s3-vocab-fr.mp3',
  ];
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  for (const filePath of filesToMakePublic) {
    try {
      const file = bucket.file(filePath);
      const [exists] = await file.exists();
      
      if (!exists) {
        console.log(`⏭️  SKIP (no existe): ${filePath}`);
        skipCount++;
        continue;
      }
      
      // Hacer público el archivo
      console.log(`🔓 Haciendo público: ${filePath}...`);
      await file.makePublic();
      
      // Verificar que se hizo público
      try {
        const [acl] = await file.acl.get({ entity: 'allUsers' });
        if (acl.role === 'READER') {
          console.log(`✅ PÚBLICO: ${filePath}`);
          
          // Mostrar URL pública
          const encodedPath = encodeURIComponent(filePath);
          const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;
          console.log(`   🌐 URL: ${publicUrl}`);
          console.log('');
          
          successCount++;
        } else {
          console.log(`⚠️  ADVERTENCIA: ${filePath} (permisos inesperados)`);
          console.log('');
          errorCount++;
        }
      } catch (aclError) {
        // Si hay error al verificar ACL, intentar de otra forma
        console.log(`✅ PÚBLICO (asumido): ${filePath}`);
        console.log('   ⚠️  No se pudo verificar ACL, pero makePublic() se ejecutó sin errores');
        console.log('');
        successCount++;
      }
      
    } catch (error) {
      console.log(`❌ ERROR: ${filePath}`);
      console.log(`   Error: ${error.message}`);
      console.log('');
      errorCount++;
    }
  }
  
  console.log('='.repeat(60));
  console.log('\n📊 RESUMEN:');
  console.log(`   ✅ Archivos públicos: ${successCount}`);
  console.log(`   ⏭️  Archivos omitidos: ${skipCount}`);
  console.log(`   ❌ Errores: ${errorCount}`);
  console.log('');
  
  if (successCount > 0) {
    console.log('✅ ÉXITO: Los archivos ya son públicos.');
    console.log('   Ahora puedes probar la aplicación de nuevo.');
    console.log('   Las URLs deberían funcionar correctamente.');
  }
  
  if (errorCount > 0) {
    console.log('⚠️  ADVERTENCIA: Algunos archivos no se pudieron hacer públicos.');
    console.log('   Es posible que necesites configurar permisos en Firebase Console.');
  }
  
  console.log('\n');
}

// Ejecutar
makeAudioFilesPublic()
  .then(() => {
    console.log('✅ Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error crítico:', error);
    process.exit(1);
  });





