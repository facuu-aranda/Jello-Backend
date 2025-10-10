import { Request, Response } from 'express';
import { Project, IProject } from '../models/Project.model';
import { User } from '../models/User.model';
import { Task } from '../models/Task.model';
import { Comment } from '../models/Comment.model';
import { Notification } from '../models/Notification.model';
import { IJwtPayload } from '../middleware/auth.middleware';
import mongoose from 'mongoose';
import { Activity } from '../models/Activity.model'; 

const getTypedUser = (req: Request): IJwtPayload => {
    return req.user as IJwtPayload;
}

export const createProject = async (req: Request, res: Response) => {
  try {
    // CORRECCIÓN: Se leen los campos directamente del req.body, no de un campo 'data'.
    const { name, description, color, members, dueDate } = req.body;
    const ownerId = getTypedUser(req)?.id;

    if (!ownerId) {
      return res.status(401).json({ message: 'Usuario no autenticado.' });
    }

    const newProjectData: any = { name, description, color, dueDate, owner: ownerId };
    
    // Se procesan los archivos subidos por Multer
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files && files.projectImage) {
        newProjectData.projectImageUrl = files.projectImage[0].path;
    }
    if (files && files.bannerImage) {
        newProjectData.bannerImageUrl = files.bannerImage[0].path;
    }

    const parsedMembers = members && typeof members === 'string' ? JSON.parse(members) : (members || []);
    const initialMembers = parsedMembers.map((m: { user: string, role: string }) => ({ user: m.user, role: m.role || 'member' })) || [];

    const ownerInMembers = initialMembers.some((m: { user: string }) => m.user === ownerId);
    if (!ownerInMembers) {
        initialMembers.push({ user: ownerId, role: 'admin' });
    }
    newProjectData.members = initialMembers;
    
    const newProject = new Project(newProjectData);
    await newProject.save();
    const populatedProject = await newProject.populate('members.user', 'name avatarUrl');
    
    const response = {
        id: (populatedProject as any)._id.toString(),
        name: populatedProject.name,
        description: populatedProject.description,
        color: populatedProject.color,
        progress: 0,
        members: populatedProject.members.map((member: any) => ({
           id: member.user._id,
            name: member.user.name,
            avatarUrl: member.user.avatarUrl
        })),
        isOwner: (populatedProject as any).owner.toString() === ownerId,
        dueDate: populatedProject.dueDate ? populatedProject.dueDate.toISOString() : null,
        totalTasks: 0,
        completedTasks: 0,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error al crear proyecto:", error);
    res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
  }
};

// --- FUNCIÓN 'updateProject' CORREGIDA ---
export const updateProject = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const userId = getTypedUser(req)?.id;
    
        const project = await Project.findById(projectId);
        if (!project) {
          return res.status(404).json({ message: 'Proyecto no encontrado.' });
        }
    
        const member = project.members.find(m => (m.user as any)._id.equals(userId));
        if ((project.owner as any)._id.toString() !== userId && member?.role !== 'admin') {
          return res.status(403).json({ message: 'Acción no autorizada. Requiere rol de administrador.' });
        }
    
        // CORRECCIÓN: Se leen los datos directamente de req.body, igual que en createProject.
        const updateData: any = req.body;

        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        if (files && files.projectImage && files.projectImage[0]) {
            updateData.projectImageUrl = files.projectImage[0].path;
        }
        if (files && files.bannerImage && files.bannerImage[0]) {
            updateData.bannerImageUrl = files.bannerImage[0].path;
        }

        if (updateData.members && typeof updateData.members === 'string') {
            updateData.members = JSON.parse(updateData.members);
        }

        const updatedProject = await Project.findByIdAndUpdate(projectId, updateData, { new: true })
            .populate('members.user', 'name avatarUrl');
            
        if (!updatedProject) { return res.status(404).json({ message: 'Proyecto no encontrado.' }); }
        
        const tasks = await Task.find({ project: (updatedProject as any)._id });
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'done').length;
        
        const response = {
            id: (updatedProject as any)._id.toString(),
            name: updatedProject.name,
            description: updatedProject.description,
            color: updatedProject.color,
            progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
            members: updatedProject.members.map((member: any) => ({
                id: member.user._id,
                name: member.user.name,
                avatarUrl: member.user.avatarUrl
            })),
            isOwner: (updatedProject as any).owner.toString() === userId,
            dueDate: updatedProject.dueDate ? updatedProject.dueDate.toISOString() : null,
            totalTasks: totalTasks,
            completedTasks: completedTasks,
            bannerImageUrl: updatedProject.bannerImageUrl,
            projectImageUrl: updatedProject.projectImageUrl
        };
        res.json(response);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
    }
};

export const getProjectActivity = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20; // Limita a las últimas 20 actividades

    const activities = await Activity.find({ project: projectId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('user', 'name avatarUrl');
      // No populamos 'task' ni 'project' para que la respuesta sea más ligera

    // Mapear al formato esperado por el frontend
    const formattedActivities = activities.map(act => {
      const user = act.user as any;
      return {
        id: act._id,
        type: act.type,
        user: {
            id: user._id,
            name: user.name,
            avatarUrl: user.avatarUrl,
        },
        action: act.text, // Devolvemos el texto completo para el frontend
        target: '', // El frontend puede extraer esto si es necesario
        time: act.createdAt,
        projectId: act.project,
      }
    });

    res.json(formattedActivities);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching project activity', error: (error as Error).message });
  }
};

