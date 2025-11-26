// fiveFromEarthCharacters.js
// Información de los personajes de "Los Cinco de la Tierra"

const characters = {
  sara: {
    name: 'Sara',
    country: 'Spain',
    city: 'Barcelona',
    age: 13,
    personality: ['funny', 'brave', 'playful'],
    likes: ['videogames', 'fun', 'adventure'],
    dislikes: ['studying', 'sports'],
    description: 'Sara loves to have fun and play videogames. She is brave and funny!'
  },
  
  maria: {
    name: 'María',
    country: 'Cameroon',
    city: 'Douala',
    age: 13,
    personality: ['smart', 'kind', 'hardworking'],
    likes: ['studying', 'learning', 'helping'],
    dislikes: [],
    description: 'María is very smart and loves to learn. She helps her parents at the market.'
  },
  
  eva: {
    name: 'Eva',
    country: 'China',
    city: 'Beijing',
    age: 12,
    personality: ['friendly', 'fun', 'kind'],
    likes: ['cats', 'friends', 'fun'],
    dislikes: [],
    description: 'Eva loves to have fun with her friends. She has a cute cat!'
  },
  
  robert: {
    name: 'Robert',
    country: 'USA',
    city: 'California',
    age: 14,
    personality: ['strong', 'confident', 'leader'],
    likes: ['sports', 'basketball', 'football'],
    dislikes: [],
    description: 'Robert loves sports and is very strong. He is confident and likes to lead.'
  },
  
  gabriel: {
    name: 'Gabriel',
    country: 'Australia',
    city: 'Sydney',
    age: 13,
    personality: ['shy', 'smart', 'quiet', 'brave'],
    likes: ['books', 'space', 'science', 'reading'],
    dislikes: [],
    description: 'Gabriel is shy but very smart. He loves books about space!'
  }
};

/**
 * Obtiene información de un personaje por su nombre
 * @param {string} characterName - Nombre del personaje (sara, maria, eva, robert, gabriel)
 * @returns {object|null} - Información del personaje o null si no existe
 */
function getCharacter(characterName) {
  if (!characterName) return null;
  const name = characterName.toLowerCase();
  return characters[name] || null;
}

/**
 * Obtiene todos los personajes
 * @returns {object} - Todos los personajes
 */
function getAllCharacters() {
  return characters;
}

/**
 * Obtiene los nombres de todos los personajes
 * @returns {array} - Array con los nombres de los personajes
 */
function getCharacterNames() {
  return Object.keys(characters);
}

module.exports = {
  characters,
  getCharacter,
  getAllCharacters,
  getCharacterNames
};
