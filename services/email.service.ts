// Jello-Backend/services/email.service.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_SECURE === 'true', 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (email: string, token: string) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"Jello App" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
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
  };

  await transporter.sendMail(mailOptions);
};