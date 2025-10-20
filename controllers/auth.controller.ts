import { Request, Response } from 'express';
import { User, IUser } from '../models/User.model';
import jwt from 'jsonwebtoken'; import crypto from 'crypto';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email.service';

// POST /api/auth/register
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'El correo ya está en uso' });
    }

    const newUser = new User({ name, email, password, isVerified: false });

    // Generar token de verificación
    const verificationToken = crypto.randomBytes(32).toString('hex');

    newUser.verificationToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    // El token expira en 10 minutos
    newUser.verificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000);

    await newUser.save();

    // Enviar el correo de verificación
    try {
      await sendVerificationEmail(newUser.email, verificationToken);

      res.status(201).json({
        message: 'Registro exitoso. Por favor, revisa tu correo para activar tu cuenta.'
      });

    } catch (emailError) {
      console.error("Error al enviar email de verificación:", emailError);
      return res.status(500).json({ error: 'No se pudo enviar el correo de verificación. Inténtalo de nuevo más tarde.' });
    }

  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor', details: (error as Error).message });
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, rememberMe = false } = req.body;
    // Buscamos al usuario y pedimos explícitamente los campos de verificación
    const user = await User.findOne({ email }).select('+password +isVerified +verificationTokenExpires');

    if (!user || !user.password) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // --- LÓGICA DE VERIFICACIÓN MEJORADA ---
    if (!user.isVerified) {
      // Comprobamos si hay un token de verificación activo
      const now = new Date();
      if (user.verificationTokenExpires && user.verificationTokenExpires > now) {
        // Si hay un token activo, simplemente le recordamos al usuario que verifique
        return res.status(403).json({ 
          error: 'Tu cuenta no está verificada. Por favor, revisa tu correo electrónico.' 
        });
      }

      // Si no hay token o ha expirado, generamos y enviamos uno nuevo.
      const verificationToken = crypto.randomBytes(32).toString('hex');
      user.verificationToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');
      user.verificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos
      
      await user.save();
      await sendVerificationEmail(user.email, verificationToken);

      return res.status(403).json({ 
        error: 'Tu cuenta no está verificada. Te hemos enviado un nuevo correo de activación.' 
      });
    }
    // --- FIN DE LA LÓGICA MEJORADA ---

    const payload = { id: user._id, name: user.name };
    const expiresIn = rememberMe ? '7d' : '48h';
    const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn });

    const userProfile = {
        id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        bannerUrl: user.bannerUrl,
        title: user.jobTitle,
        bio: user.bio,
        timezone: user.timezone,
        skills: user.skills,
    };
    res.json({ token, user: userProfile });

  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor', details: (error as Error).message });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    // Hashear el token recibido para compararlo con el de la BD
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).redirect(`${process.env.FRONTEND_URL}/verification-failed?error=invalid_token`);
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    // Redirigir al frontend a una página de éxito
    res.redirect(`${process.env.FRONTEND_URL}/verification-success`);

  } catch (error) {
    res.status(500).redirect(`${process.env.FRONTEND_URL}/verification-failed?error=server_error`);
  }
};

// POST /api/auth/resend-verification
export const resendVerificationEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'El correo electrónico es requerido.' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({ message: 'Si existe una cuenta con este correo, se ha enviado un nuevo enlace de verificación.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'Esta cuenta ya ha sido verificada.' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    user.verificationToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');
      
    user.verificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000);

    await user.save();

    try {
      await sendVerificationEmail(user.email, verificationToken);
      
      res.status(200).json({ 
        message: 'Se ha enviado un nuevo enlace de verificación a tu correo.' 
      });

    } catch (emailError) {
      console.error("Error al reenviar email de verificación:", emailError);
      return res.status(500).json({ error: 'No se pudo reenviar el correo de verificación. Inténtalo de nuevo más tarde.' });
    }

  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor', details: (error as Error).message });
  }
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Por seguridad, siempre enviamos una respuesta positiva para no revelar si un usuario existe.
    if (!user) {
      return res.status(200).json({ message: 'Si tu correo está en nuestra base de datos, recibirás un enlace para restablecer tu contraseña.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    user.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // Válido por 10 min

    await user.save();

    try {
      await sendPasswordResetEmail(user.email, resetToken);
      res.status(200).json({ message: 'Si tu correo está en nuestra base de datos, recibirás un enlace para restablecer tu contraseña.' });
    } catch (error) {
      // Limpiamos los tokens si el email falla para que el usuario pueda reintentar
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      return res.status(500).json({ error: 'No se pudo enviar el correo de restablecimiento.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
};


// PUT /api/auth/reset-password/:token
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: 'El token es inválido o ha expirado.' });
    }

    // Actualizamos la contraseña y dejamos que el hook `pre.save` la hashee
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();
    
    // Opcional: podrías loguear al usuario aquí generando un JWT.
    // Por ahora, solo confirmamos el cambio.
    res.status(200).json({ message: 'Tu contraseña ha sido restablecida con éxito.' });

  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
};