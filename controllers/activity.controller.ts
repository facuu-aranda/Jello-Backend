import { Request, Response } from 'express';
import Activity from '../models/Activity.model';
import Project from '../models/Project.model';
import { IJwtPayload } from '../middleware/auth.middleware';

// GET /api/activity/recent - Obtiene las actividades recientes del usuario
export const getRecentActivity = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as IJwtPayload).id;

    // 1. Encontrar todos los proyectos de los que el usuario es miembro.
    const userProjects = await Project.find({ 'members.user': userId }).select('_id');
    const projectIds = userProjects.map(p => p._id);

    // 2. Buscar las 15 actividades más recientes en esos proyectos.
    const activities = await Activity.find({ project: { $in: projectIds } })
      .sort({ createdAt: -1 })
      .limit(15)
      .populate('user', 'name avatarUrl') // Datos del usuario que hizo la acción
      .populate('project', 'name')        // Nombre del proyecto
      .populate('task', 'title');         // Título de la tarea

    res.status(200).json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
  }
};