export const getAllUserProjects = async (req: Request, res: Response) => {
    try {
        const userId = getTypedUser(req)?.id;
        const filter = req.query.filter as 'owned' | 'working' | undefined;

        const query: mongoose.FilterQuery<IProject> = { 'members.user': userId };
        if (filter === 'owned') {
            query.owner = userId;
        } else if (filter === 'working') {
            query.owner = { $ne: userId };
        }
      
        const projectsData = await Project.find(query)
            .populate('owner', 'name email')
            .populate('members.user', 'name avatarUrl')
            .lean();
        const projectsWithProgress = await Promise.all(projectsData.map(async (project) => {
            const tasks = await Task.find({ project: project._id });
            const totalTasks = tasks.length;
            const completedTasks = tasks.filter((t) => t.status === 'done').length;
            const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
            
            const formattedMembers = project.members.map(member => ({
                id: (member.user as any)._id,
                name: (member.user as any).name,
                avatarUrl: (member.user as any).avatarUrl,
            }));

            return {
              id: project._id.toString(),
              name: project.name,
              description: project.description,
              color: project.color,
    projectImageUrl: project.projectImageUrl,  // <-- AÑADIR ESTA LÍNEA
    bannerImageUrl: project.bannerImageUrl,   // <-- AÑADIR ESTA LÍNEA
              progress: Math.round(progress),
              members: formattedMembers,
              isOwner: (project.owner as any)._id.toString() === userId,
              dueDate: project.dueDate ? project.dueDate.toISOString() : null,
              totalTasks,
              completedTasks,
            };
        }));

        res.json(projectsWithProgress);
    } catch (error) {
      res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
    }
};

export const getProjectById = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = getTypedUser(req)?.id;

    const project = await Project.findById(projectId)
      .populate('owner', 'name email')
      .populate({
          path: 'members',
          populate: {
              path: 'user',
              select: 'name email avatarUrl'
          }
      });
    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado.' });
    }

    const isMember = project.members.some(member => (member.user as any)._id.equals(userId));
    if (!isMember) {
      return res.status(403).json({ message: 'Acción no autorizada.' });
    }
    
    const tasks = await Task.find({ project: (project as any)._id })
      .populate('assignees', 'name avatarUrl')
      .populate('labels')
      .lean();
    const tasksByStatus = {
        todo: [] as any[],
        'in-progress': [] as any[],
        review: [] as any[],
        done: [] as any[],
    };
    for (const task of tasks) {
        const formattedTask = {
            id: task._id.toString(),
            title: task.title,
            priority: task.priority,
            labels: task.labels.map((label: any) => ({
                id: label._id.toString(),
                name: label.name,
                color: label.color
            })),
            assignees: task.assignees.map((assignee: any) => ({
                id: assignee._id.toString(),
                name: assignee.name,
                avatarUrl: assignee.avatarUrl
            })),
            dueDate: task.dueDate ? task.dueDate.toISOString() : null,
            subtasks: {
                total: task.subtasks.length,
                completed: task.subtasks.filter(st => st.completed).length
            },
            commentCount: await Comment.countDocuments({ task: task._id }),
            attachmentCount: task.attachments.length,
            projectId: (project as any)._id.toString()
        };
        if (tasksByStatus[task.status as keyof typeof tasksByStatus]) {
            tasksByStatus[task.status as keyof typeof tasksByStatus].push(formattedTask);
        }
    }
    
    const projectDetails = {
        id: (project as any)._id.toString(),
        name: project.name,
        description: project.description,
        color: project.color,
        progress: 0,
    projectImageUrl: project.projectImageUrl,  // <-- AÑADIR ESTA LÍNEA
    bannerImageUrl: project.bannerImageUrl,   // <-- AÑADIR ESTA LÍNEA
        members: project.members.map((member: any) => ({
            id: member.user._id,
            name: member.user.name,
            avatarUrl: member.user.avatarUrl
        })),
        isOwner: (project.owner as any)._id.toString() === userId,
        dueDate: project.dueDate ? project.dueDate.toISOString() : null,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'done').length,
        tasksByStatus: tasksByStatus
    };
    projectDetails.progress = projectDetails.totalTasks > 0 ? Math.round((projectDetails.completedTasks / projectDetails.totalTasks) * 100) : 0;

    res.json(projectDetails);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
  }
};


export const addMember = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const { userIdToInvite } = req.body;
        const sender = getTypedUser(req);
        if (!sender) return res.status(401).json({ message: "Usuario no autenticado." });

        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: 'Proyecto no encontrado.' });

        const member = project.members.find(m => (m.user as any)._id.equals(sender.id));
        if (!member || member.role !== 'admin') {
          return res.status(403).json({ message: 'Solo los administradores pueden enviar invitaciones.' });
        }
        
        const memberToAdd = await User.findById(userIdToInvite);
        if (!memberToAdd) return res.status(404).json({ message: 'Usuario a invitar no encontrado.' });
        if (project.members.some(m => (m.user as any)._id.equals(memberToAdd._id))) {
            return res.status(400).json({ message: 'El usuario ya es miembro de este proyecto.' });
        }

        const newNotification = new Notification({
            recipient: memberToAdd._id,
            sender: sender.id,
            type: 'project_invitation',
            status: 'pending',
            project: projectId,
            text: `${sender.name} te ha invitado a unirte al proyecto "${project.name}".`,
            link: `/project/${projectId}`
        });
        await newNotification.save();

        res.status(200).json({ message: "Invitación enviada con éxito." });
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
    }
};

export const deleteProject = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const userId = getTypedUser(req)?.id;

        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({ message: 'Proyecto no encontrado.' });
        }
        if ((project.owner as any).toString() !== userId) {
            return res.status(403).json({ message: 'Acción no autorizada. Solo el propietario puede eliminar.' });
        }

        await Task.deleteMany({ project: projectId });
        await Project.findByIdAndDelete(projectId);

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
    }
};