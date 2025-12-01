// scripts/optimize-library-images.js
// Optimiza las imágenes de la carpeta `/images` (biblioteca) en Firebase Storage

// 1) Cargar variables de entorno desde .env ANTES de inicializar Firebase
try {
  require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
  console.log('✅ .env loaded for optimize-library-images.js');
} catch (e) {
  console.warn('⚠️ Could not load .env file for optimize-library-images.js:', e.message);
}

const { admin } = require('../config/firebase');
const sharp = require('sharp');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');

const bucket = admin.storage().bucket();

async function optimizeLibraryImages() {
  try {
    console.log('🎨 Optimizing existing library images in /images ...\n');

    // Listar todos los ficheros bajo la carpeta "images/"
    const [files] = await bucket.getFiles({ prefix: 'images/' });

    // Filtrar solo PNG/JPG grandes (ignoramos ya .webp)
    const imageFiles = files.filter((file) => {
      const name = file.name.toLowerCase();
      return (
        (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg')) &&
        !name.endsWith('.webp')
      );
    });

    console.log(`📂 Found ${imageFiles.length} image(s) in /images to check\n`);

    let optimizedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const file of imageFiles) {
      const fileName = file.name; // e.g. images/cover1.png
      const baseName = path.basename(fileName, path.extname(fileName)); // cover1
      const dirName = path.dirname(fileName); // images

      try {
        // Comprobar si ya existe versión webp junto a la imagen
        const webpPath = `${dirName}/${baseName}.webp`;
        const webpFile = bucket.file(webpPath);
        const [webpExists] = await webpFile.exists();

        if (webpExists) {
          console.log(`✓ ${fileName}: WebP already exists (${webpPath}), skipping`);
          skippedCount++;
          continue;
        }

        console.log(`📥 ${fileName}: Downloading...`);

        // Descargar original
        const tempDir = os.tmpdir();
        const localInputPath = path.join(tempDir, baseName + '-lib-temp' + path.extname(fileName));
        await file.download({ destination: localInputPath });

        const inputStats = await fs.stat(localInputPath);
        console.log(`   Original size: ${(inputStats.size / 1024).toFixed(2)} KB`);

        // Optimizar a WebP (mismo tamaño objetivo que las de Learn English: 512x512 máx)
        console.log('   Converting to WebP...');
        const webpBuffer = await sharp(localInputPath)
          .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 75, effort: 6, smartSubsample: true })
          .toBuffer();

        console.log(`   Optimized size: ${(webpBuffer.length / 1024).toFixed(2)} KB`);
        console.log(
          `   Size reduction: ${(
            ((inputStats.size - webpBuffer.length) / inputStats.size) *
            100
          ).toFixed(1)}%`
        );

        // Guardar webp temporalmente
        const localWebpPath = path.join(tempDir, baseName + '-lib-temp.webp');
        await fs.writeFile(localWebpPath, webpBuffer);

        // Subir WebP a Firebase en la misma carpeta
        console.log(`   Uploading WebP to ${webpPath} ...`);
        await bucket.upload(localWebpPath, {
          destination: webpPath,
          metadata: {
            cacheControl: 'public, max-age=31536000, immutable',
            contentType: 'image/webp',
          },
        });

        // Hacer público
        await bucket.file(webpPath).makePublic();

        // Limpiar temporales
        await fs.unlink(localInputPath).catch(() => {});
        await fs.unlink(localWebpPath).catch(() => {});

        console.log(`✅ ${fileName}: Optimized successfully as ${webpPath}\n`);
        optimizedCount++;
      } catch (err) {
        console.error(`❌ ${fileName}: Error - ${err.message}\n`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 LIBRARY IMAGES OPTIMIZATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Optimized: ${optimizedCount}`);
    console.log(`⏭️  Skipped (already webp): ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📁 Total processed: ${imageFiles.length}`);
    console.log('='.repeat(60));

    if (optimizedCount > 0) {
      console.log('\n💡 TIP: You can later delete original PNG/JPG files manually in Firebase console if you wish.');
    }
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

optimizeLibraryImages()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });


