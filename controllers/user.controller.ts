import { Request, Response } from 'express';
import { User } from '../models/User.model';
import { IJwtPayload } from '../middleware/auth.middleware';

// GET /api/users/me
// Obtiene el perfil completo del usuario autenticado.
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

// PUT /api/users/me/profile o /api/users/me
// Actualiza el perfil del usuario autenticado.
export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as IJwtPayload).id;
        // El body puede contener cualquier subconjunto de los campos del perfil
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
// Sube una nueva imagen de avatar para el usuario.
export const uploadAvatar = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No se subió ningún archivo." });
        }
        const userId = (req.user as IJwtPayload).id;
        const avatarUrl = req.file.path; // URL de Cloudinary

        await User.findByIdAndUpdate(userId, { avatarUrl });

        res.status(200).json({ url: avatarUrl });
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor', details: (error as Error).message });
    }
};

// POST /api/users/me/banner
// Sube una nueva imagen de banner para el usuario.
export const uploadBanner = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No se subió ningún archivo." });
        }
        const userId = (req.user as IJwtPayload).id;
        const bannerUrl = req.file.path; // URL de Cloudinary

        await User.findByIdAndUpdate(userId, { bannerUrl });

        res.status(200).json({ url: bannerUrl });
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor', details: (error as Error).message });
    }
};

// PUT /api/users/me/settings
// Actualiza la configuración de apariencia y notificaciones del usuario.
export const updateUserSettings = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as IJwtPayload).id;
        const settings = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            { settings }, 
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: "Usuario no encontrado." });
        }

        res.status(200).json(updatedUser.settings);
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor', details: (error as Error).message });
    }
};
