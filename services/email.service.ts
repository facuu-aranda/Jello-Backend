import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
console.log('Initializing Resend with API Key:', process.env.RESEND_API_KEY ? `re_...${process.env.RESEND_API_KEY.slice(-4)}` : 'UNDEFINED or EMPTY');

export const sendVerificationEmail = async (email: string, token: string) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  try {
  await resend.emails.send({
    from: `Jelli Register Assistant <register@jello-app.online>`,
    to: email,
    subject: '🎉 Verifica tu cuenta en Jello',
    html: `
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; font-family: 'Inter', sans-serif; color: #333; box-shadow: 0 8px 20px rgba(0,0,0,0.08);">
        <div style="background: linear-gradient(135deg, #8b5cf6, #ec4899); padding: 24px; text-align: center;">
          <img src="../assets/jelli-avatar.png" alt="Jelli Assistant" width="70" style="border-radius: 50%; background: rgba(255,255,255,0.15); padding: 8px;" />
          <h1 style="color: #fff; margin: 16px 0 0; font-size: 24px;">¡Bienvenido a Jello!</h1>
        </div>

        <div style="padding: 24px;">
          <p style="font-size: 16px; line-height: 1.5;">
            Gracias por unirte a <strong>Jello</strong> 💙<br/>
            Para completar tu registro y empezar a usar la app, necesitamos verificar tu correo electrónico.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background: linear-gradient(135deg, #8b5cf6, #ec4899); color: #fff; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
              Verificar mi cuenta
            </a>
          </div>

          <p style="font-size: 14px; color: #555;">
            Si no creaste una cuenta en Jello, simplemente ignora este mensaje.<br/>
            ¡Esperamos verte pronto!
          </p>
        </div>

        <div style="background: #f9fafb; text-align: center; padding: 16px; font-size: 12px; color: #777;">
          © ${new Date().getFullYear()} Jello App. Todos los derechos reservados.
        </div>
      </div>
    `,
  });
}
 catch (error) {
    console.error("Error al enviar email con Resend:", error);
    throw new Error('Error al enviar el correo a través de la API de Resend.');
  }
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

  try {
  await resend.emails.send({
    from: `Jello App <hola@jello-app.online>`,
    to: email,
    subject: '🔐 Restablece tu contraseña en Jello',
    html: `
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; font-family: 'Inter', sans-serif; color: #333; box-shadow: 0 8px 20px rgba(0,0,0,0.08);">
        <div style="background: linear-gradient(135deg, #00A3E0, #14b8a6); padding: 24px; text-align: center;">
          <img src="../assets/jelli-avatar.png" alt="Jello Logo" width="70" style="border-radius: 50%; background: rgba(255,255,255,0.15); padding: 8px;" />
          <h1 style="color: #fff; margin: 16px 0 0; font-size: 24px;">¿Olvidaste tu contraseña?</h1>
        </div>

        <div style="padding: 24px;">
          <p style="font-size: 16px; line-height: 1.5;">
            ¡Hola! Recibimos una solicitud para restablecer tu contraseña de <strong>Jello</strong>.
            Si fuiste tú, puedes crear una nueva contraseña haciendo clic en el siguiente botón:
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(135deg, #00A3E0, #14b8a6); color: #fff; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
              Restablecer contraseña
            </a>
          </div>

          <p style="font-size: 14px; color: #555;">
            El enlace es válido por <strong>10 minutos</strong>.<br/>
            Si no solicitaste este cambio, puedes ignorar este mensaje sin problema.
          </p>
        </div>

        <div style="background: #f9fafb; text-align: center; padding: 16px; font-size: 12px; color: #777;">
          © ${new Date().getFullYear()} Jello App. Todos los derechos reservados.
        </div>
      </div>
    `,
  });

  } catch (error) {
    console.error("Error al enviar email de reseteo con Resend:", error);
    throw new Error('Error al enviar el correo de reseteo.');
  }
};