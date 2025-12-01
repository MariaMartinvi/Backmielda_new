// scripts/generate-missing-learn-english-images.js
// Genera (o regenera) las imágenes que faltan del Mes 1 de Learn English
// Uso: node scripts/generate-missing-learn-english-images.js [--regenerate]

// 1) Cargar variables de entorno
try {
  require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
  console.log('✅ .env loaded for generate-missing-learn-english-images.js');
} catch (e) {
  console.warn('⚠️ Could not load .env file for generate-missing-learn-english-images.js:', e.message);
}

const { admin } = require('../config/firebase');
const learnEnglishController = require('../controllers/learnEnglishController');

// Asegurarnos de que el bucket de Storage está accesible
const bucket = admin.storage().bucket();

// Lista de historias del Mes 1 (las mismas que usa el controlador)
const STORY_IDS = [
  'm1w1s1', 'm1w1s2', 'm1w1s3',
  'm1w2s1', 'm1w2s2', 'm1w2s3',
  'm1w3s1', 'm1w3s2', 'm1w3s3',
  'm1w4s1', 'm1w4s2', 'm1w4s3'
];

// Verificar si se debe regenerar (forzar borrado y regeneración)
const FORCE_REGENERATE = process.argv.includes('--regenerate') || process.argv.includes('-r');

// Las últimas 4 historias que necesitan regeneración (las que no tienen el estilo correcto)
const LAST_4_STORIES = ['m1w3s2', 'm1w3s3', 'm1w4s2', 'm1w4s3'];

async function checkExistingImages() {
  const results = [];

  for (const storyId of STORY_IDS) {
    const webpPath = `learn-english-images/${storyId}-memphis.webp`;
    const pngPath = `learn-english-images/${storyId}-memphis.png`;

    const webpFile = bucket.file(webpPath);
    const pngFile = bucket.file(pngPath);

    const [webpExists] = await webpFile.exists();
    const [pngExists] = await pngFile.exists();

    results.push({
      storyId,
      webpExists,
      pngExists
    });
  }

  return results;
}

async function deleteExistingWebP(storyId) {
  try {
    const webpPath = `learn-english-images/${storyId}-memphis.webp`;
    const webpFile = bucket.file(webpPath);
    const [exists] = await webpFile.exists();
    
    if (exists) {
      await webpFile.delete();
      console.log(`🗑️  [${storyId}] Deleted existing WebP image`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ [${storyId}] Error deleting WebP: ${error.message}`);
    return false;
  }
}

async function main() {
  if (FORCE_REGENERATE) {
    console.log('🔄 REGENERATE MODE: Will delete existing WebP images and regenerate them\n');
  } else {
    console.log('🎨 Generating missing Learn English images for Month 1...\n');
  }

  const existing = await checkExistingImages();

  console.log('📋 Current image status:');
  for (const item of existing) {
    console.log(
      `  ${item.storyId}: ` +
      `WEBP: ${item.webpExists ? '✅' : '❌'} ` +
      `PNG: ${item.pngExists ? '🟡' : '❌'}`
    );
  }

  let storiesToGenerate = [];

  if (FORCE_REGENERATE) {
    // En modo regenerar, solo borrar y regenerar las últimas 4 historias
    console.log('\n🗑️  Deleting existing WebP images for last 4 stories only...\n');
    for (const item of existing) {
      // Solo procesar las últimas 4 historias
      if (LAST_4_STORIES.includes(item.storyId)) {
        if (item.webpExists) {
          await deleteExistingWebP(item.storyId);
          storiesToGenerate.push(item);
        } else if (!item.pngExists) {
          // También generar las que no tienen ninguna imagen
          storiesToGenerate.push(item);
        }
      }
    }
  } else {
    // Modo normal: solo generar las que no tienen imagen
    storiesToGenerate = existing.filter((item) => !item.webpExists && !item.pngExists);
  }

  if (storiesToGenerate.length === 0) {
    if (FORCE_REGENERATE) {
      console.log('\n⚠️  No WebP images found to regenerate.');
    } else {
      console.log('\n✅ All 12 stories already have images (WEBP or PNG). Nothing to do.');
      console.log('   Use --regenerate flag to force regeneration: node scripts/generate-missing-learn-english-images.js --regenerate');
    }
    process.exit(0);
  }

  console.log(`\n🎯 Stories to generate: ${storiesToGenerate.length}`);
  console.log(storiesToGenerate.map((m) => m.storyId).join(', '), '\n');

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const item of storiesToGenerate) {
    const storyId = item.storyId;
    console.log(`\n🎨 [${storyId}] Generating Memphis Espacial Nocturno image...`);

    const result = await learnEnglishController.generateImageForStory(storyId);

    if (result.success && result.skipped) {
      console.log(`⏭️  [${storyId}] Skipped (image already exists)`);
      skipCount++;
    } else if (result.success) {
      console.log(`✅ [${storyId}] Image generated successfully with Memphis Espacial Nocturno style`);
      successCount++;
    } else {
      console.log(`❌ [${storyId}] Failed: ${result.error}`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY - Learn English Month 1 Images');
  console.log('='.repeat(60));
  console.log(`✅ Generated: ${successCount}`);
  console.log(`⏭️  Skipped (already had image): ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📁 Total stories: ${STORY_IDS.length}`);
  console.log('='.repeat(60));

  process.exit(errorCount > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('❌ Fatal error in generate-missing-learn-english-images.js:', error);
  process.exit(1);
});

