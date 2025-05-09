// utils/openaiService.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Function to log critical errors that require admin attention
const notifyAdminOfCriticalError = async (errorMessage) => {
  try {
    // Log to a special error file
    const errorLog = `[${new Date().toISOString()}] CRITICAL ERROR: ${errorMessage}\n`;
    const errorLogPath = path.join(__dirname, '..', 'logs');
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(errorLogPath)) {
      fs.mkdirSync(errorLogPath, { recursive: true });
    }
    
    // Append to critical-errors.log
    fs.appendFileSync(
      path.join(errorLogPath, 'critical-errors.log'), 
      errorLog
    );
    
    // If configured, send an alert via webhook (Slack, Discord, etc.)
    if (process.env.ADMIN_WEBHOOK_URL) {
      await axios.post(process.env.ADMIN_WEBHOOK_URL, {
        text: `🚨 CRITICAL ALERT: ${errorMessage}`,
        attachments: [{
          title: 'OpenAI API Quota Exceeded',
          text: 'The OpenAI API key has insufficient quota. The story generation service is down.',
          color: 'danger'
        }]
      }).catch(err => console.error('Failed to send webhook notification:', err.message));
    }
    
    // If configured, send an email alert
    if (process.env.ADMIN_EMAIL) {
      // Simple implementation - in a real app you'd use a proper email service
      console.log(`🚨 Would send email to ${process.env.ADMIN_EMAIL}: CRITICAL ALERT - OpenAI API Quota Exceeded`);
    }
    
    console.log('✅ Admin notification sent for critical error');
  } catch (error) {
    console.error('Failed to notify admin:', error);
  }
};

// Export the notification function for use in other modules
exports.notifyAdminOfCriticalError = notifyAdminOfCriticalError;

