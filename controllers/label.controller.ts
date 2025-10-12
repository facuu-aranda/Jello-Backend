import { Request, Response } from 'express';
import { Label } from '../models/Label.model';
import { Project } from '../models/Project.model';
import { Task } from '../models/Task.model';
import { IJwtPayload } from '../middleware/auth.middleware';

const checkMembership = async (projectId: string, userId: string) => {
    const project = await Project.findById(projectId);
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
        if (!project) return res.status(403).json({ error: "Acción no autorizada." });

        const newLabel = new Label({ name, color, project: projectId });
        await newLabel.save();
        res.status(201).json(newLabel);
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor", details: (error as Error).message });
    }
};
// (El resto de las funciones de get, update y delete se mantienen, pero asegúrate de que usen `req.user as IJwtPayload`)

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


export const batchUpdateLabels = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const { add, delete: deleteIds } = req.body; 
        const user = req.user as IJwtPayload;

        const project = await checkMembership(projectId, user.id);
        if (!project) return res.status(403).json({ error: "Acción no autorizada." });

        if (deleteIds && deleteIds.length > 0) {
            await Label.deleteMany({ _id: { $in: deleteIds }, project: projectId });
            await Task.updateMany({ project: projectId }, { $pull: { labels: { $in: deleteIds } } });
        }

        if (add && add.length > 0) {
            const newLabels = add.map((label: { name: string, color: string }) => ({
                ...label,
                project: projectId,
            }));
            await Label.insertMany(newLabels);
        }

        res.status(200).json({ message: "Labels actualizados correctamente." });

    } catch (error) {
        res.status(500).json({ error: "Error en el servidor", details: (error as Error).message });
    }
};