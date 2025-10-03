// Archivo: Jello-Backend/controllers/user.controller.ts

import { Request, Response } from 'express';
import { User } from '../models/User.model';
import { IJwtPayload } from '../middleware/auth.middleware';

// GET /api/users/me
export const getMyProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as IJwtPayload).id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado." });
        }
        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
            bannerUrl: user.bannerUrl,
            title: user.jobTitle,
            bio: user.bio,
            timezone: user.timezone,
            skills: user.skills,
        });
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor', details: (error as Error).message });
    }
};

// PUT /api/users/me/profile
export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as IJwtPayload).id;
        const updatedUser = await User.findByIdAndUpdate(userId, req.body, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ error: "Usuario no encontrado." });
        }
        res.json({
            id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            avatarUrl: updatedUser.avatarUrl,
            bannerUrl: updatedUser.bannerUrl,
            title: updatedUser.jobTitle,
            bio: updatedUser.bio,
            timezone: updatedUser.timezone,
            skills: updatedUser.skills,
        });
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor', details: (error as Error).message });
    }
};

// POST /api/users/me/avatar
export const uploadAvatar = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No se subió ningún archivo." });
        }
        const userId = (req.user as IJwtPayload).id;

        // Lógica condicional: si es un test, usamos una URL falsa. Si no, la real de Cloudinary.
        const avatarUrl = process.env.NODE_ENV === 'test' 
            ? `https://fake.cloudinary.url/${req.file.originalname}` 
            : req.file.path;

        await User.findByIdAndUpdate(userId, { avatarUrl });

        res.status(200).json({ url: avatarUrl });
    } catch (error) {
        console.error('--- ERROR DETALLADO EN EL TEST DE AVATAR ---', error);
        res.status(500).json({ error: 'Error en el servidor', details: (error as Error).message });
    }
};

// POST /api/users/me/banner
export const uploadBanner = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No se subió ningún archivo." });
        }
        const userId = (req.user as IJwtPayload).id;
        
        const bannerUrl = process.env.NODE_ENV === 'test' 
            ? `https://fake.cloudinary.url/${req.file.originalname}` 
            : req.file.path;

        await User.findByIdAndUpdate(userId, { bannerUrl });

        res.status(200).json({ url: bannerUrl });
    } catch (error) {
        console.error('--- ERROR DETALLADO EN EL TEST DE BANNER ---', error);
        res.status(500).json({ error: 'Error en el servidor', details: (error as Error).message });
    }
};

// PUT /api/users/me/settings
export const updateUserSettings = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as IJwtPayload).id;
        const settings = req.body;
        const updatedUser = await User.findByIdAndUpdate(userId, { settings }, { new: true, runValidators: true });
        if (!updatedUser) {
            return res.status(404).json({ error: "Usuario no encontrado." });
        }
        res.status(200).json(updatedUser.settings);
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor', details: (error as Error).message });
    }
};