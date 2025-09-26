import { Request, Response } from 'express';
import { Activity } from '../models/Activity.model';
import { Project } from '../models/Project.model';
import { IJwtPayload } from '../middleware/auth.middleware';

// GET /api/activity o /api/activity/recent
export const getRecentActivity = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as IJwtPayload).id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;
    const skip = (page - 1) * limit;

    const userProjects = await Project.find({ 'members.user': userId }).select('_id');
    const projectIds = userProjects.map(p => p._id);

    const activities = await Activity.find({ project: { $in: projectIds } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name avatarUrl')
      .populate('project', 'name')
      .populate('task', 'title');

    // Mapear al formato esperado por el frontend
    const formattedActivities = activities.map(act => ({
      id: act._id,
      type: act.type,
      user: act.user,
      action: act.text.split(' ').slice(1).join(' '), // "ha creado la tarea" -> "creado la tarea"
      target: (act.task as any)?.title || (act.project as any)?.name,
      time: act.createdAt,
      projectId: (act.project as any)._id
    }));

    res.status(200).json(formattedActivities);
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor', details: (error as Error).message });
  }
};