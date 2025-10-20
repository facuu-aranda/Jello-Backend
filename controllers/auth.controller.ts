import { Request, Response } from 'express';
import { User, IUser } from '../models/User.model';
import jwt from 'jsonwebtoken'; import crypto from 'crypto';
import { sendVerificationEmail } from '../services/email.service';

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
    const user = await User.findOne({ email }).select('+password');

    if (!user || !user.password) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    if (!user.isVerified) {
      return res.status(403).json({ error: 'Por favor, verifica tu correo electrónico antes de iniciar sesión.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

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