// scripts/optimize-existing-images.js
// Script para optimizar imágenes PNG existentes a WebP

// 1) Cargar variables de entorno desde .env ANTES de inicializar Firebase
try {
  // .env está en la raíz de Backmielda_new
  // __dirname -> Backmielda_new/scripts  →  ../.env
  // eslint-disable-next-line global-require
  require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
  // eslint-disable-next-line no-console
  console.log('✅ .env loaded for optimize-existing-images.js');
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn('⚠️ Could not load .env file for optimize-existing-images.js:', e.message);
}

// 2) Ahora podemos importar Firebase, que leerá las variables de entorno
// eslint-disable-next-line global-require
const { admin } = require('../config/firebase');
const sharp = require('sharp');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');

const bucket = admin.storage().bucket();

async function optimizeExistingImages() {
  try {
    console.log('🎨 Optimizing existing Learn English images...\n');
    
    const storyIds = [
      'm1w1s1', 'm1w1s2', 'm1w1s3',
      'm1w2s1', 'm1w2s2', 'm1w2s3',
      'm1w3s1', 'm1w3s2', 'm1w3s3',
      'm1w4s1', 'm1w4s2', 'm1w4s3'
    ];
    
    let optimizedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const storyId of storyIds) {
      try {
        // Verificar si ya existe versión WebP
        const webpFile = bucket.file(`learn-english-images/${storyId}-memphis.webp`);
        const [webpExists] = await webpFile.exists();
        
        if (webpExists) {
          console.log(`✓ ${storyId}: WebP already exists, skipping`);
          skippedCount++;
          continue;
        }
        
        // Buscar versión PNG
        const pngFile = bucket.file(`learn-english-images/${storyId}-memphis.png`);
        const [pngExists] = await pngFile.exists();
        
        if (!pngExists) {
          console.log(`⚠ ${storyId}: No PNG found, skipping`);
          skippedCount++;
          continue;
        }
        
        console.log(`📥 ${storyId}: Downloading PNG...`);
        
        // Descargar PNG
        const tempDir = os.tmpdir();
        const pngPath = path.join(tempDir, `${storyId}-temp.png`);
        await pngFile.download({ destination: pngPath });
        
        const pngStats = await fs.stat(pngPath);
        console.log(`   Original size: ${(pngStats.size / 1024).toFixed(2)} KB`);
        
        // Optimizar a WebP
        console.log(`   Converting to WebP...`);
        const webpBuffer = await sharp(pngPath)
          .resize(512, 512, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .webp({
            quality: 75,
            effort: 6,
            smartSubsample: true
          })
          .toBuffer();
        
        console.log(`   Optimized size: ${(webpBuffer.length / 1024).toFixed(2)} KB`);
        console.log(`   Size reduction: ${(((pngStats.size - webpBuffer.length) / pngStats.size) * 100).toFixed(1)}%`);
        
        // Guardar WebP temporalmente
        const webpPath = path.join(tempDir, `${storyId}-temp.webp`);
        await fs.writeFile(webpPath, webpBuffer);
        
        // Subir WebP a Firebase
        console.log(`   Uploading WebP...`);
        const webpStoragePath = `learn-english-images/${storyId}-memphis.webp`;
        await bucket.upload(webpPath, {
          destination: webpStoragePath,
          metadata: {
            cacheControl: 'public, max-age=31536000, immutable',
            contentType: 'image/webp'
          }
        });
        
        // Hacer público
        await bucket.file(webpStoragePath).makePublic();
        
        // Limpiar archivos temporales
        await fs.unlink(pngPath).catch(() => {});
        await fs.unlink(webpPath).catch(() => {});
        
        console.log(`✅ ${storyId}: Optimized successfully!\n`);
        optimizedCount++;
        
      } catch (error) {
        console.error(`❌ ${storyId}: Error - ${error.message}\n`);
        errorCount++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 OPTIMIZATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Optimized: ${optimizedCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📁 Total processed: ${storyIds.length}`);
    console.log('='.repeat(60));
    
    // Opcional: Eliminar archivos PNG antiguos si lo deseas
    if (optimizedCount > 0) {
      console.log('\n💡 TIP: You can now delete the old PNG files to save storage:');
      console.log('   Run: node scripts/delete-old-pngs.js');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Ejecutar el script
optimizeExistingImages()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

