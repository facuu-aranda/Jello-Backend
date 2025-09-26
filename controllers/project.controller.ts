import { Request, Response } from 'express';
import { Project, IProject } from '../models/Project.model';
import { User, IUser } from '../models/User.model';
import { Task, ITask } from '../models/Task.model';
import { Comment } from '../models/Comment.model';
import { Notification } from '../models/Notification.model';
import { IJwtPayload } from '../middleware/auth.middleware';
import mongoose from 'mongoose';

// Helper para asegurar el tipo de req.user
const getTypedUser = (req: Request): IJwtPayload => {
    return req.user as IJwtPayload;
}

// Crear un nuevo proyecto
export const createProject = async (req: Request, res: Response) => {
  try {
    const { name, description, color, members, dueDate } = JSON.parse(req.body.data);
    const ownerId = getTypedUser(req)?.id;

    if (!ownerId) {
      return res.status(401).json({ message: 'Usuario no autenticado.' });
    }

    const newProjectData: any = {
      name,
      description,
      color,
      dueDate,
      owner: ownerId,
    };

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files.projectImage) {
        newProjectData.projectImageUrl = files.projectImage[0].path;
    }
    if (files.bannerImage) {
        newProjectData.bannerImageUrl = files.bannerImage[0].path;
    }

    const initialMembers = members?.map((m: { user: string, role: string }) => ({
        user: m.user,
        role: m.role || 'member'
    })) || [];

    const ownerInMembers = initialMembers.some((m: { user: string }) => m.user === ownerId);
    if (!ownerInMembers) {
        initialMembers.push({ user: ownerId, role: 'admin' });
    }
    newProjectData.members = initialMembers;
    
    const newProject = new Project(newProjectData);
    await newProject.save();
    
    const populatedProject = await newProject.populate('members.user', 'name avatarUrl');
    
    // Devolvemos el proyecto en el formato ProjectSummary esperado
    const response = {
        // CORRECCIÓN: Se castea 'populatedProject' a 'any' para acceder a '_id'
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
        // CORRECCIÓN: Se castea 'populatedProject' a 'any' para acceder a 'owner'
        isOwner: (populatedProject as any).owner.toString() === ownerId,
        dueDate: populatedProject.dueDate ? populatedProject.dueDate.toISOString() : null,
        totalTasks: 0,
        completedTasks: 0,
    }

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
  }
};



// MODIFICADO: Obtener todos los proyectos del usuario
export const getAllUserProjects = async (req: Request, res: Response) => {
    try {
        const userId = getTypedUser(req)?.id;
        const filter = req.query.filter as 'owned' | 'working' | undefined;

        const query: mongoose.FilterQuery<IProject> = { 'members.user': userId };

        // Lógica de filtrado
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

// MODIFICADO: Obtener un solo proyecto por su ID
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
    
    // CORRECCIÓN: Se castea 'project' a 'any' para acceder a '_id' de forma segura.
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
            // CORRECCIÓN: Se castea 'project' a 'any' para acceder a '_id' de forma segura.
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

// Actualizar un proyecto
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
    
        const updateData: any = req.body.data ? JSON.parse(req.body.data) : {};

        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        if (files.projectImage) {
            updateData.projectImageUrl = files.projectImage[0].path;
        }
        if (files.bannerImage) {
            updateData.bannerImageUrl = files.bannerImage[0].path;
        }

        const updatedProject = await Project.findByIdAndUpdate(projectId, updateData, { new: true })
            .populate('members.user', 'name avatarUrl');
        
        if (!updatedProject) {
            return res.status(404).json({ message: 'Proyecto no encontrado.' });
        }
        
        const tasks = await Task.find({ project: (updatedProject as any)._id });
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'done').length;

        // Devolvemos el proyecto en el formato ProjectSummary esperado
        const response = {
            // CORRECCIÓN: Se castea 'updatedProject' a 'any' para acceder a '_id'
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
            // CORRECCIÓN: Se castea 'updatedProject' a 'any' para acceder a 'owner'
            isOwner: (updatedProject as any).owner.toString() === userId,
            dueDate: updatedProject.dueDate ? updatedProject.dueDate.toISOString() : null,
            totalTasks: totalTasks,
            completedTasks: completedTasks,
        };

        res.json(response);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
    }
};

// Enviar una invitación para unirse a un proyecto
export const addMember = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const { userIdToInvite } = req.body; // Cambiado de 'email' a 'userIdToInvite'
        const sender = getTypedUser(req);
        if (!sender) return res.status(401).json({ message: "Usuario no autenticado." });

        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: 'Proyecto no encontrado.' });

        const member = project.members.find(m => (m.user as any)._id.equals(sender.id));
        if (!member || member.role !== 'admin') {
          return res.status(403).json({ message: 'Solo los administradores pueden enviar invitaciones.' });
        }
        
        const memberToAdd = await User.findById(userIdToInvite); // Buscamos por ID
        if (!memberToAdd) return res.status(404).json({ message: 'Usuario a invitar no encontrado.' });

        if (project.members.some(m => (m.user as any)._id.equals(memberToAdd._id))) {
            return res.status(400).json({ message: 'El usuario ya es miembro de este proyecto.' });
        }

        const newNotification = new Notification({
            recipient: memberToAdd._id,
            sender: sender.id,
            type: 'invitation',
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

        // Eliminación en cascada de tareas
        await Task.deleteMany({ project: projectId });
        
        await Project.findByIdAndDelete(projectId);

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
    }
};