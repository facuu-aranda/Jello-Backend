import { Request, Response } from 'express';
import Project from '../models/Project.model';
import Task from '../models/Task.model';
import User from '../models/User.model';
import { IJwtPayload } from '../middleware/auth.middleware';

export const globalSearch = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as IJwtPayload).id;
        const query = req.query.q as string;

        if (!query) {
            return res.status(400).json({ message: "Se requiere un término de búsqueda." });
        }

        const searchRegex = new RegExp(query, 'i'); // 'i' para búsqueda insensible a mayúsculas

        // 1. Encontrar los IDs de los proyectos del usuario
        const userProjects = await Project.find({ 'members.user': userId }).select('_id');
        const projectIds = userProjects.map(p => p._id);

        // 2. Buscar en paralelo en Proyectos, Tareas y Usuarios
        const [projects, tasks, users] = await Promise.all([
            // Busca en los proyectos del usuario
            Project.find({
                _id: { $in: projectIds },
                name: searchRegex
            }).limit(5),

            // Busca en las tareas de esos proyectos
            Task.find({
                project: { $in: projectIds },
                title: searchRegex
            }).limit(5),

            // Busca en todos los usuarios de la plataforma (para poder invitar gente nueva)
            User.find({
                name: searchRegex
            }).select('name avatarUrl').limit(5)
        ]);

        // 3. Formatear los resultados en una estructura unificada
        const formattedProjects = projects.map(p => ({
            id: p._id,
            type: 'project',
            name: p.name,
            link: `/project/${p._id}`
        }));

        const formattedTasks = tasks.map(t => ({
            id: t._id,
            type: 'task',
            name: t.title,
            link: `/project/${t.project}/tasks/${t._id}` // Link a la tarea
        }));
        
        const formattedUsers = users.map(u => ({
            id: u._id,
            type: 'user',
            name: u.name,
            avatarUrl: u.avatarUrl
        }));

        // 4. Combinar y enviar los resultados
        const results = [...formattedProjects, ...formattedTasks, ...formattedUsers];

        res.json(results);

    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
    }
};