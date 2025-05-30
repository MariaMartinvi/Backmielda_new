console.log('📚 Testing entonación descendente de títulos...\n');

const titleTests = [
  'CAPÍTULO 1: LA AVENTURA COMIENZA',
  'CHAPTER 2: THE GREAT DISCOVERY',
  'EL BOSQUE MISTERIOSO',
  'LA GRAN REVELACIÓN',
  'CAPÍTULO FINAL: EL REGRESO A CASA'
];

// Simular el procesamiento actual de títulos
function testTitleProcessing(title) {
  console.log(`📝 Título original: "${title}"`);
  
  // Detectar si es un título
  const isChapterTitle = /^[A-ZÁÉÍÓÚÑÜÇ][A-ZÁÉÍÓÚÑÜÇ\s]+$/.test(title) || 
                        /^CAPÍTULO\s+\d+/i.test(title) ||
                        /^CHAPTER\s+\d+/i.test(title);
  
  if (isChapterTitle) {
    // Aplicar la nueva entonación descendente marcada
    const processedTitle = `<break time="2.5s"/><prosody rate="0.8" pitch="-4st" volume="medium" contour="(0%,+1st) (70%,-2st) (100%,-6st)">${title}</prosody><break time="2.5s"/>`;
    console.log(`🎛️ SSML generado: "${processedTitle}"`);
    
    console.log('🎯 Características de entonación:');
    console.log('   📉 Pitch inicial: -4st (más bajo)');
    console.log('   📈 Contour: Empieza +1st, baja a -2st, termina en -6st');
    console.log('   🐌 Rate: 0.8 (más lento para mayor dramatismo)');
    console.log('   🔊 Volume: medium (nivel adecuado)');
    console.log('   ⏸️ Pausas: 2.5s antes y después');
  } else {
    console.log('❌ No detectado como título');
  }
  
  console.log('---');
}

console.log('🧪 === PRUEBAS DE TÍTULOS CON ENTONACIÓN DESCENDENTE ===\n');

titleTests.forEach((test, index) => {
  console.log(`Test ${index + 1}:`);
  testTitleProcessing(test);
  console.log('');
});

console.log('✅ === RESULTADO ===');
console.log('📉 Entonación marcadamente descendente');
console.log('🎭 Contour que simula una declaración firme');
console.log('⏳ Más lento para mayor impacto');
console.log('🔚 Termina como un punto final definitivo');

console.log('\n🎯 === EXPLICACIÓN DEL CONTOUR ===');
console.log('• 0%: +1st  -> Empieza ligeramente alto');
console.log('• 70%: -2st -> Baja progresivamente'); 
console.log('• 100%: -6st -> Termina muy bajo (punto final)');
console.log('• Resultado: Entonación descendente natural y definitiva'); 