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
        
        // 1. Extraemos los datos del cuerpo de la petición.
        const { name, bio, title, timezone, skills } = req.body;

        // 2. Creamos un objeto para la actualización, mapeando los nombres correctos.
        const updateData: any = {
            name,
            bio,
            jobTitle: title, // <-- Aquí está la corrección clave
            timezone,
            skills,
        };

        // 3. Eliminamos cualquier campo que no se haya enviado para no sobrescribir con 'undefined'.
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

        // 4. Actualizamos la base de datos con los datos ya mapeados.
        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        
        // 5. Devolvemos el perfil completo y bien formateado, igual que en getMyProfile.
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
        
        const avatarUrl = req.file.path;

        // 1. Actualizamos el usuario y le pedimos que nos devuelva el documento actualizado.
        const updatedUser = await User.findByIdAndUpdate(userId, { avatarUrl }, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ error: "Usuario no encontrado." });
        }

        // 2. Devolvemos el perfil de usuario completo y formateado.
        res.status(200).json({
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

// POST /api/users/me/banner
export const uploadBanner = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No se subió ningún archivo." });
        }
        const userId = (req.user as IJwtPayload).id;
        
        const bannerUrl = req.file.path;

        // 1. Actualizamos y obtenemos el usuario completo.
        const updatedUser = await User.findByIdAndUpdate(userId, { bannerUrl }, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ error: "Usuario no encontrado." });
        }

        // 2. Devolvemos el perfil de usuario completo y formateado.
        res.status(200).json({
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