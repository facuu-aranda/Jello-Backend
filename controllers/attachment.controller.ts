import { Request, Response } from 'express';
import { Task } from '../models/Task.model';
import { IJwtPayload } from '../middleware/auth.middleware';
import mongoose from 'mongoose';

// POST /api/tasks/:taskId/attachments
export const addAttachment = async (req: Request, res: Response) => {
    try {
        const { taskId } = req.params;
        const { name, url, size, type } = req.body;
        const userId = (req.user as IJwtPayload).id;

        const task = await Task.findById(taskId).populate('project');
        if (!task) {
            return res.status(404).json({ error: "Tarea no encontrada." });
        }

        // Verificar que el usuario es miembro del proyecto
        const project = task.project as any;
        if (!project.members.some((m: any) => m.user.equals(userId))) {
            return res.status(403).json({ error: "Acción no autorizada." });
        }

        const newAttachment = {
            _id: new mongoose.Types.ObjectId(),
            name,
            url,
            size,
            type
        };

        task.attachments.push(newAttachment);
        await task.save();

        res.status(201).json(newAttachment);

    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor', details: (error as Error).message });
    }
};

// DELETE /api/tasks/:taskId/attachments/:attachmentId
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
        
        task.attachments.pull({ _id: attachmentId });
        await task.save();

        res.status(204).send();

    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor', details: (error as Error).message });
    }
};