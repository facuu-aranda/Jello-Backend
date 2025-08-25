import { Request, Response } from 'express';
import Project, { IProject } from '../models/Project.model';
import User from '../models/User.model';
import Task from '../models/Task.model';

export const createProject = async (req: Request, res: Response) => {
  try {
    const { name, description, techStack, allowWorkerEstimation } = req.body;
    const ownerId = req.user?.id;

    if (!ownerId) {
      return res.status(401).json({ message: 'Usuario no autenticado.' });
    }

    const newProject = new Project({
      name,
      description,
      techStack,
      allowWorkerEstimation,
      owner: ownerId,
      members: [ownerId]
    });

    await newProject.save();
    res.status(201).json(newProject);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
  }
};

export const getProjectsForUser = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const projects = await Project.find({ members: userId }).populate('owner', 'name email');
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
  }
};

export const getProjectById = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;

    const project = await Project.findById(projectId)
      .populate('owner', 'name email')
      .populate('members', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado.' });
    }

    const isMember = project.members.some(member => (member as any)._id.equals(userId));
    if (!isMember) {
      return res.status(403).json({ message: 'Acción no autorizada.' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
  }
};

export const updateProject = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const userId = req.user?.id;
        const updateData = req.body;
    
        const project = await Project.findById(projectId);
        if (!project) {
          return res.status(404).json({ message: 'Proyecto no encontrado.' });
        }
    
        if ((project.owner as any).toString() !== userId) { // <-- CORRECCIÓN
          return res.status(403).json({ message: 'Acción no autorizada. Solo el dueño puede editar el proyecto.' });
        }
    
        const updatedProject = await Project.findByIdAndUpdate(projectId, updateData, { new: true });
        res.json(updatedProject);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
    }
};

export const addMember = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const { email } = req.body;
        const userId = req.user?.id;
    
        const project = await Project.findById(projectId);
        if (!project) {
          return res.status(404).json({ message: 'Proyecto no encontrado.' });
        }
    
        if ((project.owner as any).toString() !== userId) { // <-- CORRECCIÓN
          return res.status(403).json({ message: 'Acción no autorizada. Solo el dueño puede añadir miembros.' });
        }
        
        const memberToAdd = await User.findOne({ email });
        if (!memberToAdd) {
          return res.status(404).json({ message: 'Usuario no encontrado con ese email.' });
        }
        
        if (project.members.includes(memberToAdd._id)) {
            return res.status(400).json({ message: 'El usuario ya es miembro de este proyecto.' });
        }
        
        project.members.push(memberToAdd._id);
        await project.save();
        res.json(project);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
    }
};

export const updateColumns = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const userId = req.user?.id;
        const { columns } = req.body;
    
        const project = await Project.findById(projectId);
        if (!project) {
          return res.status(404).json({ message: 'Proyecto no encontrado.' });
        }
    
        if ((project.owner as any).toString() !== userId) { // <-- CORRECCIÓN
          return res.status(403).json({ message: 'Acción no autorizada.' });
        }
    
        project.kanbanColumns = columns;
        await project.save();
        res.json(project.kanbanColumns);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
    }
};


export const getProjectContextForAI = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const userId = req.user?.id;
    
        const project = await Project.findById(projectId);
        if (!project || !project.members.includes(userId as any)) {
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