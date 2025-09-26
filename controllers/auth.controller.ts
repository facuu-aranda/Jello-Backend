import { Request, Response } from 'express';
import { User, IUser } from '../models/User.model';
import jwt from 'jsonwebtoken';

// POST /api/auth/register
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'El correo ya está en uso' });
    }

    const newUser = new User({ name, email, password });
    const savedUser = await newUser.save();

    const payload = { id: savedUser._id, name: savedUser.name };
    const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '48h' });

    // Devolver UserProfile
    const userProfile = {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        avatarUrl: savedUser.avatarUrl,
        bannerUrl: savedUser.bannerUrl,
        title: savedUser.jobTitle,
        bio: savedUser.bio,
        timezone: savedUser.timezone,
        skills: savedUser.skills,
    };
    
    res.status(201).json({ token, user: userProfile });

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