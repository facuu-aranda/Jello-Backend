import { Request, Response } from 'express';
import Label from '../models/Label.model';
import Project from '../models/Project.model';
import Task from '../models/Task.model';

const checkMembership = async (projectId: string, userId: string) => {
    const project = await Project.findById(projectId);
    if (!project || !project.members.includes(userId as any)) {
        return null;
    }
    return project;
};

export const createLabel = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const { name, color } = req.body;

        const project = await checkMembership(projectId, req.user!.id);
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
        
        const project = await checkMembership(projectId, req.user!.id);
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

        const label = await Label.findById(labelId);
        if (!label) return res.status(404).json({ message: "Etiqueta no encontrada." });
        
        const project = await checkMembership((label.project as any).toString(), req.user!.id);
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

        const label = await Label.findById(labelId);
        if (!label) return res.status(404).json({ message: "Etiqueta no encontrada." });

        const project = await checkMembership((label.project as any).toString(), req.user!.id);
        if (!project) return res.status(403).json({ message: "Acción no autorizada." });
        
        await Label.findByIdAndDelete(labelId);
        
        await Task.updateMany({ labels: labelId }, { $pull: { labels: labelId } });

        res.json({ message: "Etiqueta eliminada con éxito." });
    } catch (error) {
        res.status(500).json({ message: "Error en el servidor", error: (error as Error).message });
    }
};