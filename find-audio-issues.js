const { db } = require('./config/firebase');
const { getFirebaseStorageBucket } = require('./controllers/storyController');

async function findAudioIssues() {
  try {
    console.log('🔍 Buscando historias relacionadas con "usoa" o títulos similares...\n');
    
    // Buscar historias que contengan palabras clave
    const snapshot = await db.collection('stories').get();
    const relatedStories = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const title = (data.title || '').toLowerCase();
      
      if (title.includes('usoa') || 
          title.includes('hiria') || 
          title.includes('konkista') ||
          title.includes('paloma') ||
          title.includes('conquista')) {
        relatedStories.push({ id: doc.id, ...data });
      }
    });
    
    console.log(`📊 Encontradas ${relatedStories.length} historias relacionadas:\n`);
    
    relatedStories.forEach((story, index) => {
      console.log(`${index + 1}. ${story.id} - "${story.title}"`);
      console.log(`   Email: ${story.email}`);
      console.log(`   Creado: ${story.createdAt?.toDate?.() || 'No disponible'}`);
      console.log(`   Audio base64: ${story.tempAudioData ? `Sí (${story.tempAudioData.length} chars)` : 'No'}`);
      console.log(`   Audio path: ${story.tempAudioPath || 'No'}`);
      console.log(`   Audio URL: ${story.audioUrl || 'No'}`);
      console.log(`   Publicado: ${story.published || false}`);
      
      // Analizar audio si existe
      if (story.tempAudioData) {
        try {
          const buffer = Buffer.from(story.tempAudioData, 'base64');
          console.log(`   📊 Tamaño: ${buffer.length} bytes`);
          
          const firstBytes = buffer.slice(0, 4);
          const hexString = firstBytes.toString('hex').toUpperCase();
          console.log(`   🔍 Cabecera: ${hexString}`);
          
          // Verificar si se corta abruptamente
          const lastBytes = buffer.slice(-4);
          const lastHex = lastBytes.toString('hex').toUpperCase();
          console.log(`   🔚 Final: ${lastHex}`);
          
          // Detectar posible audio cortado
          if (buffer.length < 5000) {
            console.log(`   🚨 POSIBLE AUDIO CORTADO: Muy pequeño (${buffer.length} bytes)`);
          }
          
          // Verificar si termina abruptamente (no con silencio o padding)
          if (!lastHex.includes('00') && !lastHex.includes('FF')) {
            console.log(`   ⚠️ POSIBLE CORTE ABRUPTO: No termina correctamente`);
          }
          
        } catch (error) {
          console.log(`   ❌ Error analizando audio: ${error.message}`);
        }
      }
      
      console.log('');
    });
    
    // Buscar archivos huérfanos en Storage
    console.log('\n🗂️ Verificando archivos huérfanos en Firebase Storage...\n');
    
    try {
      const bucket = getFirebaseStorageBucket();
      
      // Buscar en temp-audio
      const [tempFiles] = await bucket.getFiles({ prefix: 'temp-audio/' });
      console.log(`📁 Archivos temporales encontrados: ${tempFiles.length}`);
      
      for (const file of tempFiles.slice(0, 10)) { // Limitar a 10 para no saturar
        const [metadata] = await file.getMetadata();
        console.log(`   - ${file.name} (${metadata.size} bytes, ${metadata.timeCreated})`);
      }
      
      // Buscar en stories/
      const [storyFiles] = await bucket.getFiles({ prefix: 'stories/' });
      console.log(`\n📁 Archivos de historias encontrados: ${storyFiles.length}`);
      
      const audioFiles = storyFiles.filter(f => f.name.endsWith('.mp3'));
      console.log(`🎵 Archivos de audio: ${audioFiles.length}`);
      
      for (const file of audioFiles.slice(0, 10)) { // Limitar a 10
        const [metadata] = await file.getMetadata();
        console.log(`   - ${file.name} (${metadata.size} bytes, ${metadata.timeCreated})`);
        
        // Verificar si el archivo es muy pequeño
        if (parseInt(metadata.size) < 5000) {
          console.log(`     🚨 ARCHIVO CORRUPTO: Muy pequeño (${metadata.size} bytes)`);
        }
      }
      
    } catch (storageError) {
      console.log(`❌ Error accediendo a Storage: ${storageError.message}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  process.exit(0);
}

findAudioIssues(); 