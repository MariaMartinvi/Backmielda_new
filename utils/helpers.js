// utils/helpers.js
exports.constructPrompt = (storyParams) => {
  const {
    topic,
    storyLength = 'medium',
    storyType = 'original',
    creativityLevel = 'innovative',
    ageGroup = 'default',
    childNames = '',
    englishLevel = 'intermediate',
    spanishLevel = 'es',
    language = 'es'
  } = storyParams;

  // Mapeo de longitudes según el idioma
  const lengthMap = {
    es: {
      short: 'corta (300 palabras)',
      medium: 'media (600 palabras)',
      long: 'larga (900 palabras)'
    },
    en: {
      short: 'short (300 words)',
      medium: 'medium (600 words)',
      long: 'long (900 words)'
    },
    de: {
      short: 'kurz (300 Wörter)',
      medium: 'mittel (600 Wörter)',
      long: 'lang (900 Wörter)'
    },
    fr: {
      short: 'courte (300 mots)',
      medium: 'moyenne (600 mots)',
      long: 'longue (900 mots)'
    },
    ca: {
      short: 'curta (300 paraules)',
      medium: 'mitjana (600 paraules)',
      long: 'llarga (900 paraules)'
    },
    it: {
      short: 'breve (300 parole)',
      medium: 'media (600 parole)',
      long: 'lunga (900 parole)'
    }
  };

  // Mapeo de audiencia según el idioma
  const audienceMap = {
    es: {
      default: 'todo público',
      children: 'niños',
      teens: 'adolescentes',
      adults: 'adultos'
    },
    en: {
      default: 'general audience',
      children: 'children',
      teens: 'teens',
      adults: 'adults'
    },
    de: {
      default: 'allgemeines Publikum',
      children: 'Kinder',
      teens: 'Jugendliche',
      adults: 'Erwachsene'
    },
    fr: {
      default: 'public général',
      children: 'enfants',
      teens: 'adolescents',
      adults: 'adultes'
    },
    ca: {
      default: 'públic general',
      children: 'nens',
      teens: 'adolescents',
      adults: 'adults'
    },
    it: {
      default: 'pubblico generale',
      children: 'bambini',
      teens: 'adolescenti',
      adults: 'adulti'
    }
  };

  // Mapeo de niveles de idioma
  const languageLevelMap = {
    es: {
      basic: 'básico',
      intermediate: 'intermedio',
      advanced: 'avanzado'
    },
    en: {
      basic: 'basic',
      intermediate: 'intermediate',
      advanced: 'advanced'
    },
    de: {
      basic: 'Grundstufe',
      intermediate: 'Mittelstufe',
      advanced: 'Fortgeschrittene'
    },
    fr: {
      basic: 'débutant',
      intermediate: 'intermédiaire',
      advanced: 'avancé'
    },
    ca: {
      basic: 'bàsic',
      intermediate: 'intermedi',
      advanced: 'avançat'
    },
    it: {
      basic: 'base',
      intermediate: 'intermedio',
      advanced: 'avanzato'
    }
  };

  // Mapeo de niveles de creatividad
  const creativityMap = {
    es: {
      standard: 'estándar',
      creative: 'creativa',
      innovative: 'innovadora'
    },
    en: {
      standard: 'standard',
      creative: 'creative',
      innovative: 'innovative'
    },
    de: {
      standard: 'Standard',
      creative: 'kreativ',
      innovative: 'innovativ'
    },
    fr: {
      standard: 'standard',
      creative: 'créative',
      innovative: 'innovante'
    },
    ca: {
      standard: 'estàndard',
      creative: 'creativa',
      innovative: 'innovadora'
    },
    it: {
      standard: 'standard',
      creative: 'creativa',
      innovative: 'innovativa'
    }
  };

  // Mapeo de tipos de historia según el idioma
  const storyTypeMap = {
    es: {
      'original': 'original',
      'adventure': 'de aventuras',
      'horror': 'de terror',
      'sci-fi': 'de ciencia ficción',
      'classic': 'clásico',
      'fantasy': 'fantástica',
      'humor': 'de humor'
    },
    en: {
      'original': 'original',
      'adventure': 'adventure',
      'horror': 'horror',
      'sci-fi': 'science fiction',
      'classic': 'classic',
      'fantasy': 'fantasy',
      'humor': 'humor'
    },
    de: {
      'original': 'original',
      'adventure': 'Abenteuer',
      'horror': 'Horror',
      'sci-fi': 'Science-Fiction',
      'classic': 'klassisch',
      'fantasy': 'Fantasy',
      'humor': 'Humor'
    },
    fr: {
      'original': 'originale',
      'adventure': 'd\'aventure',
      'horror': 'd\'horreur',
      'sci-fi': 'de science-fiction',
      'classic': 'classique',
      'fantasy': 'fantastique',
      'humor': 'd\'humour'
    },
    ca: {
      'original': 'original',
      'adventure': 'd\'aventures',
      'horror': 'de terror',
      'sci-fi': 'de ciència-ficció',
      'classic': 'clàssic',
      'fantasy': 'fantàstica',
      'humor': 'd\'humor'
    },
    it: {
      'original': 'originale',
      'adventure': 'd\'avventura',
      'horror': 'dell\'orrore',
      'sci-fi': 'di fantascienza',
      'classic': 'classico',
      'fantasy': 'fantastica',
      'humor': 'umoristico'
    }
  };

  // Instrucciones de idioma según el idioma seleccionado
  const languageInstructions = {
    es: 'Escribe la historia en español.',
    en: 'Write the story in English.',
    de: 'Schreibe die Geschichte auf Deutsch.',
    fr: 'Écrivez l\'histoire en français.',
    ca: 'Escriu la història en català.',
    it: 'Scrivi la storia in italiano.'
  };

  // Instrucciones de generación según el idioma
  const generationInstructions = {
    es: 'Escribe una historia',
    en: 'Write a story',
    de: 'Schreibe eine Geschichte',
    fr: 'Écrivez une histoire',
    ca: 'Escriu una història',
    it: 'Scrivi una storia'
  };

  // Preposiciones según el idioma
  const prepositions = {
    es: {
      about: 'sobre',
      for: 'para',
      with: 'con',
      level: 'nivel',
      creativity: 'creatividad'
    },
    en: {
      about: 'about',
      for: 'for',
      with: 'with',
      level: 'level',
      creativity: 'creativity'
    },
    de: {
      about: 'über',
      for: 'für',
      with: 'mit',
      level: 'Niveau',
      creativity: 'Kreativität'
    },
    fr: {
      about: 'sur',
      for: 'pour',
      with: 'avec',
      level: 'niveau',
      creativity: 'créativité'
    },
    ca: {
      about: 'sobre',
      for: 'per a',
      with: 'amb',
      level: 'nivell',
      creativity: 'creativitat'
    },
    it: {
      about: 'su',
      for: 'per',
      with: 'con',
      level: 'livello',
      creativity: 'creatività'
    }
  };

  const selectedLength = lengthMap[language]?.[storyLength] || lengthMap.es.medium;
  const selectedAudience = audienceMap[language]?.[ageGroup] || audienceMap.es.default;
  const selectedLevel = languageLevelMap[language]?.[englishLevel] || languageLevelMap.es.intermediate;
  const selectedCreativity = creativityMap[language]?.[creativityLevel] || creativityMap.es.innovative;
  const selectedType = storyTypeMap[language]?.[storyType] || storyTypeMap.es.original;
  const languageInstruction = languageInstructions[language] || languageInstructions.es;
  const generationInstruction = generationInstructions[language] || generationInstructions.es;
  const langPrepositions = prepositions[language] || prepositions.es;

  // Construir el prompt en el idioma seleccionado
  let prompt = `${languageInstruction}\n\n`;
  
  // Primera línea: tipo, longitud, tema y audiencia
  prompt += `${generationInstruction} ${selectedType} ${selectedLength} ${langPrepositions.about} "${topic}" ${langPrepositions.for} ${selectedAudience}.\n`;
  
  // Segunda línea: nivel de idioma y creatividad
  const levelAndCreativity = {
    es: {
      basic: `Usa un lenguaje muy simple y básico, con vocabulario limitado y frases cortas. Nivel A1-A2.`,
      intermediate: `Usa un lenguaje moderadamente complejo, con vocabulario variado y estructuras gramaticales intermedias. Nivel B1-B2.`,
      advanced: `Usa un lenguaje rico y sofisticado, con vocabulario extenso y estructuras gramaticales complejas. Nivel C1-C2.`
    },
    en: {
      basic: `Use very simple and basic language, with limited vocabulary and short sentences. A1-A2 level.`,
      intermediate: `Use moderately complex language, with varied vocabulary and intermediate grammatical structures. B1-B2 level.`,
      advanced: `Use rich and sophisticated language, with extensive vocabulary and complex grammatical structures. C1-C2 level.`
    },
    de: {
      basic: `Verwende sehr einfache und grundlegende Sprache, mit begrenztem Vokabular und kurzen Sätzen. A1-A2 Niveau.`,
      intermediate: `Verwende mäßig komplexe Sprache, mit vielfältigem Vokabular und mittleren grammatischen Strukturen. B1-B2 Niveau.`,
      advanced: `Verwende reiche und anspruchsvolle Sprache, mit umfangreichem Vokabular und komplexen grammatischen Strukturen. C1-C2 Niveau.`
    },
    fr: {
      basic: `Utilisez un langage très simple et basique, avec un vocabulaire limité et des phrases courtes. Niveau A1-A2.`,
      intermediate: `Utilisez un langage modérément complexe, avec un vocabulaire varié et des structures grammaticales intermédiaires. Niveau B1-B2.`,
      advanced: `Utilisez un langage riche et sophistiqué, avec un vocabulaire étendu et des structures grammaticales complexes. Niveau C1-C2.`
    },
    ca: {
      basic: `Utilitza un llenguatge molt simple i bàsic, amb vocabulari limitat i frases curtes. Nivell A1-A2.`,
      intermediate: `Utilitza un llenguatge moderadament complex, amb vocabulari variat i estructures gramaticals intermèdies. Nivell B1-B2.`,
      advanced: `Utilitza un llenguatge ric i sofisticat, amb vocabulari extens i estructures gramaticals complexes. Nivell C1-C2.`
    },
    it: {
      basic: `Usa un linguaggio molto semplice e basilare, con vocabolario limitato e frasi brevi. Livello A1-A2.`,
      intermediate: `Usa un linguaggio moderatamente complesso, con vocabolario vario e strutture grammaticali intermedie. Livello B1-B2.`,
      advanced: `Usa un linguaggio ricco e sofisticato, con vocabolario esteso e strutture grammaticali complesse. Livello C1-C2.`
    }
  };

  // Seleccionar el nivel de idioma correcto según el idioma seleccionado
  const languageLevel = language === 'en' ? englishLevel : 
                       language === 'es' ? spanishLevel : 
                       englishLevel; // Por defecto usamos englishLevel

  // Añadir la instrucción de nivel de idioma
  prompt += `${levelAndCreativity[language]?.[languageLevel] || levelAndCreativity.es.intermediate}\n`;
  
  // Añadir la instrucción de creatividad
  const creativityInstruction = {
    es: `La historia debe tener un nivel de creatividad ${selectedCreativity}.`,
    en: `The story should have a ${selectedCreativity} level of creativity.`,
    de: `Die Geschichte sollte ein ${selectedCreativity} Maß an Kreativität haben.`,
    fr: `L'histoire doit avoir un niveau de créativité ${selectedCreativity}.`,
    ca: `La història ha de tenir un nivell de creativitat ${selectedCreativity}.`,
    it: `La storia deve avere un livello di creatività ${selectedCreativity}.`
  };
  prompt += creativityInstruction[language] || creativityInstruction.es;

  // Añadir nombres de niños si se proporcionan
  if (childNames && childNames.trim()) {
    const namesInstruction = {
      es: 'Incluye a los siguientes niños en la historia:',
      en: 'Include the following children in the story:',
      de: 'Schließe die folgenden Kinder in die Geschichte ein:',
      fr: 'Incluez les enfants suivants dans l\'histoire:',
      ca: 'Inclou els següents nens a la història:',
      it: 'Includi i seguenti bambini nella storia:'
    };
    prompt += `\n${namesInstruction[language] || namesInstruction.es} ${childNames}.`;
  }

  console.log('🌍 Language selected:', language);
  console.log('🔍 Generated prompt:', prompt);

  return prompt;
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
  
  // Si no encontramos un título válido, generamos uno basado en el tema y el idioma
  const titlePrefixes = {
    es: {
      story: 'El Cuento de',
      adventure: 'La Aventura de',
      tale: 'La Historia de'
    },
    en: {
      story: 'The Story of',
      adventure: 'The Adventure of',
      tale: 'The Tale of'
    },
    de: {
      story: 'Die Geschichte von',
      adventure: 'Das Abenteuer von',
      tale: 'Die Erzählung von'
    },
    fr: {
      story: 'L\'Histoire de',
      adventure: 'L\'Aventure de',
      tale: 'Le Conte de'
    },
    ca: {
      story: 'El Conte de',
      adventure: 'L\'Aventura de',
      tale: 'La Història de'
    },
    it: {
      story: 'La Storia di',
      adventure: 'L\'Avventura di',
      tale: 'Il Racconto di'
    }
  };

  // Seleccionar el prefijo apropiado según el idioma
  const prefixes = titlePrefixes[language] || titlePrefixes.es;
  const prefix = prefixes.story; // Por defecto usamos "story"

  // Limpiar el tema para el título
  const cleanTopic = fallbackTopic
    .replace(/^["']|["']$/g, '') // Remove surrounding quotes
    .trim();

  return {
    title: `${prefix} ${cleanTopic}`,
    content: cleanContent
  };
};