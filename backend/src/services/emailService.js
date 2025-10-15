// src/services/emailService.js
import nodemailer from 'nodemailer';

// Configurar transporter de nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Enviar email de verificación de cuenta
 */
export const sendVerificationEmail = async (email, code, firstName) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: '🔐 Código de verificación - Balancea',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1976d2; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .code { background: white; border: 2px dashed #1976d2; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; color: #1976d2; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 ¡Bienvenido a Balancea!</h1>
          </div>
          <div class="content">
            <h2>Hola ${firstName},</h2>
            <p>Gracias por registrarte en Balancea. Para completar tu registro, por favor verifica tu cuenta con el siguiente código:</p>
            <div class="code">${code}</div>
            <p><strong>Este código expirará en 15 minutos.</strong></p>
            <p>Si no solicitaste este registro, por favor ignora este correo.</p>
          </div>
          <div class="footer">
            <p>© 2025 Balancea - Tu gestor de finanzas personales</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de verificación enviado a: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error al enviar email de verificación:', error);
    throw new Error('Error al enviar email de verificación');
  }
};

/**
 * Enviar email de recuperación de contraseña
 */
export const sendPasswordResetEmail = async (email, code, firstName) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: '🔒 Código de recuperación de contraseña - Balancea',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc004e; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .code { background: white; border: 2px dashed #dc004e; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; color: #dc004e; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Recuperación de Contraseña</h1>
          </div>
          <div class="content">
            <h2>Hola ${firstName},</h2>
            <p>Recibimos una solicitud para restablecer tu contraseña. Usa el siguiente código para continuar:</p>
            <div class="code">${code}</div>
            <p><strong>Este código expirará en 15 minutos.</strong></p>
            <p>Si no solicitaste este cambio, ignora este correo y tu contraseña permanecerá sin cambios.</p>
          </div>
          <div class="footer">
            <p>© 2025 Balancea - Tu gestor de finanzas personales</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de recuperación enviado a: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error al enviar email de recuperación:', error);
    throw new Error('Error al enviar email de recuperación');
  }
};