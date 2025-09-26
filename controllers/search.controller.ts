import { Request, Response } from 'express';
import { Project } from '../models/Project.model';
import { User } from '../models/User.model';
import { IJwtPayload } from '../middleware/auth.middleware';

export const globalSearch = async (req: Request, res: Response) => {
    try {
        const query = req.query.q as string;
        const type = req.query.type as "all" | "user" | "project";

        if (!query) {
            return res.status(400).json({ error: "Se requiere un término de búsqueda." });
        }
        const searchRegex = new RegExp(query, 'i');
        
        let results = [];

        if (type === 'project' || type === 'all' || !type) {
            const projects = await Project.find({ name: searchRegex }).limit(10);
            results.push(...projects.map(p => ({
                type: 'project',
                id: p._id,
                name: p.name,
                description: p.description,
                avatar: p.projectImageUrl
            })));
        }

        if (type === 'user' || type === 'all' || !type) {
            const users = await User.find({ name: searchRegex }).limit(10);
            results.push(...users.map(u => ({
                type: 'user',
                id: u._id,
                name: u.name,
                description: u.jobTitle,
                avatar: u.avatarUrl
            })));
        }
        
        res.json(results);

    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor', details: (error as Error).message });
    }
};