// Script para configurar CORS en Firebase Storage
const { admin } = require('../config/firebase');
const { Storage } = require('@google-cloud/storage');

async function setupCORS() {
  console.log('\n🌐 CONFIGURANDO CORS EN FIREBASE STORAGE\n');
  console.log('='.repeat(60));
  
  try {
    const bucket = admin.storage().bucket();
    console.log(`📦 Bucket: ${bucket.name}`);
    
    // Configuración CORS
    const corsConfiguration = [
      {
        origin: ['*'], // Permitir todos los orígenes
        method: ['GET', 'HEAD'], // Solo lectura
        maxAgeSeconds: 3600,
        responseHeader: ['Content-Type', 'Access-Control-Allow-Origin']
      }
    ];
    
    console.log('\n📝 Configuración CORS a aplicar:');
    console.log(JSON.stringify(corsConfiguration, null, 2));
    console.log('');
    
    // Aplicar configuración CORS
    console.log('⏳ Aplicando configuración CORS...');
    await bucket.setCorsConfiguration(corsConfiguration);
    
    console.log('✅ CORS configurado correctamente!\n');
    
    // Verificar la configuración
    console.log('🔍 Verificando configuración...');
    const [metadata] = await bucket.getMetadata();
    
    if (metadata.cors) {
      console.log('✅ CORS está activo:');
      console.log(JSON.stringify(metadata.cors, null, 2));
    } else {
      console.log('⚠️  No se pudo verificar CORS en metadata');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Configuración completada!');
    console.log('   Ahora los audios deberían cargarse correctamente en el navegador.');
    console.log('   Recarga la página web y prueba de nuevo.\n');
    
  } catch (error) {
    console.error('\n❌ ERROR al configurar CORS:', error.message);
    console.error('\n📋 SOLUCIÓN ALTERNATIVA:');
    console.error('   Si no tienes gsutil instalado, puedes configurar CORS manualmente:');
    console.error('   1. Instala Google Cloud SDK: https://cloud.google.com/sdk/docs/install');
    console.error('   2. Ejecuta: gcloud auth login');
    console.error('   3. Ejecuta: gsutil cors set cors.json gs://cuentacuentos-b2e64.firebasestorage.app');
    console.error('');
    throw error;
  }
}

// Ejecutar
setupCORS()
  .then(() => {
    console.log('✅ Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error crítico:', error);
    process.exit(1);
  });





