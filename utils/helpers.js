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
    },
    gl: {
      short: 'curta (300 palabras)',
      medium: 'media (600 palabras)',
      long: 'longa (900 palabras)'
    },
    eu: {
      short: 'laburra (300 hitz)',
      medium: 'ertaina (600 hitz)',
      long: 'luzea (900 hitz)'
    },
    pt: {
      short: 'curta (300 palavras)',
      medium: 'média (600 palavras)',
      long: 'longa (900 palavras)'
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
    },
    gl: {
      default: 'todo o público',
      children: 'nenos',
      teens: 'adolescentes',
      adults: 'adultos'
    },
    eu: {
      default: 'publiko orokorra',
      children: 'haurrak',
      teens: 'nerabeak',
      adults: 'helduak'
    },
    pt: {
      default: 'público geral',
      children: 'crianças',
      teens: 'adolescentes',
      adults: 'adultos'
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
      advanced: 'Fortgeschritten'
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
    },
    gl: {
      basic: 'básico',
      intermediate: 'intermedio',
      advanced: 'avanzado'
    },
    eu: {
      basic: 'hasiberria',
      intermediate: 'ertaina',
      advanced: 'aurreratua'
    },
    pt: {
      basic: 'básico',
      intermediate: 'intermediário',
      advanced: 'avançado'
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
    },
    gl: {
      standard: 'estándar',
      creative: 'creativa',
      innovative: 'innovadora'
    },
    eu: {
      standard: 'estandarra',
      creative: 'sortzailea',
      innovative: 'berritzailea'
    },
    pt: {
      standard: 'padrão',
      creative: 'criativa',
      innovative: 'inovadora'
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
    },
    gl: {
      'original': 'orixinal',
      'adventure': 'de aventuras',
      'horror': 'de terror',
      'sci-fi': 'de ciencia ficción',
      'classic': 'clásico',
      'fantasy': 'fantástica',
      'humor': 'de humor'
    },
    eu: {
      'original': 'jatorrizkoa',
      'adventure': 'abentura',
      'horror': 'beldurrezkoa',
      'sci-fi': 'zientzia-fikzioa',
      'classic': 'klasikoa',
      'fantasy': 'fantastikoa',
      'humor': 'umorezkoa'
    },
    pt: {
      'original': 'original',
      'adventure': 'de aventura',
      'horror': 'de terror',
      'sci-fi': 'de ficção científica',
      'classic': 'clássico',
      'fantasy': 'fantástica',
      'humor': 'de humor'
    }
  };

  // Instrucciones de idioma según el idioma seleccionado
  const languageInstructions = {
    es: 'en español',
    en: 'in English',
    de: 'auf Deutsch',
    fr: 'en français',
    ca: 'en català',
    it: 'in italiano',
    gl: 'en galego',
    eu: 'euskaraz',
    pt: 'em português'
  };

  // Instrucciones de generación según el idioma
  const generationInstructions = {
    es: 'Escribe una historia',
    en: 'Write a story',
    de: 'Schreibe eine Geschichte',
    fr: 'Écrivez une histoire',
    ca: 'Escriu una història',
    it: 'Scrivi una storia',
    gl: 'Escribe unha historia',
    eu: 'Ipuin bat idatzi',
    pt: 'Escreva uma história'
  };

  // Texto de generación según el idioma
  const generatingText = {
    es: 'Generando',
    en: 'Generating',
    de: 'Generiere',
    fr: 'Génération',
    ca: 'Generant',
    it: 'Generazione',
    gl: 'Xerando',
    eu: 'Sortzen',
    pt: 'Gerando'
  };

  // Preposiciones según el idioma
  const prepositions = {
    es: {
      in: 'en',
      with: 'con',
      for: 'para'
    },
    en: {
      in: 'in',
      with: 'with',
      for: 'for'
    },
    de: {
      in: 'in',
      with: 'mit',
      for: 'für'
    },
    fr: {
      in: 'en',
      with: 'avec',
      for: 'pour'
    },
    ca: {
      in: 'en',
      with: 'amb',
      for: 'per'
    },
    it: {
      in: 'in',
      with: 'con',
      for: 'per'
    },
    gl: {
      in: 'en',
      with: 'con',
      for: 'para'
    },
    eu: {
      in: '-n',
      with: 'rekin',
      for: 'arentzat'
    },
    pt: {
      in: 'em',
      with: 'com',
      for: 'para'
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

  // Mensajes de niveles de idioma según el idioma
  const languageLevelsMessage = {
    es: {
      title: 'Niveles de Idioma Adaptados',
      description: 'Cuentos adaptados a diferentes niveles de dominio del idioma, desde principiante hasta avanzado'
    },
    en: {
      title: 'Adapted Language Levels',
      description: 'Stories adapted to different language proficiency levels, from beginner to advanced'
    },
    de: {
      title: 'Angepasste Sprachniveaus',
      description: 'Geschichten, die an verschiedene Sprachniveaus angepasst sind, von Anfänger bis Fortgeschritten'
    },
    fr: {
      title: 'Niveaux de Langue Adaptés',
      description: 'Histoires adaptées à différents niveaux de maîtrise de la langue, du débutant au avancé'
    },
    ca: {
      title: 'Nivells d\'Idioma Adaptats',
      description: 'Contes adaptats a diferents nivells de domini de l\'idioma, des de principiant fins a avançat'
    },
    it: {
      title: 'Livelli di Lingua Adattati',
      description: 'Storie adattate a diversi livelli di competenza linguistica, dal principiante all\'avanzato'
    },
    gl: {
      title: 'Niveis de Idioma Adaptados',
      description: 'Contos adaptados a diferentes niveis de dominio do idioma, desde principiante ata avanzado'
    },
    eu: {
      title: 'Egokitutako Hizkuntza Mailak',
      description: 'Hizkuntza maila desberdinetara egokitutako ipuinak, hasiberritik aurreratura'
    },
    pt: {
      title: 'Níveis de Idioma Adaptados',
      description: 'Histórias adaptadas a diferentes níveis de domínio do idioma, desde iniciante até avançado'
    }
  };

  // Definir levelAndCreativity ANTES de usarlo
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
    },
    gl: {
      basic: `Usa unha linguaxe moi simple e básica, con vocabulario limitado e frases curtas. Nivel A1-A2.`,
      intermediate: `Usa unha linguaxe moderadamente complexa, con vocabulario variado e estruturas gramaticais intermedias. Nivel B1-B2.`,
      advanced: `Usa unha linguaxe rica e sofisticada, con vocabulario extenso e estruturas gramaticais complexas. Nivel C1-C2.`
    },
    eu: {
      basic: `Erabili hizkuntza oso sinple eta oinarrizkoa, hitz-multzo mugatua eta esaldi laburrak dituena. A1-A2 maila.`,
      intermediate: `Erabili hizkuntza moderatuki konplexua, hitz-multzo anitza eta egitura gramatikal ertainak dituena. B1-B2 maila.`,
      advanced: `Erabili hizkuntza aberats eta sofistikatua, hitz-multzo zabala eta egitura gramatikal konplexuak dituena. C1-C2 maila.`
    },
    pt: {
      basic: `Use uma linguagem muito simples e básica, com vocabulário limitado e frases curtas. Nível A1-A2.`,
      intermediate: `Use uma linguagem moderadamente complexa, com vocabulário variado e estruturas gramaticais intermediárias. Nível B1-B2.`,
      advanced: `Use uma linguagem rica e sofisticada, com vocabulário extenso e estruturas gramaticais complexas. Nível C1-C2.`
    }
  };

  // Seleccionar el nivel de idioma correcto según el idioma seleccionado ANTES de usarlo
  const languageLevel = language === 'en' ? englishLevel : 
                       language === 'es' ? spanishLevel : 
                       englishLevel; // Por defecto usamos englishLevel

  // Construir el prompt en el idioma seleccionado
  let prompt = `${languageInstruction}\n\n`;
  
  // Añadir resumen claro de las preferencias del usuario
  const userPreferencesSection = {
    es: `PREFERENCIAS DEL USUARIO:
📖 Tipo de historia: ${selectedType}
⏱️ Duración: ${selectedLength} 
🎯 Tema: "${topic}"
👥 Audiencia: ${selectedAudience}
🧠 Nivel de idioma: ${levelAndCreativity.es[languageLevel] ? levelAndCreativity.es[languageLevel].split('.')[0] : 'intermedio'}
💡 Creatividad: ${selectedCreativity}${childNames && childNames.trim() ? `\n👦👧 Personajes a incluir: ${childNames}` : ''}

`,
    en: `USER PREFERENCES:
📖 Story type: ${selectedType}
⏱️ Duration: ${selectedLength}
🎯 Theme: "${topic}" 
👥 Audience: ${selectedAudience}
🧠 Language level: ${levelAndCreativity.en[languageLevel] ? levelAndCreativity.en[languageLevel].split('.')[0] : 'intermediate'}
💡 Creativity: ${selectedCreativity}${childNames && childNames.trim() ? `\n👦👧 Characters to include: ${childNames}` : ''}

`
  };
  
  prompt += userPreferencesSection[language] || userPreferencesSection.es;
  
  // Añadir mensaje de niveles de idioma
  const selectedLanguageLevels = languageLevelsMessage[language] || languageLevelsMessage.es;
  prompt += `${selectedLanguageLevels.title}\n${selectedLanguageLevels.description}\n\n`;
  
  // Primera línea: tipo, longitud, tema y audiencia
  prompt += `${generationInstructions[language] || generationInstructions.es} ${selectedType} ${selectedLength} ${langPrepositions.for} "${topic}" ${langPrepositions.with} ${selectedAudience}.\n`;
  
  // Segunda línea: nivel de idioma y creatividad
  // Añadir la instrucción de nivel de idioma
  prompt += `${levelAndCreativity[language]?.[languageLevel] || levelAndCreativity.es.intermediate}\n`;
  
  // Añadir la instrucción de creatividad
  const creativityInstruction = {
    es: `La historia debe tener un nivel de creatividad ${selectedCreativity}.`,
    en: `The story should have a ${selectedCreativity} level of creativity.`,
    de: `Die Geschichte sollte ein ${selectedCreativity} Maß an Kreativität haben.`,
    fr: `L'histoire doit avoir un niveau de créativité ${selectedCreativity}.`,
    ca: `La història ha de tenir un nivell de creativitat ${selectedCreativity}.`,
    it: `La storia deve avere un livello di creatività ${selectedCreativity}.`,
    gl: `A historia debe ter un nivel de creatividade ${selectedCreativity}.`,
    eu: `Ipuinak ${selectedCreativity} mailako sormena izan behar du.`,
    pt: `A história deve ter um nível de criatividade ${selectedCreativity}.`
  };
  prompt += creativityInstruction[language] || creativityInstruction.es;

  // Añadir instrucciones específicas para hacer los cuentos más divertidos y originales
  const funAndOriginalityInstructions = {
    es: `

INSTRUCCIONES ESPECIALES PARA UN CUENTO DIVERTIDO Y ORIGINAL:
- Evita ser cursi o demasiado dulce. Los niños prefieren aventuras divertidas.
- Incluye humor inteligente: situaciones absurdas pero creíbles, diálogos ingeniosos.
- Agrega al menos 2-3 obstáculos o problemas divertidos que resolver.
- Usa personajes con personalidades únicas y defectos graciosos.
- Incluye momentos de humor físico apropiado (tropezones, confusiones, etc.).
- Termina con una resolución satisfactoria pero no obvia o predecible.
- Los diálogos deben sonar naturales, como hablan realmente los niños.
- Agrega detalles sensoriales divertidos (sonidos graciosos, texturas raras, etc.).`,
    
    en: `

SPECIAL INSTRUCTIONS FOR A FUN AND ORIGINAL STORY:
- Avoid being cheesy or overly sweet. Children prefer fun adventures.
- Include intelligent humor: absurd but believable situations, witty dialogues.
- Add at least 2-3 fun obstacles or problems to solve.
- Use characters with unique personalities and funny flaws.
- Include appropriate physical humor (stumbles, confusions, etc.).
- End with a satisfying but not obvious or predictable resolution.
- Dialogues should sound natural, like children really talk.
- Add fun sensory details (funny sounds, weird textures, etc.).`,
    
    de: `

SPEZIELLE ANWEISUNGEN FÜR EINE LUSTIGE UND ORIGINELLE GESCHICHTE:
- Vermeide kitschig oder übermäßig süß zu sein. Kinder bevorzugen lustige Abenteuer.
- Füge intelligenten Humor hinzu: absurde aber glaubwürdige Situationen, witzige Dialoge.
- Füge mindestens 2-3 lustige Hindernisse oder Probleme zum Lösen hinzu.
- Verwende Charaktere mit einzigartigen Persönlichkeiten und lustigen Fehlern.
- Füge angemessenen körperlichen Humor hinzu (Stolpern, Verwirrungen, etc.).
- Ende mit einer befriedigenden aber nicht offensichtlichen oder vorhersagbaren Lösung.
- Dialoge sollten natürlich klingen, wie Kinder wirklich sprechen.
- Füge lustige sensorische Details hinzu (lustige Geräusche, seltsame Texturen, etc.).`,
    
    fr: `

INSTRUCTIONS SPÉCIALES POUR UNE HISTOIRE AMUSANTE ET ORIGINALE:
- Évitez d'être ringard ou trop mignon. Les enfants préfèrent les aventures amusantes.
- Incluez de l'humour intelligent: situations absurdes mais crédibles, dialogues spirituels.
- Ajoutez au moins 2-3 obstacles ou problèmes amusants à résoudre.
- Utilisez des personnages avec des personnalités uniques et des défauts drôles.
- Incluez de l'humour physique approprié (trébuchements, confusions, etc.).
- Terminez avec une résolution satisfaisante mais pas évidente ou prévisible.
- Les dialogues doivent sonner naturels, comme parlent vraiment les enfants.
- Ajoutez des détails sensoriels amusants (sons drôles, textures bizarres, etc.).`,
    
    ca: `

INSTRUCCIONS ESPECIAIS PER UN CONTE DIVERTIT I ORIGINAL:
- Evita ser cursi o massa dolç. Els nens prefereixen aventures divertides.
- Inclou humor intel·ligent: situacions absurdes però creïbles, diàlegs enginyosos.
- Afegeix almenys 2-3 obstacles o problemes divertits per resoldre.
- Usa personatges amb前所未有的个性和缺陷。
- Inclou moments d'humor físic apropiat (ensopegades, confusions, etc.).
- Acaba amb una resolució satisfactòria però no òbvia o predictible.
- Els diàlegs han de sonar naturals, com parlen realment els nens.
- Afegeix detalls sensorials divertits (sons graciosos, textures rares, etc.).`,
    
    it: `

ISTRUZIONI SPECIALI PER UNA STORIA DIVERTENTE E ORIGINALE:
- Evita di essere sdolcinato o troppo dolce. I bambini preferiscono avventure divertenti.
- Includi umorismo intelligente: situazioni assurde ma credibili, dialoghi spiritosi.
- Aggiungi almeno 2-3 ostacoli o problemi divertenti da risolvere.
- Usa personaggi con personalità uniche e difetti divertenti.
- Includi momenti di umorismo fisico appropriato (inciampi, confusioni, etc.).
- Termina con una risoluzione soddisfacente ma non ovvia o prevedibile.
- I dialoghi devono suonare naturali, come parlano realmente i bambini.
- Aggiungi dettagli sensoriali divertenti (suoni buffi, texture strane, etc.).`,
    
    gl: `

INSTRUCIÓNS ESPECIAIS PARA UN CONTO DIVERTIDO E ORIXINAL:
- Evita ser cursi ou demasiado doce. Os nenos prefiren aventuras divertidas.
- Inclúe humor intelixente: situacións absurdas pero creíbles, diálogos enxeñosos.
- Engade polo menos 2-3 obstáculos ou problemas divertidos que resolver.
- Usa personaxes con personalidades únicas e defectos graciosos.
- Inclúe momentos de humor físico apropiado (tropezóns, confusións, etc.).
- Remata cunha resolución satisfactoria pero non obvia ou predicible.
- Os diálogos deben soar naturais, como falan realmente os nenos.
- Engade detalles sensoriais divertidos (sons graciosos, texturas raras, etc.).`,
    
    eu: `

IPUIN DIBERTIGARRI ETA JATORRIZKO BATERAKO JARRAIBIDE BEREZIAK:
- Saihestu gozo edo gozegi izatea. Haurrek abentura dibertigarriak nahiago dituzte.
- Sartu humor adimentsua: egoera zentzugabeak baina sinesgarriak, elkarrizketa zorrotzak.
- Gehitu gutxienez 2-3 oztopo edo arazo dibertigarri konpontzeko.
- Erabili nortasun bakanak eta akats dibertigarriak dituzten pertsonaiak.
- Sartu humor fisiko egokia (behaztopenak, nahasketak, etab.).
- Amaitu konponbide gogobetegarri baina ez nabarmena edo aurreikusgarria.
- Elkarrizketak naturalak izan behar dira, haurrek benetan hitz egiten duten bezala.
- Gehitu xehetasun sentsorial dibertigarriak (soinu dibertigarriak, ehundura arraroak, etab.).`,
    
    pt: `

INSTRUÇÕES ESPECIAIS PARA UMA HISTÓRIA DIVERTIDA E ORIGINAL:
- Evite ser piegas ou muito doce. As crianças preferem aventuras divertidas.
- Inclua humor inteligente: situações absurdas mas críveis, diálogos espirituosos.
- Adicione pelo menos 2-3 obstáculos ou problemas divertidos para resolver.
- Use personagens com personalidades únicas e defeitos engraçados.
- Inclua momentos de humor físico apropriado (tropeços, confusões, etc.).
- Termine com uma resolução satisfatória mas não óbvia ou previsível.
- Os diálogos devem soar naturais, como as crianças realmente falam.
- Adicione detalhes sensoriais divertidos (sons engraçados, texturas estranhas, etc.).`
  };
  
  prompt += funAndOriginalityInstructions[language] || funAndOriginalityInstructions.es;

  // Añadir nombres de niños si se proporcionan
  if (childNames && childNames.trim()) {
    const namesInstruction = {
      es: 'Incluye a los siguientes niños en la historia:',
      en: 'Include the following children in the story:',
      de: 'Schließe die folgenden Kinder in die Geschichte ein:',
      fr: 'Incluez les enfants suivants dans l\'histoire:',
      ca: 'Inclou els següents nens a la història:',
      it: 'Includi i seguenti bambini nella storia:',
      gl: 'Inclúe os seguintes nenos na historia:',
      eu: 'Sartu ondorengo haurrak ipuinean:',
      pt: 'Inclua as seguintes crianças na história:'
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
  const defaultTitles = {
    es: 'Tu Historia',
    en: 'Your Story',
    de: 'Deine Geschichte',
    fr: 'Votre Histoire',
    ca: 'La Teva Història',
    it: 'La Tua Storia',
    gl: 'A Túa Historia',
    eu: 'Zure Ipuina',
    pt: 'Sua História'
  };
  
  const cleanTopic = fallbackTopic
    ? fallbackTopic.replace(/^["']|["']$/g, '').trim() // Remove surrounding quotes and trim if exists
    : defaultTitles[language] || defaultTitles.es; // Language-specific default title

  return {
    title: `${prefix} ${cleanTopic}`,
    content: cleanContent
  };
};

exports.generatingText = {
  es: 'Generando',
  en: 'Generating',
  de: 'Generiere',
  fr: 'Génération',
  ca: 'Generant',
  it: 'Generazione',
  gl: 'Xerando',
  eu: 'Sortzen',
  pt: 'Gerando'
};

exports.loadingText = {
  es: 'Cargando',
  en: 'Loading',
  de: 'Laden',
  fr: 'Chargement',
  ca: 'Carregant',
  it: 'Caricamento',
  gl: 'Cargando',
  eu: 'Kargatzen',
  pt: 'Carregando'
};

exports.storyExampleText = {
  es: {
    protagonist: 'Protagonista',
    ageRange: 'años',
    readStory: 'Leer cuento',
    listenAudio: 'Escuchar audio'
  },
  en: {
    protagonist: 'Protagonist',
    ageRange: 'years',
    readStory: 'Read story',
    listenAudio: 'Listen audio'
  },
  de: {
    protagonist: 'Protagonist',
    ageRange: 'Jahre',
    readStory: 'Geschichte lesen',
    listenAudio: 'Audio hören'
  },
  fr: {
    protagonist: 'Protagoniste',
    ageRange: 'ans',
    readStory: 'Lire l\'histoire',
    listenAudio: 'Écouter l\'audio'
  },
  ca: {
    protagonist: 'Protagonista',
    ageRange: 'anys',
    readStory: 'Llegir conte',
    listenAudio: 'Escoltar àudio'
  },
  it: {
    protagonist: 'Protagonista',
    ageRange: 'anni',
    readStory: 'Leggi storia',
    listenAudio: 'Ascolta audio'
  },
  gl: {
    protagonist: 'Protagonista',
    ageRange: 'anos',
    readStory: 'Ler conto',
    listenAudio: 'Escoitar audio'
  },
  eu: {
    protagonist: 'Protagonista',
    ageRange: 'urte',
    readStory: 'Ipuina irakurri',
    listenAudio: 'Audioa entzun'
  },
  pt: {
    protagonist: 'Protagonista',
    ageRange: 'anos',
    readStory: 'Ler história',
    listenAudio: 'Ouvir áudio'
  }
};