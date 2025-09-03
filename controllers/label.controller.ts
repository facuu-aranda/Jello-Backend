// controllers/label.controller.ts
import { Request, Response } from 'express';
import Label from '../models/Label.model';
import Project from '../models/Project.model';
import Task from '../models/Task.model';
import { IJwtPayload } from '../middleware/auth.middleware';

// Función de ayuda para verificar la membresía
const checkMembership = async (projectId: string, userId: string) => {
    const project = await Project.findById(projectId);
    // CORRECCIÓN: La comprobación ahora busca dentro del array de objetos 'members'
    if (!project || !project.members.some(m => (m.user as any).equals(userId))) {
        return null;
    }
    return project;
};

export const createLabel = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const { name, color } = req.body;
        const user = req.user as IJwtPayload;

        const project = await checkMembership(projectId, user.id);
        if (!project) return res.status(403).json({ message: "Acción no autorizada." });

        const newLabel = new Label({ name, color, project: projectId });
        await newLabel.save();
        res.status(201).json(newLabel);
    } catch (error) {
        res.status(500).json({ message: "Error en el servidor", error: (error as Error).message });
    }
};

export const getLabelsForProject = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const user = req.user as IJwtPayload;
        
        const project = await checkMembership(projectId, user.id);
        if (!project) return res.status(403).json({ message: "Acción no autorizada." });
        
        const labels = await Label.find({ project: projectId });
        res.json(labels);
    } catch (error) {
        res.status(500).json({ message: "Error en el servidor", error: (error as Error).message });
    }
};

export const updateLabel = async (req: Request, res: Response) => {
    try {
        const { labelId } = req.params;
        const { name, color } = req.body;
        const user = req.user as IJwtPayload;

        const label = await Label.findById(labelId);
        if (!label) return res.status(404).json({ message: "Etiqueta no encontrada." });
        
        const project = await checkMembership((label.project as any).toString(), user.id);
        if (!project) return res.status(403).json({ message: "Acción no autorizada." });

        const updatedLabel = await Label.findByIdAndUpdate(labelId, { name, color }, { new: true });
        res.json(updatedLabel);
    } catch (error) {
        res.status(500).json({ message: "Error en el servidor", error: (error as Error).message });
    }
};

export const deleteLabel = async (req: Request, res: Response) => {
    try {
        const { labelId } = req.params;
        const user = req.user as IJwtPayload;

        const label = await Label.findById(labelId);
        if (!label) return res.status(404).json({ message: "Etiqueta no encontrada." });

        const project = await checkMembership((label.project as any).toString(), user.id);
        if (!project) return res.status(403).json({ message: "Acción no autorizada." });
        
        await Label.findByIdAndDelete(labelId);
        
        await Task.updateMany({ labels: labelId }, { $pull: { labels: labelId } });

        res.json({ message: "Etiqueta eliminada con éxito." });
    } catch (error) {
        res.status(500).json({ message: "Error en el servidor", error: (error as Error).message });
    }
};