exports.generateCompletion = async (prompt, storyParams) => {
  try {
    const maxTokens = getMaxTokens(storyParams.length);
    const temperature = getTemperature(storyParams.creativityLevel);
    
    console.log('storyParams recibidos:', JSON.stringify(storyParams));
    console.log('OpenAI request - maxTokens:', maxTokens, 'temperature:', temperature);

    // Verificar que la API key existe
    if (!process.env.OPENAI_API_KEY) {
      console.error('ERROR CRÍTICO: OPENAI_API_KEY no está configurada');
      throw new Error('OpenAI API key is missing');
    }

    // Log the first few characters of the API key for debugging
    console.log('Using OpenAI API Key (first 5 chars):', process.env.OPENAI_API_KEY.substring(0, 5) + '...');

    // Construir el mensaje del sistema basado en el idioma y nivel de inglés
    let systemMessage;
    if (storyParams.language === 'en') {
      switch (storyParams.englishLevel) {
        case 'basic':
          systemMessage = `You are a story writer for absolute beginners in English (A1 level). Follow these strict rules:
1. Use ONLY these words: be, have, do, say, get, make, go, know, take, see, come, think, look, want, give, use, find, tell, ask, work, seem, feel, try, leave, call.
2. Use ONLY simple present tense (I go, you see, he likes).
3. Maximum 3 words per sentence.
4. No contractions (use "do not" not "don't").
5. No adjectives or adverbs.
6. No idioms or expressions.
7. No past tense or future tense.
8. No questions.
9. No complex sentences.
10. No pronouns except I, you, he, she, it, we, they.

Example of correct sentences:
- I see a cat.
- The cat is big.
- I like the cat.
- The cat likes me.

Example of incorrect sentences (DO NOT USE):
- I was walking in the park (past tense)
- The beautiful cat runs quickly (adjectives and adverbs)
- I don't like cats (contraction)
- What do you see? (question)
- The cat that I like is big (complex sentence)`;
          break;
        case 'intermediate':
          systemMessage = `You are a story writer for intermediate English learners (B1-B2 level). Follow these rules:

1. Vocabulary:
   - Use common everyday words
   - Can use basic adjectives (big, small, happy, sad)
   - Can use basic adverbs (quickly, slowly, well)
   - Can use common phrasal verbs
   - Can use basic idioms and expressions

2. Grammar:
   - Use all basic tenses (present, past, future)
   - Can use continuous tenses
   - Can use basic modal verbs (can, should, must)
   - Can use basic conditionals
   - Can use relative clauses

3. Structure:
   - Maximum 10 words per sentence
   - Can use compound sentences
   - Can use basic linking words (and, but, because)
   - Can use basic discourse markers

Example of correct sentences:
- I was walking in the park when I saw a beautiful butterfly.
- The children were playing happily in the garden.
- If it rains tomorrow, we will stay at home.
- She can speak three languages fluently.

Example of incorrect sentences (DO NOT USE):
- The scintillating luminescence of the fireflies created an ethereal ambiance (too advanced)
- Having been informed of the situation, I proceeded to take immediate action (too complex)
- The cat, which was sitting on the windowsill, meowed loudly (too complex for intermediate)`;
          break;
        case 'advanced':
          systemMessage = `You are a story writer for advanced English learners (C1-C2 level). You can use:

1. Vocabulary:
   - Sophisticated and precise vocabulary
   - Advanced adjectives and adverbs
   - Complex phrasal verbs
   - Idioms and expressions
   - Figurative language and metaphors
   - Technical and specialized terms when appropriate

2. Grammar:
   - All verb tenses, including perfect and continuous forms
   - Complex modal structures
   - Advanced conditionals
   - Passive voice
   - Inversion
   - Cleft sentences
   - Advanced relative clauses

3. Structure:
   - Complex and compound-complex sentences
   - Advanced linking words and discourse markers
   - Parallel structures
   - Rhetorical devices
   - Varied sentence length and structure

Example of correct sentences:
- As the golden rays of the setting sun cast long shadows across the meadow, a kaleidoscope of butterflies danced in the crisp autumn air.
- Having been informed of the situation, I proceeded to take immediate action to mitigate the potential consequences.
- Not only did she excel in her studies, but she also demonstrated exceptional leadership skills.
- The intricate tapestry of human emotions was woven with threads of joy, sorrow, and everything in between.

Example of incorrect sentences (DO NOT USE):
- I see cat. Cat big. (too basic)
- I was walking in park. I saw butterfly. (too simple)
- The children were playing in the garden and they were happy. (too intermediate)`;
          break;
        default:
          systemMessage = 'You are a creative story writer in English. Create original, coherent and captivating stories.';
      }
    } else {
      systemMessage = 'Eres un creativo escritor de cuentos en español. Crea historias originales, coherentes y cautivadoras.';
    }
    
    // Create a timeout for the API request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      console.log('Sending request to OpenAI API...');
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: systemMessage
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: temperature,
        top_p: 1,
        frequency_penalty: 0.2,
        presence_penalty: 0.6
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('OpenAI API response status:', response.status);
      console.log('OpenAI API usage:', JSON.stringify(response.data.usage));
      
      if (!response.data || !response.data.choices || response.data.choices.length === 0) {
        console.error('OpenAI API returned empty response:', JSON.stringify(response.data));
        throw new Error('OpenAI API returned empty response');
      }
      
      return response.data.choices[0].message.content.trim();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (error) {
    // Detailed error logging
    console.error('⚠️ OpenAI API Error:', error.message);
    
    if (error.response) {
      // La solicitud fue realizada y el servidor respondió con un código de error
      console.error('OpenAI API response error status:', error.response.status);
      console.error('OpenAI API response error data:', JSON.stringify(error.response.data));
      console.error('OpenAI API response error headers:', JSON.stringify(error.response.headers));
    } else if (error.request) {
      // La solicitud fue realizada pero no se recibió respuesta
      console.error('OpenAI API request error (no response):', error.request);
    } else if (error.code === 'ECONNABORTED' || error.name === 'AbortError') {
      // Timeout error
      console.error('OpenAI API request timed out');
      throw new Error('OpenAI API request timed out. Please try again.');
    }
    
    // Enhanced error handling
    if (error.response?.status === 429) {
      console.error('OpenAI rate limit exceeded');
      
      // Check specifically for insufficient quota errors
      if (error.response?.data?.error?.code === 'insufficient_quota' || 
          (error.response?.data?.error?.message && error.response?.data?.error?.message.includes('exceeded your current quota'))) {
        console.error('🚫 OpenAI API QUOTA EXCEEDED - BILLING ISSUE DETECTED');
        console.error('This requires immediate attention - the API key has run out of credits or reached its usage limit');
        
        // Notify administrators about this critical error
        await notifyAdminOfCriticalError(
          `OpenAI API quota exceeded. The API key has insufficient quota. Error details: ${JSON.stringify(error.response?.data || {})}`
        );
        
        throw new Error('OpenAI API quota exceeded. The API key has insufficient quota. Please check billing details.');
      }
      
      throw new Error('OpenAI rate limit exceeded. Please try again later.');
    } else if (error.response?.status === 401) {
      console.error('OpenAI API authentication error - invalid API key');
      throw new Error('Authentication error with OpenAI API. Check your API key.');
    } else if (error.response?.status === 400) {
      console.error('OpenAI API bad request error:', error.response.data);
      throw new Error('Bad request to OpenAI API: ' + (error.response.data?.error?.message || 'unknown error'));
    } else if (error.response?.status >= 500) {
      console.error('OpenAI API server error:', error.response.status);
      throw new Error('OpenAI API server error. Please try again later.');
    } else {
      console.error('Unknown OpenAI API error:', error);
      throw new Error('Failed to generate story with OpenAI: ' + (error.response?.data?.error?.message || error.message));
    }
  }
};

// Helper functions to determine parameters based on user selections
function getMaxTokens(length) {
  // Manejar tanto valores en español como en inglés
  switch (length?.toLowerCase()) {
    case 'short': 
    case 'corto': 
      return 400;
    case 'medium': 
    case 'medio': 
      return 1600;
    case 'long': 
    case 'largo': 
      return 2400;
    default: 
      return 1600;
  }
}

function getTemperature(creativityLevel) {
  // Manejar tanto valores en español como en inglés
  switch (creativityLevel?.toLowerCase()) {
    case 'conservative':
    case 'conservador': 
      return 0.5;
    case 'innovative':
    case 'innovador': 
      return 0.7;
    case 'imaginative':
    case 'imaginativo': 
      return 0.8;
    case 'visionary':
    case 'visionario': 
      return 0.9;
    case 'inspired':
    case 'inspirado': 
      return 1.0;
    default: 
      return 0.7;
  }
}

// Test OpenAI API connection
exports.testConnection = async () => {
  try {
    // Verify API key exists
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is missing');
    }
    
    // Simple request to test API access
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: 'Hello, this is a connection test.'
        }
      ],
      max_tokens: 5, // Minimal tokens for test
      temperature: 0.0
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000 // 5 second timeout for health check
    });
    
    if (response.status !== 200) {
      throw new Error(`OpenAI API returned status code ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error('OpenAI connection test failed:', error.message);
    
    if (error.response?.status === 429) {
      if (error.response?.data?.error?.code === 'insufficient_quota' || 
          (error.response?.data?.error?.message && 
           error.response?.data?.error?.message.includes('exceeded your current quota'))) {
        throw new Error('OpenAI API quota exceeded');
      } else {
        throw new Error('OpenAI API rate limit exceeded');
      }
    } else if (error.response?.status === 401) {
      throw new Error('Invalid OpenAI API key');
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw new Error('OpenAI API connection timeout');
    }
    
    throw new Error(`OpenAI API connection failed: ${error.message}`);
  }
};

// OpenAI API status check
exports.checkOpenAIStatus = async () => {
  const statusResult = {
    status: 'unknown',
    message: null,
    details: null,
    lastChecked: new Date().toISOString()
  };
  
  try {
    // Step 1: Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      statusResult.status = 'not_configured';
      statusResult.message = 'OpenAI API key is not configured';
      return statusResult;
    }
    
    // Step 2: Make a minimal API request
    console.log('Testing OpenAI API connection...');
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: 'Return the word OK if you are working.'
        }
      ],
      max_tokens: 5, // Minimal tokens for test
      temperature: 0.0
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000 // 5 second timeout for health check
    });
    
    // Step 3: Check response
    if (response.status === 200 && response.data?.choices?.length > 0) {
      statusResult.status = 'ok';
      statusResult.message = 'OpenAI API is responding correctly';
      statusResult.details = {
        response: response.data.choices[0].message.content.trim(),
        model: response.data.model,
        usage: response.data.usage
      };
      return statusResult;
    } else {
      statusResult.status = 'degraded';
      statusResult.message = 'OpenAI API responded with unexpected format';
      statusResult.details = { status: response.status };
      return statusResult;
    }
  } catch (error) {
    // Step 4: Handle error responses
    statusResult.status = 'error';
    
    if (error.response) {
      // OpenAI API responded with an error
      statusResult.details = {
        status: error.response.status,
        data: error.response.data
      };
      
      // Check for specific error types
      if (error.response.status === 429) {
        if (error.response?.data?.error?.code === 'insufficient_quota' || 
            (error.response?.data?.error?.message && 
             error.response?.data?.error?.message.includes('exceeded your current quota'))) {
          statusResult.status = 'quota_exceeded';
          statusResult.message = 'OpenAI API quota has been exceeded';
        } else {
          statusResult.status = 'rate_limited';
          statusResult.message = 'OpenAI API rate limit exceeded';
        }
      } else if (error.response.status === 401) {
        statusResult.status = 'authentication_error';
        statusResult.message = 'OpenAI API authentication failed (invalid API key)';
      } else if (error.response.status >= 500) {
        statusResult.status = 'service_unavailable';
        statusResult.message = 'OpenAI API service is unavailable';
      } else {
        statusResult.message = `OpenAI API error: ${error.message}`;
      }
    } else if (error.code === 'ECONNABORTED' || error.name === 'AbortError') {
      statusResult.status = 'timeout';
      statusResult.message = 'OpenAI API request timed out';
    } else {
      statusResult.message = `OpenAI API connection error: ${error.message}`;
    }
    
    return statusResult;
  }
};