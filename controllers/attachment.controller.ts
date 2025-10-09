// Jello-Backend/controllers/attachment.controller.ts

import { Request, Response } from 'express';
import { Task } from '../models/Task.model';
import { IJwtPayload } from '../middleware/auth.middleware';
import mongoose from 'mongoose';

// POST /api/tasks/:taskId/attachments
export const addAttachment = async (req: Request, res: Response) => {
    try {
        const { taskId } = req.params;
        const userId = (req.user as IJwtPayload).id;

        // --- INICIO DE LA CORRECCIÓN ---
        // 1. Validar que el archivo fue subido por multer
        if (!req.file) {
            return res.status(400).json({ error: "No se subió ningún archivo." });
        }
        // --- FIN DE LA CORRECCIÓN ---

        const task = await Task.findById(taskId).populate('project');
        if (!task) {
            return res.status(404).json({ error: "Tarea no encontrada." });
        }

        const project = task.project as any;
        if (!project.members.some((m: any) => m.user.equals(userId))) {
            return res.status(403).json({ error: "Acción no autorizada." });
        }

        // --- INICIO DE LA CORRECCIÓN ---
        // 2. Extraer datos del archivo subido (req.file) en lugar de req.body
        const { originalname, path, size, mimetype } = req.file;

        const newAttachment = {
            _id: new mongoose.Types.ObjectId(),
            name: originalname,
            url: path, // La URL de Cloudinary está en 'path'
            size: `${(size / 1024).toFixed(1)} KB`, // Formateamos el tamaño para consistencia
            type: mimetype.startsWith('image/') ? 'image' : 'document' // Determinamos el tipo
        };
        // --- FIN DE LA CORRECCIÓN ---

        task.attachments.push(newAttachment as any);
        await task.save();

        res.status(201).json(newAttachment);

    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor', details: (error as Error).message });
    }
};

// DELETE /api/tasks/:taskId/attachments/:attachmentId
// (Esta función no necesita cambios)
export const deleteAttachment = async (req: Request, res: Response) => {
    try {
        const { taskId, attachmentId } = req.params;
        const userId = (req.user as IJwtPayload).id;

        const task = await Task.findById(taskId).populate('project');
        if (!task) {
            return res.status(404).json({ error: "Tarea no encontrada." });
        }

        const project = task.project as any;
        if (!project.members.some((m: any) => m.user.equals(userId))) {
            return res.status(403).json({ error: "Acción no autorizada." });
        }
        
        (task.attachments as any).pull({ _id: attachmentId });
        await task.save();

        res.status(204).send();

    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor', details: (error as Error).message });
    }
};