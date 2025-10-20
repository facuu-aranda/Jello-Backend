// Jello-Backend/services/email.service.ts
import { Resend } from 'resend';

// Resend se inicializará automáticamente con la variable de entorno RESEND_API_KEY
const resend = new Resend(process.env.RESEND_API_KEY);
console.log('Initializing Resend with API Key:', process.env.RESEND_API_KEY ? `re_...${process.env.RESEND_API_KEY.slice(-4)}` : 'UNDEFINED or EMPTY');

export const sendVerificationEmail = async (email: string, token: string) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  try {
    await resend.emails.send({
      from: `Jelli Register Assistant <register@jello-app.online>`, 
      to: email,
      subject: 'Verifica tu cuenta en Jello',
      html: `
        <h1>¡Bienvenido a Jello!</h1>
        <p>Por favor, haz clic en el siguiente enlace para verificar tu correo electrónico:</p>
        <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 14px 25px; text-align: center; text-decoration: none; display: inline-block;">
          Verificar mi cuenta
        </a>
        <p>Si no te registraste en Jello, por favor ignora este mensaje.</p>
      `,
    });
  } catch (error) {
    console.error("Error al enviar email con Resend:", error);
    // Relanzamos el error para que el controlador que lo llamó pueda manejarlo
    throw new Error('Error al enviar el correo a través de la API de Resend.');
  }
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

  try {
    await resend.emails.send({
      from: `Jello App <hola@jello-app.online>`,
      to: email,
      subject: 'Restablece tu contraseña de Jello',
      html: `
        <h1>¿Olvidaste tu contraseña?</h1>
        <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el siguiente enlace para continuar:</p>
        <a href="${resetUrl}" style="background-color: #f44336; color: white; padding: 14px 25px; text-align: center; text-decoration: none; display: inline-block;">
          Restablecer Contraseña
        </a>
        <p>El enlace es válido por 10 minutos.</p>
        <p>Si no solicitaste esto, por favor ignora este mensaje.</p>
      `,
    });
  } catch (error) {
    console.error("Error al enviar email de reseteo con Resend:", error);
    throw new Error('Error al enviar el correo de reseteo.');
  }
};