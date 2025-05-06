// utils/helpers.js
exports.constructPrompt = (params) => {
    const { topic, length, storyType, creativityLevel, ageGroup, childNames, englishLevel, language } = params;
    
    let lengthDescription;
    if (language === 'en') {
      switch (length) {
        case 'short': 
          lengthDescription = 'very short (exactly 100 words)';
          break;
        case 'medium': 
          lengthDescription = 'medium length (exactly 300 words)';
          break;
        case 'long': 
          lengthDescription = 'long (exactly 600 words)';
          break;
        default: 
          lengthDescription = 'medium length (300 words)';
      }
    } else {
      switch (length) {
        case 'corto': 
          lengthDescription = 'muy corta (exactamente 100 palabras)';
          break;
        case 'medio': 
          lengthDescription = 'de longitud media (exactamente 300 palabras)';
          break;
        case 'largo': 
          lengthDescription = 'larga (exactamente 600 palabras)';
          break;
        default: 
          lengthDescription = 'de longitud media (300 palabras)';
      }
    }
    
    let ageDescription;
    if (language === 'en') {
      switch (ageGroup) {
        case '3-6': ageDescription = 'children aged 3 to 6'; break;
        case '7-13': ageDescription = 'children aged 7 to 13'; break;
        case '13-20': ageDescription = 'teenagers aged 13 to 20'; break;
        case '21-35': ageDescription = 'young adults'; break;
        case '35+': ageDescription = 'adults'; break;
        default: ageDescription = 'all audiences'; break;
      }
    } else {
      switch (ageGroup) {
        case '3-6': ageDescription = 'niños de 3 a 6 años'; break;
        case '7-13': ageDescription = 'niños de 7 a 13 años'; break;
        case '13-20': ageDescription = 'adolescentes de 13 a 20 años'; break;
        case '21-35': ageDescription = 'adultos jóvenes'; break;
        case '35+': ageDescription = 'adultos'; break;
        default: ageDescription = 'todo público'; break;
      }
    }

    let namesInstruction = '';
    if (childNames && childNames.trim()) {
      const namesList = childNames.split(',').map(name => name.trim()).filter(name => name);
      if (namesList.length > 0) {
        namesInstruction = language === 'en'
          ? `\nThe main characters should be named: ${namesList.join(', ')}.`
          : `\nLos personajes principales deben llamarse: ${namesList.join(', ')}.`;
      }
    }

    let englishLevelInstruction = '';
    if (language === 'en') {
      switch (englishLevel) {
        case 'basic':
          englishLevelInstruction = `
IMPORTANT: Use ONLY these words in English:
- Verbs: be, have, do, say, get, make, go, know, take, see, come, think, look, want, give, use, find, tell, ask, work, seem, feel, try, leave, call
- Pronouns: I, you, he, she, it, we, they
- Articles: a, an, the

STRICT RULES:
1. Use ONLY simple present tense (I go, you see, he likes)
2. Maximum 3 words per sentence
3. No contractions (use "do not" not "don't")
4. No adjectives or adverbs
5. No idioms or expressions
6. No past or future tense
7. No questions
8. No complex sentences

Example of how it should be:
"I see a cat. The cat is big. I like the cat. The cat likes me."

DO NOT use sentences like:
"I was walking in the park (past tense)
The beautiful cat runs quickly (adjectives and adverbs)
I don't like cats (contraction)
What do you see? (question)
The cat that I like is big (complex sentence)"`;
          break;
        case 'intermediate':
          englishLevelInstruction = `
Use intermediate vocabulary (B1-B2 level) with these characteristics:
- You can use all basic verb tenses (present, past, future)
- You can use common adverbs (quickly, slowly, well, badly)
- You can use some common idiomatic expressions
- You can use longer phrases (up to 10 words)
- You can use contractions (I'm, don't, can't)
- You can use more descriptive adjectives

Example of intermediate level:
"I was walking in the park when I saw a beautiful butterfly. It was flying quickly from flower to flower. I wanted to take a picture, but my phone was at home."`;
          break;
        case 'advanced':
          englishLevelInstruction = `
Use advanced vocabulary (C1-C2 level) with these characteristics:
- Use all verb tenses, including perfect and continuous forms
- Use idiomatic expressions and idioms
- Use complex and subordinate phrases
- Use sophisticated and specific vocabulary
- Use figurative language and metaphors
- Use different language styles according to context

Example of advanced level:
"As the golden rays of the setting sun cast long shadows across the meadow, a kaleidoscope of butterflies danced in the crisp autumn air, their delicate wings creating a mesmerizing spectacle of color and motion."`;
          break;
        default:
          englishLevelInstruction = '\nUse intermediate English vocabulary.';
      }
    } else {
      switch (englishLevel) {
        case 'basic':
          englishLevelInstruction = `
IMPORTANTE: Usa SOLO estas palabras en inglés:
- Verbos: be, have, do, say, get, make, go, know, take, see, come, think, look, want, give, use, find, tell, ask, work, seem, feel, try, leave, call
- Pronombres: I, you, he, she, it, we, they
- Artículos: a, an, the

REGLAS ESTRICTAS:
1. Usa SOLO el presente simple (I go, you see, he likes)
2. Máximo 3 palabras por frase
3. No uses contracciones (usa "do not" no "don't")
4. No uses adjetivos ni adverbios
5. No uses modismos ni expresiones
6. No uses pasado ni futuro
7. No uses preguntas
8. No uses oraciones complejas

Ejemplo de cómo debe ser:
"I see a cat. The cat is big. I like the cat. The cat likes me."

NO uses frases como:
"I was walking in the park (pasado)
The beautiful cat runs quickly (adjetivos y adverbios)
I don't like cats (contracción)
What do you see? (pregunta)
The cat that I like is big (oración compleja)"`;
          break;
        case 'intermediate':
          englishLevelInstruction = `
Usa un vocabulario intermedio (nivel B1-B2) con estas características:
- Puedes usar todos los tiempos verbales básicos (presente, pasado, futuro)
- Puedes usar adverbios comunes (quickly, slowly, well, badly)
- Puedes usar algunas expresiones idiomáticas comunes
- Puedes usar frases más largas (hasta 10 palabras)
- Puedes usar contracciones (I'm, don't, can't)
- Puedes usar adjetivos más descriptivos

Ejemplo de nivel intermedio:
"I was walking in the park when I saw a beautiful butterfly. It was flying quickly from flower to flower. I wanted to take a picture, but my phone was at home."`;
          break;
        case 'advanced':
          englishLevelInstruction = `
Usa un vocabulario avanzado (nivel C1-C2) con estas características:
- Usa todos los tiempos verbales, incluyendo perfectos y continuos
- Usa expresiones idiomáticas y modismos
- Usa frases complejas y subordinadas
- Usa vocabulario sofisticado y específico
- Usa lenguaje figurativo y metáforas
- Usa diferentes estilos de lenguaje según el contexto

Ejemplo de nivel avanzado:
"As the golden rays of the setting sun cast long shadows across the meadow, a kaleidoscope of butterflies danced in the crisp autumn air, their delicate wings creating a mesmerizing spectacle of color and motion."`;
          break;
        default:
          englishLevelInstruction = '\nUsa un vocabulario intermedio en inglés.';
      }
    }
    
    if (language === 'en') {
      return `Create a story with the following structure:

[Write a creative, engaging, and short title here. Do not include any labels or asterisks.]

Write a ${lengthDescription} ${storyType} story about "${topic}". 
The story should be appropriate for ${ageDescription}.${namesInstruction}${englishLevelInstruction}
Use an engaging narrative style, with interesting characters and a coherent plot development.
Include dialogues and descriptions where appropriate.
The story should have a clear beginning, development, and conclusion.
IMPORTANT: The story must be exactly ${length === 'short' ? '100' : length === 'medium' ? '300' : '600'} words.`;
    } else {
      return `Crea una historia con la siguiente estructura:

[Escribe un título creativo, atractivo y corto aquí. No incluyas etiquetas ni asteriscos.]

Escribe una historia ${lengthDescription} de género ${storyType} sobre "${topic}". 
La historia debe ser apropiada para ${ageDescription}.${namesInstruction}${englishLevelInstruction}
Usa un estilo narrativo atractivo, con personajes interesantes y un desarrollo coherente de la trama.
Incluye diálogos y descripciones donde sea apropiado.
La historia debe tener un inicio, desarrollo y conclusión claros.
IMPORTANTE: La historia debe tener exactamente ${length === 'corto' ? '100' : length === 'medio' ? '300' : '600'} palabras.`;
    }
  };
  
  exports.extractTitle = (content, fallbackTopic, language = 'es') => {
    // Try to find the title in the first line
    const lines = content.split('\n');
    const firstLine = lines[0].trim();
    
    // Remove any asterisks, "Título:" or "Title:" prefix, and clean up
    const cleanTitle = firstLine
      .replace(/[*]+/g, '') // Remove all asterisks
      .replace(/^(?:Título:|Title:)\s*/i, '') // Remove "Título:" or "Title:" prefix
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .trim();
    
    // Clean the content of asterisks
    const cleanContent = content
      .replace(/[*]+/g, '') // Remove all asterisks
      .replace(/^(?:Título:|Title:)\s*/i, '') // Remove "Título:" or "Title:" prefix
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .trim();
    
    if (cleanTitle.length < 60 && !cleanTitle.match(/[.,:;?!]$/)) {
      return {
        title: cleanTitle,
        content: cleanContent
      };
    }
    
    // If we still can't find a good title, generate a creative one based on the topic
    const creativeTitle = language === 'en' 
      ? `The ${fallbackTopic} Adventure`
      : `La Aventura de ${fallbackTopic}`;
    
    return {
      title: creativeTitle,
      content: cleanContent
    };
  };