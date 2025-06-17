const { db } = require('./config/firebase');

async function findStory() {
  try {
    const snapshot = await db.collection('stories')
      .where('title', '==', 'Hiria konkistatzen duen usoa')
      .get();
    
    if (snapshot.empty) {
      console.log('Historia no encontrada');
      return;
    }
    
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log('=== HISTORIA ENCONTRADA ===');
      console.log('ID:', doc.id);
      console.log('Título:', data.title);
      console.log('Email:', data.email);
      console.log('Creado:', data.createdAt?.toDate?.() || 'No disponible');
      console.log('Audio temporal (base64):', data.tempAudioData ? `Sí (${data.tempAudioData.length} chars)` : 'No');
      console.log('Audio temporal (path):', data.tempAudioPath || 'No');
      console.log('Audio publicado:', data.audioUrl || 'No');
      console.log('Publicado:', data.published || false);
      
      // Analizar el audio base64 si existe
      if (data.tempAudioData) {
        try {
          const buffer = Buffer.from(data.tempAudioData, 'base64');
          console.log('Tamaño del buffer:', buffer.length, 'bytes');
          
          const firstBytes = buffer.slice(0, 8);
          console.log('Primeros 8 bytes (hex):', firstBytes.toString('hex').toUpperCase());
          
          const lastBytes = buffer.slice(-8);
          console.log('Últimos 8 bytes (hex):', lastBytes.toString('hex').toUpperCase());
          
          // Detectar si se corta abruptamente (no termina correctamente)
          const lastBytesHex = lastBytes.toString('hex').toUpperCase();
          if (!lastBytesHex.includes('FF') && !lastBytesHex.includes('00')) {
            console.log('⚠️ POSIBLE AUDIO CORTADO: No termina con bytes típicos de fin de MP3');
          }
          
        } catch (error) {
          console.log('Error analizando audio:', error.message);
        }
      }
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  process.exit(0);
}

findStory(); 