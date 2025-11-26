const { generateImage } = require('../utils/openaiService');
const { admin } = require('../config/firebase');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
require('dotenv').config();

// Lazy loading del bucket
let bucket = null;
const getFirebaseStorageBucket = () => {
  if (!bucket) {
    bucket = admin.storage().bucket();
  }
  return bucket;
};

// Función para subir a Firebase Storage (copiada de storyController.js)
async function uploadToFirebaseStorage(localFilePath, storagePath) {
  try {
    console.log(`📤 Subiendo ${localFilePath} → ${storagePath}`);
    
    const bucket = getFirebaseStorageBucket();
    
    await bucket.upload(localFilePath, {
      destination: storagePath,
      metadata: {
        cacheControl: 'public, max-age=31536000',
        contentType: 'image/png'
      },
    });
    
    const file = bucket.file(storagePath);
    const [metadata] = await file.getMetadata();
    
    console.log(`✅ Archivo subido: ${(parseInt(metadata.size) / 1024).toFixed(2)}KB`);
    
    // Hacer público
    await file.makePublic();
    
    // Generar URL pública
    const encodedPath = encodeURIComponent(storagePath);
    return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;
    
  } catch (error) {
    console.error('❌ Error subiendo a Firebase:', error.message);
    throw error;
  }
}

async function generateTestImage() {
  const storyId = 'm1w1s1'; // Primer cuento: "I am Sara from Barcelona"
  const character = 'Sara';
  const scene = "a girl playing videogames in a futuristic room with space elements";

  // Estilo Memphis Espacial Nocturno
  const prompt = `Memphis style, geometric shapes, vibrant electric blue, hot pink, yellow, and deep purples. 
Night space theme. Energetic and educational. Show ${character} in ${scene}. 
IMPORTANT: NO TEXT OR WORDS should appear in the image - only visual elements.`;

  console.log('\n🎨 Generando imagen de prueba para el primer cuento...');
  console.log('📝 Personaje:', character);
  console.log('🌟 Estilo: Memphis Espacial Nocturno\n');
  console.log('⏳ Esto puede tardar 30-60 segundos...\n');
  
  const tempDir = os.tmpdir();
  let imagePath;
  let firebaseUrl;
  
  try {
    // Paso 1: Generar imagen con Fal.ai
    const response = await generateImage(prompt);

    if (!response.data || !response.data[0] || !response.data[0].url) {
      throw new Error('Respuesta inválida del servicio de generación de imágenes');
    }

    const imageUrl = response.data[0].url;
    console.log('✅ Imagen generada, descargando...');
    
    // Paso 2: Descargar la imagen (igual que en storyController.js)
    let imageBuffer;
    if (imageUrl.startsWith('data:')) {
      // Si es base64, extraer directamente
      const base64Data = imageUrl.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      // Si es URL, descargar
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.status}`);
      }
      const imageArrayBuffer = await imageResponse.arrayBuffer();
      imageBuffer = Buffer.from(imageArrayBuffer);
    }
    
    console.log('✅ Imagen descargada, guardando...');
    
    // Paso 3: Guardar temporalmente
    const imageFileName = `test-${storyId}-${Date.now()}.png`;
    imagePath = path.join(tempDir, imageFileName);
    await fs.writeFile(imagePath, imageBuffer);
    
    console.log('✅ Imagen guardada, subiendo a Firebase...');
    
    // Paso 4: Subir a Firebase Storage
    const storagePath = `learn-english-images/${imageFileName}`;
    firebaseUrl = await uploadToFirebaseStorage(imagePath, storagePath);
    
    console.log('\n' + '='.repeat(60));
    console.log('🖼️  URL DE LA IMAGEN:');
    console.log('='.repeat(60));
    console.log('');
    console.log(firebaseUrl);
    console.log('');
    console.log('='.repeat(60));
    console.log('\n📋 INSTRUCCIONES:');
    console.log('   1. Copia la URL de arriba');
    console.log('   2. Ábrela en tu navegador');
    console.log('   3. Si te gusta el estilo → perfecto! ✅');
    console.log('   4. Si no te gusta → modificamos el prompt');
    console.log('\n✅ Script completado\n');
    
  } catch (error) {
    console.error('\n❌ Error generando imagen de prueba:', error.message);
    if (error.response) {
      console.error('Respuesta del API:', error.response.data);
    }
  } finally {
    // Limpiar archivo temporal
    if (imagePath) {
      try {
        await fs.unlink(imagePath);
        console.log('🗑️  Archivo temporal eliminado');
      } catch (cleanupError) {
        console.warn('⚠️  No se pudo eliminar el archivo temporal:', cleanupError.message);
      }
    }
  }
}

generateTestImage();
