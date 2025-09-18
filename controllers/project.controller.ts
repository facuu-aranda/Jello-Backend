// controllers/project.controller.ts
import { Request, Response } from 'express';
import Project from '../models/Project.model';
import User from '../models/User.model';
import Task from '../models/Task.model';
import Notification from '../models/Notification.model';
import { IJwtPayload } from '../middleware/auth.middleware'; // <-- 1. IMPORTAMOS NUESTRA INTERFAZ

// Helper para asegurar el tipo de req.user
const getTypedUser = (req: Request): IJwtPayload => {
    return req.user as IJwtPayload;
}

// Crear un nuevo proyecto
export const createProject = async (req: Request, res: Response) => {
  try {
    const { name, description, techStack, allowWorkerEstimation } = req.body;
    const ownerId = getTypedUser(req)?.id; // <-- 2. USAMOS EL TIPO CORRECTO
    if (!ownerId) {
      return res.status(401).json({ message: 'Usuario no autenticado.' });
    }

    const newProject = new Project({
      name,
      description,
      techStack,
      allowWorkerEstimation,
      owner: ownerId,
      members: [{ user: ownerId, role: 'admin' }]
    });

    await newProject.save();
    res.status(201).json(newProject);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
  }
};

// Obtener todos los proyectos del usuario (donde es miembro)
export const getAllUserProjects = async (req: Request, res: Response) => {
    try {
      const userId = getTypedUser(req)?.id;
      const projects = await Project.find({ 'members.user': userId }).populate('owner', 'name email');
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
    }
};

// Obtener solo los proyectos que el usuario posee
export const getOwnedProjects = async (req: Request, res: Response) => {
    try {
      const userId = getTypedUser(req)?.id;
      const projects = await Project.find({ owner: userId }).populate('owner', 'name email');
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
    }
};
  
// Obtener solo los proyectos en los que el usuario es miembro (pero no dueño)
export const getWorkingProjects = async (req: Request, res: Response) => {
    try {
      const userId = getTypedUser(req)?.id;
      const projects = await Project.find({ 
          owner: { $ne: userId },
          'members.user': userId
      }).populate('owner', 'name email');
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
    }
};

// Obtener un solo proyecto por su ID
export const getProjectById = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = getTypedUser(req)?.id;

    const project = await Project.findById(projectId)
      .populate('owner', 'name email')
      .populate('members.user', 'name email avatarUrl');

    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado.' });
    }

    const isMember = project.members.some(member => (member.user as any)?._id.equals(userId));
    if (!isMember) {
      return res.status(403).json({ message: 'Acción no autorizada.' });
    }

    res.json(project);
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
    
        const member = project.members.find(m => (m.user as any).equals(userId));
        if ((project.owner as any).toString() !== userId && member?.role !== 'admin') {
          return res.status(403).json({ message: 'Acción no autorizada. Requiere rol de administrador.' });
        }
    
        const updatedProject = await Project.findByIdAndUpdate(projectId, req.body, { new: true });
        res.json(updatedProject);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
    }
};

// Enviar una invitación para unirse a un proyecto
export const addMember = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const { email } = req.body;
        const sender = getTypedUser(req);
        if (!sender) return res.status(401).json({ message: "Usuario no autenticado." });

        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: 'Proyecto no encontrado.' });

        const member = project.members.find(m => (m.user as any).equals(sender.id));
        if (!member || member.role !== 'admin') {
          return res.status(403).json({ message: 'Solo los administradores pueden enviar invitaciones.' });
        }
        
        const memberToAdd = await User.findOne({ email });
        if (!memberToAdd) return res.status(404).json({ message: 'Usuario no encontrado con ese email.' });
        
        if (project.members.some(m => (m.user as any).equals(memberToAdd._id))) {
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

// Actualizar las columnas del tablero Kanban
export const updateColumns = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const userId = getTypedUser(req)?.id;
        const { columns } = req.body;
    
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: 'Proyecto no encontrado.' });

        const member = project.members.find(m => (m.user as any).equals(userId));
        if (!member || member.role !== 'admin') {
          return res.status(403).json({ message: 'Acción no autorizada.' });
        }
    
        project.kanbanColumns = columns;
        await project.save();
        res.json(project.kanbanColumns);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
    }
};

// Obtener un contexto completo del proyecto para la IA
export const getProjectContextForAI = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const userId = getTypedUser(req)?.id;
    
        const project = await Project.findById(projectId);
        if (!project || !project.members.some(m => (m.user as any).equals(userId))) {
            return res.status(403).json({ message: 'Acción no autorizada.' });
        }
    
        const tasks = await Task.find({ project: projectId })
            .populate('assignee', 'name')
            .populate('labels', 'name color');
        
        const currentUser = await User.findById(userId);

        const context = {
            projectName: project.name,
            projectDescription: project.description,
            projectAiBotName: project.aiBotName,
            projectAiBotInitialPrompt: project.aiBotPrompt,
            techStack: project.techStack,
            kanbanColumns: project.kanbanColumns,
            membersCount: project.members.length,
            userAiBotName: currentUser?.aiBotName,
            userAiBotPrompt: currentUser?.aiBotPrompt,
            tasks: tasks.map(t => ({
                title: t.title,
                status: t.status,
                priority: t.priority,
                assignee: (t.assignee as any)?.name || 'No asignada',
                labels: (t.labels as any[]).map(l => l.name)
            }))
        };
    
        res.json(context);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
    }
};

export const requestToJoinProject = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const sender = req.user as IJwtPayload; // El usuario que hace la solicitud

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado.' });
    }

    // Verificar que el usuario no sea ya un miembro
    if (project.members.some(m => (m.user as any).equals(sender.id))) {
      return res.status(400).json({ message: 'Ya eres miembro de este proyecto.' });
    }

    // Crear una notificación para el dueño del proyecto
    const newNotification = new Notification({
      recipient: project.owner,
      sender: sender.id,
      type: 'collaboration_request',
      status: 'pending',
      project: projectId,
      text: `"${sender.name}" ha solicitado unirse a tu proyecto "${project.name}".`,
      link: `/project/${projectId}/settings/members` // Link a la página de miembros
    });
    await newNotification.save();

    res.status(201).json({ message: 'Solicitud enviada con éxito.' });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
  }
};