console.log('🎭 Testing pausas en diálogos...\n');

const dialogueTests = [
  'Pedro dijo: "¡Hola mundo!" y siguió caminando.',
  '"Buenos días", saludó María alegremente.',
  'El niño gritó "¡Socorro!" desde la ventana.',
  '"¿Cómo estás?" preguntó su madre. "Muy bien", respondió Pedro.',
  'Era un día soleado. "Vamos al parque", sugirió Ana.'
];

// Simular el procesamiento de diálogos
function testDialogueProcessing(text) {
  console.log(`📝 Texto original: "${text}"`);
  
  // Aplicar el procesamiento actual de diálogos
  let processedText = text.replace(/"([^"]+)"/g, (match, dialogue) => {
    // Solo una pausa muy corta antes del diálogo, no después
    return `<break time="0.3s"/><prosody rate="1.02" pitch="+0.2st">"${dialogue}"</prosody>`;
  });
  
  console.log(`🎛️ Texto procesado: "${processedText}"`);
  
  // Contar pausas en diálogos
  const dialoguePauses = (processedText.match(/<break time="0\.3s"\/>/g) || []).length;
  console.log(`⏸️ Pausas de diálogo: ${dialoguePauses}`);
  console.log('---');
  
  return processedText;
}

console.log('🧪 === PRUEBAS DE DIÁLOGOS ===\n');

dialogueTests.forEach((test, index) => {
  console.log(`Test ${index + 1}:`);
  testDialogueProcessing(test);
  console.log('');
});

console.log('✅ === RESULTADO ===');
console.log('🎯 Pausas más sutiles: Solo 0.3s antes del diálogo');
console.log('🎭 Entonación sutil: rate="1.02" pitch="+0.2st"');
console.log('🚫 Sin pausas después del diálogo');
console.log('✨ Flujo más natural en los diálogos'); 