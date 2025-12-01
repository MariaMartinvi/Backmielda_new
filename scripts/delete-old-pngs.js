// scripts/delete-old-pngs.js
// Script para eliminar imágenes PNG antiguas después de la optimización

const { admin } = require('../config/firebase');
const readline = require('readline');

const bucket = admin.storage().bucket();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function deleteOldPNGs() {
  try {
    console.log('🗑️  Delete Old PNG Images\n');
    console.log('⚠️  WARNING: This will permanently delete PNG files!');
    console.log('Make sure WebP versions exist before proceeding.\n');
    
    const storyIds = [
      'm1w1s1', 'm1w1s2', 'm1w1s3',
      'm1w2s1', 'm1w2s2', 'm1w2s3',
      'm1w3s1', 'm1w3s2', 'm1w3s3',
      'm1w4s1', 'm1w4s2', 'm1w4s3'
    ];
    
    let deletedCount = 0;
    let notFoundCount = 0;
    let errorCount = 0;
    
    // Verificar qué archivos existen
    console.log('📋 Checking files...\n');
    for (const storyId of storyIds) {
      const webpFile = bucket.file(`learn-english-images/${storyId}-memphis.webp`);
      const pngFile = bucket.file(`learn-english-images/${storyId}-memphis.png`);
      
      const [webpExists] = await webpFile.exists();
      const [pngExists] = await pngFile.exists();
      
      console.log(`${storyId}:`);
      console.log(`  WebP: ${webpExists ? '✅' : '❌'}`);
      console.log(`  PNG:  ${pngExists ? '🟡' : '❌'}`);
    }
    
    console.log('');
    const answer = await askQuestion('Do you want to delete all PNG files? (yes/no): ');
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Cancelled');
      rl.close();
      return;
    }
    
    console.log('\n🗑️  Deleting PNG files...\n');
    
    for (const storyId of storyIds) {
      try {
        const pngFile = bucket.file(`learn-english-images/${storyId}-memphis.png`);
        const [pngExists] = await pngFile.exists();
        
        if (!pngExists) {
          console.log(`⏭️  ${storyId}: PNG not found, skipping`);
          notFoundCount++;
          continue;
        }
        
        // Verificar que existe WebP antes de eliminar PNG
        const webpFile = bucket.file(`learn-english-images/${storyId}-memphis.webp`);
        const [webpExists] = await webpFile.exists();
        
        if (!webpExists) {
          console.log(`⚠️  ${storyId}: WebP not found, keeping PNG for safety`);
          errorCount++;
          continue;
        }
        
        await pngFile.delete();
        console.log(`✅ ${storyId}: PNG deleted`);
        deletedCount++;
        
      } catch (error) {
        console.error(`❌ ${storyId}: Error - ${error.message}`);
        errorCount++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 DELETION SUMMARY');
    console.log('='.repeat(60));
    console.log(`🗑️  Deleted: ${deletedCount}`);
    console.log(`⏭️  Not found: ${notFoundCount}`);
    console.log(`❌ Errors/Skipped: ${errorCount}`);
    console.log(`📁 Total processed: ${storyIds.length}`);
    console.log('='.repeat(60));
    
    rl.close();
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    rl.close();
    process.exit(1);
  }
}

// Ejecutar el script
deleteOldPNGs()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

