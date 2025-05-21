// utils/helpers.js
exports.constructPrompt = (params) => {
    const { topic, length, storyType, creativityLevel, ageGroup, childNames, englishLevel, spanishLevel, language } = params;
    
    let lengthDescription;
    if (language === 'en') {
      switch (length) {
        case 'short': 
          lengthDescription = 'very short (exactly 100 words)';
          break;
        case 'medium': 
          lengthDescription = 'medium length (exactly 600 words)';
          break;
        case 'long': 
          lengthDescription = 'long (exactly 900 words)';
          break;
        default: 
          lengthDescription = 'medium length (600 words)';
      }
    } else {
      switch (length) {
        case 'short': 
        case 'corto': 
          lengthDescription = 'muy corta (exactamente 100 palabras)';
          break;
        case 'medium': 
        case 'medio': 
          lengthDescription = 'de longitud media (exactamente 600 palabras)';
          break;
        case 'long': 
        case 'largo': 
          lengthDescription = 'larga (exactamente 900 palabras)';
          break;
        default: 
          lengthDescription = 'de longitud media (600 palabras)';
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
    if (language === 'en' && englishLevel) {
      // Detailed English level instructions
      switch (englishLevel) {
        case 'basic':
          englishLevelInstruction = `\nUse BASIC ENGLISH (A1-A2 level) with these strict rules:
- Use only the 500 most common English words
- Keep sentences very short (3-6 words)
- Use only simple present and simple past tenses
- Avoid phrasal verbs, idioms, or slang
- Use simple sentence structures (subject + verb + object)
- Repeat key vocabulary frequently
- Use basic conjunctions only (and, but, or)
- Keep paragraphs short (2-3 sentences maximum)`;
          break;
        case 'intermediate':
          englishLevelInstruction = `\nUse INTERMEDIATE ENGLISH (B1-B2 level) with these guidelines:
- Use common vocabulary (2000-3000 most frequent words)
- Include some descriptive adjectives and adverbs
- Use basic tenses (present, past, future, present perfect)
- Include some compound and complex sentences
- Use common phrasal verbs and idiomatic expressions
- Keep sentences moderate in length (8-12 words average)
- Use connectors to link ideas (however, therefore, because)
- Include some conditional sentences (first and second conditional)`;
          break;
        case 'advanced':
          englishLevelInstruction = `\nUse ADVANCED ENGLISH (C1-C2 level) with these characteristics:
- Use rich and varied vocabulary, including less common words
- Include sophisticated language features (metaphors, analogies)
- Use all tense forms, including perfect continuous and conditionals
- Vary sentence structure and length intentionally for effect
- Use advanced discourse markers and cohesive devices
- Include colloquialisms and idiomatic expressions where appropriate
- Use nuanced language that conveys subtle meaning
- Demonstrate mastery of complex grammatical structures`;
          break;
        default:
          englishLevelInstruction = `\nUse intermediate level English vocabulary and grammar.`;
      }
    } else if (language === 'es' && englishLevel) {
      // Para historias en español, no incluir instrucciones de nivel de inglés
      // que afecten a toda la historia - la historia principal debe estar en español
      englishLevelInstruction = '';
    }
    
    // Add Spanish level instructions
    let spanishLevelInstruction = '';
    if (spanishLevel) {
      if (language === 'en') {
        // English reference to Spanish level
        switch (spanishLevel) {
          case 'basic':
            spanishLevelInstruction = `\nUse BASIC SPANISH (A1-A2 level) with these strict rules:
- Use only the 300 most common Spanish words
- Sentences must be very short (2-5 words maximum)
- Use only present tense (no past or future tenses)
- No subjunctive or conditional forms
- Only use "ser", "estar", "tener" and "hacer" as auxiliary verbs
- No subordinate clauses or complex structures
- No idiomatic expressions or metaphors
- Repetitive vocabulary and simple sentence patterns
- Text should resemble language for absolute beginners`;
            break;
          case 'intermediate':
            spanishLevelInstruction = `\nUse INTERMEDIATE SPANISH (B1-B2 level) with these guidelines:
- Use common vocabulary (1000-2000 most frequent words)
- Include descriptive adjectives and some adverbs
- Use present, past (preterite and imperfect) and simple future tenses
- Begin using present perfect tense occasionally
- Include basic compound sentences with conjunctions
- Use some common expressions (pero no demasiadas)
- Keep sentences moderate in length (6-10 words average)
- Use basic connectors (además, sin embargo, porque)
- Include occasional simple subjunctive forms`;
            break;
          case 'advanced':
            spanishLevelInstruction = `\nUse ADVANCED SPANISH (C1-C2 level) with these characteristics:
- Use rich and varied vocabulary, including less common words
- Include sophisticated language features (metaphors, analogies)
- Use all tense forms, including subjunctive and conditional forms
- Vary sentence structure and length intentionally for effect
- Use advanced discourse markers and cohesive devices
- Include colloquialisms and idiomatic expressions where appropriate
- Use nuanced language that conveys subtle meaning
- Demonstrate mastery of complex grammatical structures`;
            break;
          default:
            spanishLevelInstruction = `\nUse intermediate level Spanish vocabulary and grammar.`;
        }
      } else {
        // Spanish instructions for Spanish levels
        switch (spanishLevel) {
          case 'basic':
            spanishLevelInstruction = `\nUsa ESPAÑOL BÁSICO (nivel A1-A2) con estas reglas estrictas:
- Utiliza solo las 300 palabras más comunes del español
- Oraciones muy cortas (máximo 2-5 palabras)
- Usa solamente el tiempo presente (no pasado ni futuro)
- No uses subjuntivo ni condicional
- Solo verbos auxiliares "ser", "estar", "tener" y "hacer"
- Sin oraciones subordinadas ni estructuras complejas
- Sin expresiones idiomáticas ni metáforas
- Vocabulario repetitivo y patrones de oraciones simples
- El texto debe parecerse al lenguaje para principiantes absolutos`;
            break;
          case 'intermediate':
            spanishLevelInstruction = `\nUsa ESPAÑOL INTERMEDIO (nivel B1-B2) con estas pautas:
- Utiliza vocabulario común (1000-2000 palabras más frecuentes)
- Incluye adjetivos descriptivos y algunos adverbios
- Usa presente, pasado (pretérito e imperfecto) y futuro simple
- Comienza a usar el pretérito perfecto ocasionalmente
- Incluye oraciones compuestas básicas con conjunciones
- Usa algunas expresiones comunes (pero no demasiadas)
- Mantén las oraciones de longitud moderada (promedio de 6-10 palabras)
- Usa conectores básicos (además, sin embargo, porque)
- Incluye ocasionalmente formas simples de subjuntivo`;
            break;
          case 'advanced':
            spanishLevelInstruction = `\nUsa ESPAÑOL AVANZADO (nivel C1-C2) con estas características:
- Utiliza vocabulario rico y variado, incluyendo palabras menos comunes
- Incluye características lingüísticas sofisticadas (metáforas, analogías)
- Usa todas las formas verbales, incluyendo subjuntivo y formas condicionales
- Varía la estructura y longitud de las oraciones intencionalmente para lograr efectos
- Usa marcadores discursivos avanzados y dispositivos cohesivos
- Incluye coloquialismos y expresiones idiomáticas cuando sea apropiado
- Usa lenguaje matizado que transmita significados sutiles
- Demuestra dominio de estructuras gramaticales complejas`;
            break;
          default:
            spanishLevelInstruction = `\nUsa vocabulario y gramática de español de nivel intermedio.`;
        }
      }
    }
    
    // Si estamos en idioma español y hay un nivel de inglés,
    // añadir instrucción de que la historia principal debe estar en español
    let languageInstruction = '';
    if (language === 'es' && englishLevel) {
      languageInstruction = `\nIMPORTANTE: La historia completa debe estar en ESPAÑOL. No escribas la historia en inglés.`;
    }
    
    const levelInstructions = englishLevelInstruction + spanishLevelInstruction + languageInstruction;
    
    if (language === 'en') {
      return `Create a story with the following structure:

[Write a creative, engaging, and short title here. Do not include any labels or asterisks.]

Write a ${lengthDescription} ${storyType} story about "${topic}". 
The story should be appropriate for ${ageDescription}.${namesInstruction}${levelInstructions}
Use an engaging narrative style, with interesting characters and a coherent plot development.
Include dialogues and descriptions where appropriate.
The story should have a clear beginning, development, and conclusion.
IMPORTANT: The story must be exactly ${length === 'short' ? '100' : length === 'medium' ? '600' : '900'} words.`;
    } else {
      return `Crea una historia con la siguiente estructura:

[Escribe un título creativo, atractivo y corto aquí. No incluyas etiquetas ni asteriscos.]

Escribe una historia ${lengthDescription} de género ${storyType} sobre "${topic}". 
La historia debe ser apropiada para ${ageDescription}.${namesInstruction}${levelInstructions}
Usa un estilo narrativo atractivo, con personajes interesantes y un desarrollo coherente de la trama.
Incluye diálogos y descripciones donde sea apropiado.
La historia debe tener un inicio, desarrollo y conclusión claros.
IMPORTANTE: La historia debe tener exactamente ${length === 'short' || length === 'corto' ? '100' : length === 'medium' || length === 'medio' ? '600' : '900'} palabras.`;
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