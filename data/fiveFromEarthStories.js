// fiveFromEarthStories.js
// Los 12 cuentos completos del Mes 1: "My team and me"
// Protagonistas: Los Cinco de la Tierra (Sara, María, Eva, Robert, Gabriel)
// Nivel: A1 (Beginner English for Spanish-speaking children 4-7 years)

const { getCharacter } = require('./fiveFromEarthCharacters');

const fiveFromEarthStories = {
  // ========================================
  // WEEK 1: MEET THE TEAM
  // ========================================
  
  m1w1s1: {
    id: 'm1w1s1',
    week: 1,
    storyNumber: 1,
    title: {
      en: 'I am Sara from Barcelona',
      es: 'Soy Sara de Barcelona'
    },
    vocabulary: ['my', 'name', 'videogames', 'brother'],
    characters: ['sara'],
    duration: '10:00',
    level: 'A1',
    structures: ['"My name is..."', '"I am from..."', '"I love..."', '"I have..."'],
    text: `Hello! My name is Sara.

I am from Barcelona. Barcelona is in Spain.

I live with my family. I have a brother. My brother is nice.

I love playing videogames! Videogames are fun!

I don't like to study. I don't like sports.

But I love to have fun! I am funny!

I have a secret. I am part of a special team.

We are called "The Five from Earth".

We go on missions in space! But nobody knows. It is a secret!

My name is Sara. I am from Barcelona. And I am part of the Five from Earth!`,
    
    vocabularyIntro: {
      words: [
        { es: 'Mi', fr: 'Mon', en: 'My' },
        { es: 'Nombre', fr: 'Nom', en: 'Name' },
        { es: 'Videojuegos', fr: 'Jeux vidéo', en: 'Videogames' },
        { es: 'Hermano', fr: 'Frère', en: 'Brother' }
      ],
      intro: 'Today we will learn the words:'
    }
  },

  m1w1s2: {
    id: 'm1w1s2',
    week: 1,
    storyNumber: 2,
    title: {
      en: 'I am María from Cameroon',
      es: 'Soy María de Camerún'
    },
    vocabulary: ['smart', 'market', 'help', 'study'],
    characters: ['maria'],
    duration: '10:00',
    level: 'A1',
    structures: ['"I am from..."', '"I help..."', '"I love to..."'],
    text: `Hello! My name is María.

I am from Cameroon. Cameroon is in Africa.

I live with my parents. They have a shop at the market.

I help my parents at the market every day. I help them sell things.

I love to study! I love to learn new things!

I am very smart. I work hard at school.

My teachers say I am a good student.

But I have a secret. I am part of a special team.

We are called "The Five from Earth".

We go on space missions! We help people from other planets!

Nobody knows our secret. Only a few people on Earth know.

My name is María. I am smart and I love to learn. And I am part of the Five from Earth!`,
    
    vocabularyIntro: {
      words: [
        { es: 'Inteligente', fr: 'Intelligent', en: 'Smart' },
        { es: 'Mercado', fr: 'Marché', en: 'Market' },
        { es: 'Ayudar', fr: 'Aider', en: 'Help' },
        { es: 'Estudiar', fr: 'Étudier', en: 'Study' }
      ],
      intro: 'Today we will learn the words:'
    }
  },

  m1w1s3: {
    id: 'm1w1s3',
    week: 1,
    storyNumber: 3,
    title: {
      en: 'I am Eva from China',
      es: 'Soy Eva de China'
    },
    vocabulary: ['China', 'cat', 'fun', 'friend'],
    characters: ['eva'],
    duration: '10:00',
    level: 'A1',
    structures: ['"I am from..."', '"I have..."', '"My cat is..."'],
    text: `Hello! My name is Eva.

I am from China. China is a big country in Asia.

I live in a big city with my family.

I have a cat! My cat is very cute. My cat is black and white.

I love my cat. My cat is fun. We play every day.

I also have many friends. My friends are nice.

I love to have fun with my friends and my cat.

But I have a secret. I am part of a special team.

We are called "The Five from Earth".

We go on secret missions to space! We help people!

My name is Eva. I love to have fun. I have a cat. And I am part of the Five from Earth!`,
    
    vocabularyIntro: {
      words: [
        { es: 'China', fr: 'Chine', en: 'China' },
        { es: 'Gato', fr: 'Chat', en: 'Cat' },
        { es: 'Diversión', fr: 'Amusement', en: 'Fun' },
        { es: 'Amiga/Amigo', fr: 'Ami(e)', en: 'Friend' }
      ],
      intro: 'Today we will learn the words:'
    }
  },

  // ========================================
  // WEEK 2: THE TEAM IS COMPLETE
  // ========================================
  
  m1w2s1: {
    id: 'm1w2s1',
    week: 2,
    storyNumber: 1,
    title: {
      en: 'I am Robert from America',
      es: 'Soy Robert de Estados Unidos'
    },
    vocabulary: ['sports', 'strong', 'sisters', 'confident'],
    characters: ['robert'],
    duration: '10:00',
    level: 'A1',
    structures: ['"I love..."', '"I am..."', '"I have..."'],
    text: `Hello! My name is Robert.

I am from America. I live in California.

I love sports! I play basketball and football.

I am very strong. I exercise every day.

I have two sisters. My sisters are younger than me.

I am confident. I like to be the leader.

Sometimes I am too confident. But I am learning to listen to others.

I have a secret. I am part of a special team.

We are called "The Five from Earth".

We go on space missions together! We work as a team!

My name is Robert. I love sports. I am strong and confident. And I am part of the Five from Earth!`,
    
    vocabularyIntro: {
      words: [
        { es: 'Deportes', fr: 'Sports', en: 'Sports' },
        { es: 'Fuerte', fr: 'Fort', en: 'Strong' },
        { es: 'Hermanas', fr: 'Sœurs', en: 'Sisters' },
        { es: 'Seguro', fr: 'Confiant', en: 'Confident' }
      ],
      intro: 'Today we will learn the words:'
    }
  },

  m1w2s2: {
    id: 'm1w2s2',
    week: 2,
    storyNumber: 2,
    title: {
      en: 'I am Gabriel from Australia',
      es: 'Soy Gabriel de Australia'
    },
    vocabulary: ['shy', 'quiet', 'books', 'space'],
    characters: ['gabriel'],
    duration: '10:00',
    level: 'A1',
    structures: ['"I am..."', '"I love..."', '"I like to..."'],
    text: `Hello! My name is Gabriel.

I am from Australia. I live in Sydney.

I am shy. I don't talk much. I am quiet.

But I am very smart. I love to read books.

I especially love books about space. Space is amazing!

I know a lot about stars and planets.

Sometimes being shy is hard. But my friends understand me.

I have a secret. I am part of a special team.

We are called "The Five from Earth".

We go on space missions! This is perfect for me because I love space!

My name is Gabriel. I am shy, but I am brave. I love science fiction. And I am part of the Five from Earth!`,
    
    vocabularyIntro: {
      words: [
        { es: 'Tímido', fr: 'Timide', en: 'Shy' },
        { es: 'Tranquilo', fr: 'Calme', en: 'Quiet' },
        { es: 'Libros', fr: 'Livres', en: 'Books' },
        { es: 'Espacio', fr: 'Espace', en: 'Space' }
      ],
      intro: 'Today we will learn the words:'
    }
  },

  m1w2s3: {
    id: 'm1w2s3',
    week: 2,
    storyNumber: 3,
    title: {
      en: 'We Are the Five',
      es: 'Somos los Cinco'
    },
    vocabulary: ['team', 'different', 'together', 'friends'],
    characters: ['sara', 'maria', 'eva', 'robert', 'gabriel'],
    duration: '10:00',
    level: 'A1',
    structures: ['"We are..."', '"We work..."', '"Together we..."'],
    text: `We are the Five from Earth!

Sara is from Spain. María is from Cameroon. Eva is from China.

Robert is from America. Gabriel is from Australia.

We are all very different!

Sara loves to have fun. María loves to study.

Eva loves her cat. Robert loves sports. Gabriel loves books.

But we are a team. We work together!

We are friends. We respect each other.

When we work together, we are strong!

We have a special mission. We help people on different planets.

We use our rocket to travel through space.

Sara is funny and brave. María is smart and kind.

Eva is friendly and fun. Robert is strong and confident.

Gabriel is quiet but very intelligent.

Together, we can solve any problem!

We are the Five from Earth! And together, we can do anything!`,
    
    vocabularyIntro: {
      words: [
        { es: 'Equipo', fr: 'Équipe', en: 'Team' },
        { es: 'Diferentes', fr: 'Différents', en: 'Different' },
        { es: 'Juntos', fr: 'Ensemble', en: 'Together' },
        { es: 'Amigos', fr: 'Amis', en: 'Friends' }
      ],
      intro: 'Today we will learn the words:'
    }
  },

  // ========================================
  // WEEK 3: RESCUE MISSION
  // ========================================
  
  m1w3s1: {
    id: 'm1w3s1',
    week: 3,
    storyNumber: 1,
    title: {
      en: 'Mission Alert!',
      es: '¡Alerta de Misión!'
    },
    vocabulary: ['mission', 'rescue', 'rocket', 'ready'],
    characters: ['sara', 'maria', 'eva', 'robert', 'gabriel'],
    duration: '10:00',
    level: 'A1',
    structures: ['"We have..."', '"We need to..."', '"Let\'s..."'],
    text: `BEEP! BEEP! BEEP!

The alarm sounds in our secret base!

"We have a mission!" says María.

We all run to the control room.

"Look!" says Gabriel. "Someone needs our help!"

On the screen, we see a spaceship. It is far away in space.

"They are lost!" says Eva. "We need to rescue them!"

"Let's go to our rocket!" says Robert.

We run to the rocket. Our rocket is big and fast!

Sara checks the engines. "Ready!" she says.

Gabriel checks the computers. "Ready!" he says.

María checks the maps. "Ready!" she says.

Eva checks the communication system. "Ready!" she says.

Robert checks everything. "We are all ready! Let's go!"

We get into the rocket. We put on our space suits.

"Five... four... three... two... one... BLAST OFF!"

The rocket goes up, up, up into space!

We are ready! We are the Five from Earth! And we have a rescue mission!`,
    
    vocabularyIntro: {
      words: [
        { es: 'Misión', fr: 'Mission', en: 'Mission' },
        { es: 'Rescate', fr: 'Sauvetage', en: 'Rescue' },
        { es: 'Cohete', fr: 'Fusée', en: 'Rocket' },
        { es: 'Listos', fr: 'Prêts', en: 'Ready' }
      ],
      intro: 'Today we will learn the words:'
    }
  },

  m1w3s2: {
    id: 'm1w3s2',
    week: 3,
    storyNumber: 2,
    title: {
      en: 'The Lost Explorer',
      es: 'El Explorador Perdido'
    },
    vocabulary: ['lost', 'find', 'search', 'planet'],
    characters: ['sara', 'maria', 'eva', 'robert', 'gabriel'],
    duration: '10:00',
    level: 'A1',
    structures: ['"Where is...?"', '"Let\'s search..."', '"I can see..."'],
    text: `We are in space! We are flying in our rocket!

"Where is the lost explorer?" asks Sara.

Gabriel looks at the computer. "He is near the red planet," he says.

"The red planet? That's Mars!" says María.

We fly to Mars. Mars is big and red.

"I can't see him!" says Robert.

"Let's search for him!" says Eva.

We look and look. We search everywhere!

Sara uses special binoculars. "I can see something!" she says.

"Where?" asks everyone.

"There! Behind that big rock!" says Sara.

We fly the rocket close to the rock.

"I see him!" says María. "He is there!"

The explorer is waving at us. He looks happy!

"Let's rescue him!" says Robert.

We land the rocket carefully. Gabriel opens the door.

The explorer runs to our rocket. "Thank you!" he says. "I was lost!"

"You are safe now," says Eva. "We are the Five from Earth!"

We found him! The mission is a success!`,
    
    vocabularyIntro: {
      words: [
        { es: 'Perdido', fr: 'Perdu', en: 'Lost' },
        { es: 'Encontrar', fr: 'Trouver', en: 'Find' },
        { es: 'Buscar', fr: 'Chercher', en: 'Search' },
        { es: 'Planeta', fr: 'Planète', en: 'Planet' }
      ],
      intro: 'Today we will learn the words:'
    }
  },

  m1w3s3: {
    id: 'm1w3s3',
    week: 3,
    storyNumber: 3,
    title: {
      en: "María's Plan",
      es: 'El Plan de María'
    },
    vocabulary: ['smart', 'idea', 'plan', 'solve'],
    characters: ['sara', 'maria', 'eva', 'robert', 'gabriel'],
    duration: '10:00',
    level: 'A1',
    structures: ['"I have an idea!"', '"The plan is..."', '"We can..."'],
    text: `We are going back to Earth with the explorer.

But suddenly... BOOM! The rocket shakes!

"What happened?" asks Sara.

Gabriel checks the computer. "Oh no! The engine has a problem!"

"Can we fix it?" asks Eva.

"I don't know," says Gabriel. "It's complicated."

Everyone is worried. We are in the middle of space!

But María is thinking. She is very smart.

"I have an idea!" says María.

"What is it?" asks Robert.

"I have a plan!" says María. "Listen!"

María explains her idea. It is a good idea!

"That's brilliant!" says Gabriel.

"Let's do it!" says Sara.

We follow María's plan step by step.

Robert moves some cables. Gabriel adjusts the computer.

Eva helps with the tools. Sara checks the connections.

María directs everyone. "Good! Good! Now this... Now that!"

Finally... "It's fixed!" says Gabriel.

The engine works again! VROOOOM!

"You did it, María!" says everyone.

"We all did it!" says María. "We worked together!"

We are the Five from Earth! And we always work together!`,
    
    vocabularyIntro: {
      words: [
        { es: 'Inteligente', fr: 'Intelligent', en: 'Smart' },
        { es: 'Idea', fr: 'Idée', en: 'Idea' },
        { es: 'Plan', fr: 'Plan', en: 'Plan' },
        { es: 'Resolver', fr: 'Résoudre', en: 'Solve' }
      ],
      intro: 'Today we will learn the words:'
    }
  },

  // ========================================
  // WEEK 4: MAGIC PLANET EXPLORATION
  // ========================================
  
  m1w4s1: {
    id: 'm1w4s1',
    week: 4,
    storyNumber: 1,
    title: {
      en: 'The Wizard Planet',
      es: 'El Planeta de los Magos'
    },
    vocabulary: ['explore', 'magic', 'wizard', 'strange'],
    characters: ['sara', 'maria', 'eva', 'robert', 'gabriel'],
    duration: '10:00',
    level: 'A1',
    structures: ['"Let\'s explore..."', '"This is..."', '"It looks..."'],
    text: `"Look at that planet!" says Gabriel.

We see a beautiful planet. It has purple skies and green trees.

"It looks strange," says Robert.

"Let's explore it!" says Sara.

We land our rocket on the planet.

When we get out, we see something amazing!

There are people with long robes and tall hats.

"They look like wizards!" says Eva.

One wizard comes to us. "Welcome!" he says. "Welcome to the Magic Planet!"

"Magic Planet?" we all say.

"Yes!" says the wizard. "Here, everything is magic!"

He waves his hand. Suddenly, flowers appear in the air!

"Wow!" says Sara.

Another wizard makes a tree dance!

"This is amazing!" says María.

The wizards are very friendly.

"Would you like to learn some magic?" asks a wizard.

"Yes, please!" we all say.

The wizards start to teach us simple magic tricks.

Gabriel learns how to make lights appear.

María learns how to make books fly.

Eva learns how to talk to animals.

Robert learns how to lift heavy things with magic.

Sara learns how to make funny sounds.

"This is so much fun!" says everyone.

This is going to be an amazing adventure!`,
    
    vocabularyIntro: {
      words: [
        { es: 'Explorar', fr: 'Explorer', en: 'Explore' },
        { es: 'Magia', fr: 'Magie', en: 'Magic' },
        { es: 'Mago', fr: 'Magicien', en: 'Wizard' },
        { es: 'Extraño', fr: 'Étrange', en: 'Strange' }
      ],
      intro: 'Today we will learn the words:'
    }
  },

  m1w4s2: {
    id: 'm1w4s2',
    week: 4,
    storyNumber: 2,
    title: {
      en: 'Sara and Eva Have Fun',
      es: 'Sara y Eva se Divierten'
    },
    vocabulary: ['fun', 'laugh', 'spell', 'careful'],
    characters: ['sara', 'eva'],
    duration: '10:00',
    level: 'A1',
    structures: ['"Let\'s try..."', '"Be careful!"', '"That was..."'],
    text: `Sara and Eva are practicing magic.

"Let's try this spell!" says Sara.

She waves her hand. "Abracadabra!"

Suddenly, her hair turns bright blue!

"Hahaha!" laughs Eva. "Your hair is blue!"

"Oops!" says Sara. But she laughs too.

"Let me try!" says Eva.

She tries a spell to make flowers grow.

But instead, giant mushrooms appear!

"Oh no!" says Eva. But she laughs.

"This is so fun!" says Sara.

They try more spells. Some work. Some don't!

Sara tries to make a rabbit appear. A giant bunny appears!

"It's too big!" says Sara, laughing.

Eva tries to make stars. Suddenly, stars are everywhere!

"There are too many!" says Eva, laughing.

A wise wizard comes to them.

"You need to be more careful!" he says. But he is smiling.

"Magic is fun, but you must concentrate," says the wizard.

"Yes, sir!" say Sara and Eva.

They try again. This time, they concentrate more.

Sara makes a beautiful rainbow!

Eva makes a small, cute bunny!

"Perfect!" says the wizard. "You are learning!"

Sara and Eva high-five each other.

We all laugh! Sara and Eva always have fun, even when things go wrong!`,
    
    vocabularyIntro: {
      words: [
        { es: 'Diversión', fr: 'Amusement', en: 'Fun' },
        { es: 'Reír', fr: 'Rire', en: 'Laugh' },
        { es: 'Hechizo', fr: 'Sort', en: 'Spell' },
        { es: 'Cuidado', fr: 'Attention', en: 'Careful' }
      ],
      intro: 'Today we will learn the words:'
    }
  },

  m1w4s3: {
    id: 'm1w4s3',
    week: 4,
    storyNumber: 3,
    title: {
      en: 'Team Success',
      es: 'Éxito del Equipo'
    },
    vocabulary: ['success', 'proud', 'home', 'Earth'],
    characters: ['sara', 'maria', 'eva', 'robert', 'gabriel'],
    duration: '10:00',
    level: 'A1',
    structures: ['"We did it!"', '"I am proud..."', '"Let\'s go..."'],
    text: `It's time to leave the Magic Planet.

The wizards come to say goodbye.

"Thank you for teaching us magic!" says María.

"You are good students," says the head wizard.

"You have learned well. And you have worked together as a team."

"That's the most important magic," says the wizard.

We get into our rocket.

"Goodbye!" we say to the wizards.

"Goodbye! Come back soon!" they say.

Our rocket flies up into space.

"That was an amazing adventure!" says Gabriel.

"We rescued the lost explorer," says Robert.

"We fixed the rocket," says María.

"We learned magic!" says Sara and Eva together.

"We did it all together!" says everyone.

We are proud. We worked as a team.

Sara was brave and funny.

María was smart and helpful.

Eva was kind and friendly.

Robert was strong and confident.

Gabriel was intelligent and calm.

Together, we were the perfect team!

"Now let's go home," says Gabriel.

"Yes! Let's go back to Earth!" says everyone.

Our rocket flies through space, back to Earth.

We are tired, but happy.

We are the Five from Earth.

We are different, but we are friends.

We are a team.

Because we are a team. And together, we can do anything!`,
    
    vocabularyIntro: {
      words: [
        { es: 'Éxito', fr: 'Succès', en: 'Success' },
        { es: 'Orgulloso', fr: 'Fier', en: 'Proud' },
        { es: 'Casa/Hogar', fr: 'Maison', en: 'Home' },
        { es: 'Tierra', fr: 'Terre', en: 'Earth' }
      ],
      intro: 'Today we will learn the words:'
    }
  }
};

// Helper function para obtener cuento por ID
const getStory = (storyId) => fiveFromEarthStories[storyId];

// Helper function para obtener todos los cuentos de una semana
const getWeekStories = (weekNumber) => {
  return Object.values(fiveFromEarthStories).filter(story => story.week === weekNumber);
};

// Helper function para obtener metadata de todos los cuentos
const getAllStoriesMetadata = () => {
  return Object.values(fiveFromEarthStories).map(story => ({
    id: story.id,
    title: story.title,
    vocabulary: story.vocabulary,
    duration: story.duration,
    week: story.week,
    storyNumber: story.storyNumber,
    level: story.level
  }));
};

// Helper function para obtener personajes de un cuento
const getCharacters = (characterNames) => {
  if (!characterNames || !Array.isArray(characterNames)) {
    return [];
  }
  return characterNames.map(name => getCharacter(name)).filter(char => char !== null);
};

module.exports = {
  fiveFromEarthStories,
  getStory,
  getWeekStories,
  getAllStoriesMetadata,
  getCharacters
};
