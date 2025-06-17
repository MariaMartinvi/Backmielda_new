const { db } = require('./config/firebase');
const admin = require('firebase-admin');

async function checkSpecificAudio() {
  try {
    console.log('🔍 Verificando audio específico de "Hiria konkistatzen duen usoa"...\n');
    
    // Obtener la historia específica
    const doc = await db.collection('stories').doc('IQOWG6maLShLf8ov93jh').get();
    
    if (!doc.exists) {
      console.log('❌ Historia no encontrada');
      return;
    }
    
    const data = doc.data();
    console.log('=== DATOS DE LA HISTORIA ===');
    console.log('ID:', doc.id);
    console.log('Título:', data.title);
    console.log('AudioPath:', data.audioPath);
    console.log('ImagePath:', data.imagePath);
    console.log('TextPath:', data.textPath);
    console.log('Publicado:', data.published);
    console.log('');
    
    if (data.audioPath) {
      console.log('🎵 ANALIZANDO ARCHIVO DE AUDIO...');
      console.log('Ruta:', data.audioPath);
      
      try {
        // Obtener el bucket de Firebase Storage
        const bucket = admin.storage().bucket();
        const file = bucket.file(data.audioPath);
        
        // Verificar si existe
        const [exists] = await file.exists();
        console.log('Existe en storage:', exists);
        
        if (exists) {
          // Obtener metadatos
          const [metadata] = await file.getMetadata();
          console.log('Tamaño:', metadata.size, 'bytes');
          console.log('Tipo:', metadata.contentType);
          console.log('Creado:', metadata.timeCreated);
          console.log('Actualizado:', metadata.updated);
          
          // Descargar el archivo para analizarlo
          console.log('\n🔍 DESCARGANDO Y ANALIZANDO CONTENIDO...');
          const [audioBuffer] = await file.download();
          
          console.log('Buffer size:', audioBuffer.length, 'bytes');
          
          // Analizar cabeceras
          const firstBytes = audioBuffer.slice(0, 10);
          console.log('Primeros 10 bytes (hex):', firstBytes.toString('hex').toUpperCase());
          
          const lastBytes = audioBuffer.slice(-10);
          console.log('Últimos 10 bytes (hex):', lastBytes.toString('hex').toUpperCase());
          
          // Verificar cabecera MP3
          const hexString = firstBytes.toString('hex').toUpperCase();
          if (hexString.startsWith('FF') || hexString.includes('494433')) {
            console.log('✅ Cabecera MP3 válida');
          } else {
            console.log('❌ Cabecera MP3 inválida');
          }
          
          // Buscar marcos MP3 para detectar si está cortado
          console.log('\n🔍 BUSCANDO MARCOS MP3...');
          let mp3Frames = 0;
          let lastFramePosition = -1;
          
          for (let i = 0; i < audioBuffer.length - 1; i++) {
            if (audioBuffer[i] === 0xFF && (audioBuffer[i + 1] & 0xE0) === 0xE0) {
              mp3Frames++;
              lastFramePosition = i;
              if (mp3Frames <= 5) { // Solo mostrar los primeros 5
                console.log(`Marco ${mp3Frames} encontrado en posición ${i}`);
              }
            }
          }
          
          console.log(`Total de marcos MP3 encontrados: ${mp3Frames}`);
          console.log(`Último marco en posición: ${lastFramePosition}`);
          
          // Verificar si está cortado abruptamente
          const distanceFromEnd = audioBuffer.length - lastFramePosition;
          console.log(`Distancia del último marco al final: ${distanceFromEnd} bytes`);
          
          if (distanceFromEnd > 1000) {
            console.log('🚨 POSIBLE AUDIO CORTADO: El último marco está muy lejos del final');
          }
          
          // Verificar si termina con silencio/padding
          const silentBytes = lastBytes.filter(b => b === 0x00).length;
          console.log(`Bytes silenciosos al final: ${silentBytes}/10`);
          
          if (silentBytes < 3 && distanceFromEnd > 100) {
            console.log('⚠️ POSIBLE CORTE ABRUPTO: No termina con silencio');
          }
          
          // Estimar duración esperada vs real
          if (mp3Frames > 0) {
            const estimatedDuration = mp3Frames * 0.026; // ~26ms por marco
            console.log(`Duración estimada: ${estimatedDuration.toFixed(2)} segundos`);
            
            if (estimatedDuration < 10) {
              console.log('🚨 AUDIO MUY CORTO: Probablemente cortado');
            }
          }
          
        } else {
          console.log('❌ El archivo no existe en Firebase Storage');
        }
        
      } catch (error) {
        console.log('❌ Error verificando audio:', error.message);
      }
    } else {
      console.log('❌ No hay audioPath en esta historia');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  process.exit(0);
}

checkSpecificAudio(); 