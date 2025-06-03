const nodemailer = require('nodemailer');

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
    this.transporter.verify(function(error, success) {
      if (error) {
        console.error('❌ Error en la configuración del email:', error);
      } else {
        console.log('✅ Servidor de email listo para enviar mensajes');
      }
    });
  }

  async sendVerificationEmail(email, token) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    const mailOptions = {
      from: 'noreply@audiogretel.com',
      to: email,
      subject: '✅ Verifica tu cuenta - Cuentos Personalizados',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎭 Cuentos Personalizados</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Verificación de cuenta</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; text-align: center; margin-bottom: 30px;">¡Bienvenido/a!</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              Gracias por registrarte en Cuentos Personalizados. Para completar tu registro y comenzar a crear historias mágicas, necesitas verificar tu dirección de email.
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
                ✅ Verificar Email
              </a>
            </div>
            
            <p style="color: #888; font-size: 14px; text-align: center; margin-top: 30px;">
              Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:
            </p>
            <p style="color: #667eea; font-size: 14px; text-align: center; word-break: break-all;">
              ${verificationUrl}
            </p>
            
            <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                Este enlace expira en 24 horas. Si no solicitaste esta verificación, puedes ignorar este email.
              </p>
            </div>
          </div>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email de verificación enviado a: ${email}`);
    } catch (error) {
      console.error('❌ Error enviando email de verificación:', error);
      throw new Error('Error enviando email de verificación');
    }
  }

  async sendPasswordResetEmail(email, token) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    const mailOptions = {
      from: 'noreply@audiogretel.com',
      to: email,
      subject: '🔐 Recuperar contraseña - Cuentos Personalizados',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎭 Cuentos Personalizados</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Recuperación de contraseña</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; text-align: center; margin-bottom: 30px;">🔐 Restablecer contraseña</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. Si fuiste tú quien hizo esta solicitud, haz clic en el botón de abajo para crear una nueva contraseña.
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
                🔐 Restablecer Contraseña
              </a>
            </div>
            
            <p style="color: #888; font-size: 14px; text-align: center; margin-top: 30px;">
              Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:
            </p>
            <p style="color: #f5576c; font-size: 14px; text-align: center; word-break: break-all;">
              ${resetUrl}
            </p>
            
            <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                Este enlace expira en 1 hora. Si no solicitaste restablecer tu contraseña, puedes ignorar este email con seguridad.
              </p>
              <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
                Por tu seguridad, nunca compartas este enlace con nadie.
              </p>
            </div>
          </div>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email de recuperación enviado a: ${email}`);
    } catch (error) {
      console.error('❌ Error enviando email de recuperación:', error);
      throw new Error('Error enviando email de recuperación');
    }
  }

  async sendWelcomeEmail(email) {
    const mailOptions = {
      from: 'noreply@audiogretel.com',
      to: email,
      subject: '🎉 ¡Bienvenido/a a Cuentos Personalizados!',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎭 Cuentos Personalizados</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">¡Tu cuenta está lista!</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; text-align: center; margin-bottom: 30px;">🎉 ¡Email verificado exitosamente!</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.5; text-align: center;">
              ¡Felicidades! Tu cuenta ha sido verificada y ya puedes empezar a crear historias mágicas y personalizadas.
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 30px 0;">
              <h3 style="color: #333; margin: 0 0 15px 0;">✨ ¿Qué puedes hacer ahora?</h3>
              <ul style="color: #666; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">📖 Generar hasta 3 cuentos gratuitos al mes</li>
                <li style="margin-bottom: 8px;">🎨 Personalizar historias con nombres y preferencias</li>
                <li style="margin-bottom: 8px;">🔊 Escuchar tus cuentos con audio de alta calidad</li>
                <li style="margin-bottom: 8px;">💎 Actualizar a Premium para cuentos ilimitados</li>
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
                🚀 Comenzar a Crear Cuentos
              </a>
            </div>
            
            <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                ¡Gracias por unirte a nuestra comunidad de narradores!
              </p>
            </div>
          </div>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email de bienvenida enviado a: ${email}`);
    } catch (error) {
      console.error('❌ Error enviando email de bienvenida:', error);
      // No lanzamos error aquí porque es solo informativo
    }
  }
}

module.exports = new EmailService(); 