const nodemailer = require('nodemailer');
const translations = require('../utils/translations');
const { admin } = require('../config/firebase');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // use SSL
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // This should be an App Password
      },
      tls: {
        rejectUnauthorized: false // Only use this in development
      }
    });

    // Verify connection configuration
    this.transporter.verify((error, success) => {
      if (error) {
        console.error(translations.getTranslation('system.emailConfigError', 'en'), error);
      } else {
        console.log(translations.getTranslation('system.emailServerReady', 'en'));
      }
    });
  }

  async sendVerificationEmail(email, token, language = 'en') {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    const t = translations.getTranslation.bind(translations);
    
    const mailOptions = {
      from: 'noreply@audiogretel.com',
      to: email,
      subject: t('verification.subject', language),
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">${t('verification.title', language)}</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">${t('verification.subtitle', language)}</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; text-align: center; margin-bottom: 30px;">${t('verification.welcome', language)}</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              ${t('verification.message', language)}
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        font-weight: bold; 
                        font-size: 16px;
                        display: inline-block;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                ${t('verification.buttonText', language)}
              </a>
            </div>
            
            <p style="color: #888; font-size: 14px; text-align: center; margin-top: 30px;">
              ${t('verification.cantClickButton', language)}
            </p>
            <p style="color: #667eea; font-size: 14px; text-align: center; word-break: break-all;">
              ${verificationUrl}
            </p>
            
            <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                ${t('verification.expiration', language)}
              </p>
            </div>
          </div>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(translations.getTranslation('system.verificationEmailSent', language), email);
    } catch (error) {
      console.error(translations.getTranslation('system.verificationEmailError', language), error);
      throw new Error(translations.getTranslation('system.verificationEmailError', language));
    }
  }

  async sendPasswordResetEmail(email, token, language = 'en') {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const t = translations.getTranslation.bind(translations);
    
    const mailOptions = {
      from: 'noreply@audiogretel.com',
      to: email,
      subject: t('passwordReset.subject', language),
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">${t('passwordReset.title', language)}</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">${t('passwordReset.subtitle', language)}</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; text-align: center; margin-bottom: 30px;">${t('passwordReset.heading', language)}</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              ${t('passwordReset.message', language)}
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        font-weight: bold; 
                        font-size: 16px;
                        display: inline-block;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                ${t('passwordReset.buttonText', language)}
              </a>
            </div>
            
            <p style="color: #888; font-size: 14px; text-align: center; margin-top: 30px;">
              ${t('passwordReset.cantClickButton', language)}
            </p>
            <p style="color: #f5576c; font-size: 14px; text-align: center; word-break: break-all;">
              ${resetUrl}
            </p>
            
            <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                ${t('passwordReset.expiration', language)}
              </p>
              <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
                ${t('passwordReset.securityNote', language)}
              </p>
            </div>
          </div>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(translations.getTranslation('system.passwordResetEmailSent', language), email);
    } catch (error) {
      console.error(translations.getTranslation('system.passwordResetEmailError', language), error);
      throw new Error(translations.getTranslation('system.passwordResetEmailError', language));
    }
  }

  async sendWelcomeEmail(email, language = 'en') {
    const t = translations.getTranslation.bind(translations);
    
    const mailOptions = {
      from: 'noreply@audiogretel.com',
      to: email,
      subject: t('welcome.subject', language),
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">${t('welcome.title', language)}</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">${t('welcome.subtitle', language)}</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; text-align: center; margin-bottom: 30px;">${t('welcome.heading', language)}</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.5; text-align: center;">
              ${t('welcome.message', language)}
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 30px 0;">
              <h3 style="color: #333; margin: 0 0 15px 0;">${t('welcome.featuresTitle', language)}</h3>
              <ul style="color: #666; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">${t('welcome.features.freeStories', language)}</li>
                <li style="margin-bottom: 8px;">${t('welcome.features.customize', language)}</li>
                <li style="margin-bottom: 8px;">${t('welcome.features.audio', language)}</li>
                <li style="margin-bottom: 8px;">${t('welcome.features.premium', language)}</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}" 
                 style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        font-weight: bold; 
                        font-size: 16px;
                        display: inline-block;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                ${t('welcome.buttonText', language)}
              </a>
            </div>
            
            <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                ${t('welcome.footer', language)}
              </p>
            </div>
          </div>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(translations.getTranslation('system.welcomeEmailSent', language), email);
    } catch (error) {
      console.error(translations.getTranslation('system.welcomeEmailError', language), error);
      // No lanzamos error aquí porque es solo informativo
    }
  }
}

const APP_NAME = 'AudioGretel';
const APP_URL = 'https://audiogretel.com';
const SUPPORT_EMAIL = 'support@audiogretel.com';

/**
 * Send custom verification email
 */
