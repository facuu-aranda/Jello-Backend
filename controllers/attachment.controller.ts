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

        if (!req.file) {
            return res.status(400).json({ error: "No se subió ningún archivo." });
        }

        const task = await Task.findById(taskId).populate('project');
        if (!task) {
            return res.status(404).json({ error: "Tarea no encontrada." });
        }

        const project = task.project as any;
        if (!project.members.some((m: any) => m.user.equals(userId))) {
            return res.status(403).json({ error: "Acción no autorizada." });
        }

        const { originalname, path, size, mimetype } = req.file;

        // --- INICIO DE LA CORRECCIÓN ---
        const newAttachment = {
            // NO creamos un _id aquí. Mongoose lo hará por nosotros.
            name: originalname,
            url: path,
            size: `${(size / 1024).toFixed(1)} KB`,
            type: mimetype.startsWith('image/') ? 'image' : 'document'
        };

        task.attachments.push(newAttachment as any);
        await task.save();

        // Buscamos el último adjunto añadido para devolverlo con el _id que Mongoose generó.
        const createdAttachment = task.attachments[task.attachments.length - 1];
        res.status(201).json(createdAttachment);
        // --- FIN DE LA CORRECCIÓN ---

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