const fs = require('fs');
const path = require('path');

class Translations {
  constructor() {
    this.translations = {};
    this.defaultLanguage = 'en';
    this.loadTranslations();
  }

  loadTranslations() {
    const translationsDir = path.join(__dirname, '../translations/emails');
    const files = fs.readdirSync(translationsDir);
    
    files.forEach(file => {
      if (file.endsWith('.json')) {
        const language = file.replace('.json', '');
        const content = fs.readFileSync(path.join(translationsDir, file), 'utf8');
        this.translations[language] = JSON.parse(content);
      }
    });
  }

  getTranslation(key, language = this.defaultLanguage) {
    const keys = key.split('.');
    let translation = this.translations[language];
    
    // If translation for the language doesn't exist, fallback to default language
    if (!translation) {
      translation = this.translations[this.defaultLanguage];
    }

    // Navigate through the nested keys
    for (const k of keys) {
      if (translation && translation[k]) {
        translation = translation[k];
      } else {
        // If key not found, try default language
        translation = this.translations[this.defaultLanguage];
        for (const k2 of keys) {
          if (translation && translation[k2]) {
            translation = translation[k2];
          } else {
            return key; // Return the key if translation not found
          }
        }
      }
    }

    return translation;
  }
}

module.exports = new Translations(); 