async function sendCustomVerificationEmail(user, verificationLink) {
  try {
    const customToken = await admin.auth().createCustomToken(user.uid);
    
    const emailContent = {
      to: user.email,
      subject: `${APP_NAME} - Verify your email address`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎨 ${APP_NAME}</h1>
              <p>AI-powered personalized audio stories</p>
            </div>
            <div class="content">
              <h2>Welcome to ${APP_NAME}!</h2>
              <p>Thank you for signing up for ${APP_NAME}, the leading platform for AI-generated personalized audio stories.</p>
              
              <p>To complete your registration and start creating unique stories for your children, please verify your email address:</p>
              
              <div style="text-align: center;">
                <a href="${verificationLink}" class="button">Verify my account</a>
              </div>
              
              <p><strong>What can you do with ${APP_NAME}?</strong></p>
              <ul>
                <li>🎭 Create personalized stories with unique protagonists</li>
                <li>🌍 Generate stories in Spanish, English, and French</li>
                <li>👶 Age-appropriate content for different groups (3-5, 6-8, 9-12)</li>
                <li>🎵 Professional audio with narration and music</li>
                <li>📚 Perfect for language learning</li>
              </ul>
              
              <p>If you didn't create an account with ${APP_NAME}, you can safely ignore this email.</p>
              
              <p>We hope you enjoy creating magical stories!</p>
              
              <p>Best regards,<br>The ${APP_NAME} Team</p>
            </div>
            <div class="footer">
              <p>🌐 <a href="${APP_URL}">${APP_URL}</a> | 📧 <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
              <p>&copy; 2025 ${APP_NAME}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    console.log(`📧 Custom verification email sent to: ${user.email}`);
    return emailContent;
    
  } catch (error) {
    console.error('❌ Error sending custom verification email:', error);
    throw error;
  }
}

/**
 * Send welcome email after successful verification
 */
async function sendWelcomeEmail(user) {
  try {
    const emailContent = {
      to: user.email,
      subject: `Welcome to ${APP_NAME}! 🎉`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .feature { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Account verified!</h1>
              <p>Your ${APP_NAME} adventure starts now</p>
            </div>
            <div class="content">
              <h2>Hello!</h2>
              <p>Your ${APP_NAME} account has been successfully verified. You can now start creating amazing audio stories!</p>
              
              <div style="text-align: center;">
                <a href="${APP_URL}/herramientas/generador-audiocuentos" class="button">Create my first story</a>
              </div>
              
              <h3>🚀 Getting started:</h3>
              
              <div class="feature">
                <h4>1. 🎭 Personalize your story</h4>
                <p>Choose the protagonist's name, age, language, and story theme</p>
              </div>
              
              <div class="feature">
                <h4>2. 🤖 AI generates content</h4>
                <p>Our artificial intelligence creates a unique story in seconds</p>
              </div>
              
              <div class="feature">
                <h4>3. 🎵 Enjoy the audio</h4>
                <p>Listen to professional narration with background music</p>
              </div>
              
              <h3>💡 Tips for better results:</h3>
              <ul>
                <li>Use real names to make the story more personal</li>
                <li>Try different languages for multilingual learning</li>
                <li>Explore various themes: adventure, fantasy, science...</li>
                <li>Adjust age settings for appropriate content</li>
              </ul>
              
              <p>Need help? Visit our <a href="${APP_URL}/como-generar-audiocuentos-ia">complete guide</a> or contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
              
              <p>Enjoy creating magical stories!</p>
              
              <p>The ${APP_NAME} Team 🌟</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    console.log(`📧 Welcome email sent to: ${user.email}`);
    return emailContent;
    
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    throw error;
  }
}

/**
 * Send password reset email with custom template
 */
async function sendCustomPasswordResetEmail(user, resetLink) {
  try {
    const emailContent = {
      to: user.email,
      subject: `${APP_NAME} - Reset your password`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc3545; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔑 ${APP_NAME}</h1>
              <p>Password reset request</p>
            </div>
            <div class="content">
              <h2>Password reset request</h2>
              <p>We received a request to reset the password for your ${APP_NAME} account.</p>
              
              <div style="text-align: center;">
                <a href="${resetLink}" class="button">Create new password</a>
              </div>
              
              <div class="warning">
                <strong>⚠️ Important information:</strong>
                <ul>
                  <li>This link will expire in 1 hour for security</li>
                  <li>You can only use this link once</li>
                  <li>If you didn't request this change, ignore this email</li>
                </ul>
              </div>
              
              <p>After creating your new password, you can continue enjoying:</p>
              <ul>
                <li>🎭 Unlimited personalized stories</li>
                <li>🌍 Stories in multiple languages</li>
                <li>📚 Your personal audio story library</li>
                <li>⭐ Favorites and rating system</li>
              </ul>
              
              <p>If you have problems, contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
              
              <p>Best regards,<br>The ${APP_NAME} Team</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    console.log(`📧 Password reset email sent to: ${user.email}`);
    return emailContent;
    
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw error;
  }
}

module.exports = {
  sendCustomVerificationEmail,
  sendWelcomeEmail,
  sendCustomPasswordResetEmail,
  APP_NAME,
  APP_URL,
  SUPPORT_EMAIL
}; 