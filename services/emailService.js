const nodemailer = require('nodemailer');
const translations = require('../utils/translations');

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

module.exports = new EmailService(); 