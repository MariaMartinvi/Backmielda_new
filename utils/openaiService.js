// utils/openaiService.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const { constructPrompt, extractTitle } = require('./helpers');

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

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

exports.generateCompletion = async (prompt, systemMessage, storyParams) => {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🤖 LLAMADA A OPENAI API - PROMPT COMPLETO');
    console.log('='.repeat(80));
    
    console.log('\n📋 PARÁMETROS DE LA HISTORIA:');
    console.log('----------------------------');
    console.log('Idioma:', storyParams.language || 'No especificado');
    console.log('Tema:', storyParams.topic || 'No especificado');
    console.log('Longitud:', storyParams.storyLength || 'No especificado');
    console.log('Tipo:', storyParams.storyType || 'No especificado');
    console.log('Creatividad:', storyParams.creativityLevel || 'No especificado');
    console.log('Grupo de edad:', storyParams.ageGroup || 'No especificado');
    console.log('Nombres de niños:', storyParams.childNames || 'Ninguno');
    console.log('Nivel de inglés:', storyParams.englishLevel || 'No especificado');
    console.log('Nivel de español:', storyParams.spanishLevel || 'No especificado');
    
    console.log('\n🎭 MENSAJE DEL SISTEMA (SYSTEM MESSAGE):');
    console.log('----------------------------------------');
    console.log(systemMessage);
    
    console.log('\n📝 PROMPT DEL USUARIO (USER PROMPT):');
    console.log('------------------------------------');
    console.log(prompt);
    
    console.log('\n🔧 CONFIGURACIÓN DE OPENAI:');
    console.log('---------------------------');
    console.log('Modelo: gpt-4o');
    console.log('Temperatura: 0.7');
    console.log('Max tokens: 2000');
    
    console.log('\n' + '='.repeat(80));
    console.log('🚀 ENVIANDO SOLICITUD A OPENAI...');
    console.log('='.repeat(80));
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    if (!completion.choices || !completion.choices[0] || !completion.choices[0].message) {
      console.error('❌ Respuesta inválida de OpenAI:', completion);
      throw new Error('Invalid response from OpenAI API');
    }

    const storyContent = completion.choices[0].message.content;
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ RESPUESTA RECIBIDA DE OPENAI');
    console.log('='.repeat(80));
    console.log('\n📖 CONTENIDO GENERADO:');
    console.log('----------------------');
    console.log(storyContent);
    
    console.log('\n📊 ESTADÍSTICAS DE USO:');
    console.log('-----------------------');
    if (completion.usage) {
      console.log('Tokens del prompt:', completion.usage.prompt_tokens || 'No disponible');
      console.log('Tokens de la respuesta:', completion.usage.completion_tokens || 'No disponible');
      console.log('Total de tokens:', completion.usage.total_tokens || 'No disponible');
    } else {
      console.log('Información de uso no disponible');
    }

    // Extraer título y contenido
    const { title, content } = extractTitle(storyContent, storyParams.topic, storyParams.language);
    
    console.log('\n🏷️ PROCESAMIENTO FINAL:');
    console.log('-----------------------');
    console.log('Título extraído:', title);
    console.log('Longitud del contenido:', content.length, 'caracteres');
    console.log('Palabras aproximadas:', Math.round(content.split(' ').length));
    
    console.log('\n' + '='.repeat(80));
    console.log('🎉 GENERACIÓN COMPLETADA EXITOSAMENTE');
    console.log('='.repeat(80) + '\n');

    return {
      title,
      content,
      language: storyParams.language
    };
  } catch (error) {
    console.log('\n' + '='.repeat(80));
    console.log('❌ ERROR EN LA LLAMADA A OPENAI');
    console.log('='.repeat(80));
    console.error('Detalles del error:', error.message);
    if (error.response) {
      console.error('Respuesta de error de OpenAI:', error.response.data);
    }
    console.log('='.repeat(80) + '\n');
    throw error;
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
      model: 'gpt-4o',
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
      model: 'gpt-4o',
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