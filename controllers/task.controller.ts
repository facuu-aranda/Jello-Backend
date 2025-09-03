import { Request, Response } from 'express';
import Task from '../models/Task.model';
import Project from '../models/Project.model';
import Activity from '../models/Activity.model';
import { IJwtPayload } from '../middleware/auth.middleware';

const getTypedUser = (req: Request): IJwtPayload => {
    return req.user as IJwtPayload;
}

// Crear una nueva tarea
export const createTask = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { title, description } = req.body;
    const userId = getTypedUser(req)?.id;

    const project = await Project.findById(projectId);
    if (!project || !project.members.some(m => (m.user as any).equals(userId))) {
      return res.status(403).json({ message: 'Acción no autorizada.' });
    }

    const newTask = new Task({
      title,
      description,
      project: projectId,
    });

    await newTask.save();
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
  }
};

// Obtener todas las tareas de un proyecto (con filtros)
export const getTasksForProject = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = getTypedUser(req)?.id;
    const { status, assignee, priority, search } = req.query;

    const project = await Project.findById(projectId);
    if (!project || !project.members.some(m => (m.user as any).equals(userId))) {
      return res.status(403).json({ message: 'Acción no autorizada.' });
    }

    let filter: any = { project: projectId };
    if (status) filter.status = status;
    if (assignee) filter.assignee = assignee;
    if (priority) filter.priority = priority;
    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      filter.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    const tasks = await Task.find(filter)
      .populate('assignee', 'name email avatarUrl')
      .populate('labels', 'name color');
      
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
  }
};

// Actualizar una tarea
export const updateTask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const user = getTypedUser(req);
    const updateData = req.body;

    if (!user) {
        return res.status(401).json({ message: 'Usuario no autenticado.' });
    }

    const task = await Task.findById(taskId).populate('project');
    if (!task || !task.project) {
      return res.status(404).json({ message: 'Tarea o proyecto asociado no encontrado.' });
    }
    
    const project = task.project as any;
    
    const member = project.members.find((m: any) => m.user.equals(user.id));
    if (!member) {
      return res.status(403).json({ message: 'Acción no autorizada. No eres miembro de este proyecto.' });
    }

    if (updateData.estimatedTime) {
      if (member.role === 'member' && !project.allowWorkerEstimation) {
        return res.status(403).json({ message: 'No tienes permiso para estimar tareas en este proyecto.' });
      }
    }

    if (updateData.assignee && !project.members.some((m: any) => m.user.equals(updateData.assignee))) {
        return res.status(400).json({ message: 'El usuario asignado no es miembro del proyecto.' });
    }

    if (updateData.assignee && !task.assignee) {
      updateData.assignmentDate = new Date();
    }
    if (updateData.status === 'Hecho' && task.status !== 'Hecho') {
      updateData.completionDate = new Date();
    } else if (updateData.status && updateData.status !== 'Hecho' && task.status === 'Hecho') {
      updateData.completionDate = null;
    }

    if (updateData.status && updateData.status !== task.status) {
      await new Activity({
        text: `${user.name} movió la tarea de "${task.status}" a "${updateData.status}".`,
        user: user.id,
        task: taskId
      }).save();
    }

    const updatedTask = await Task.findByIdAndUpdate(taskId, updateData, { new: true });
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
  }
};

// Eliminar una tarea
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = getTypedUser(req)?.id;

    const task = await Task.findById(taskId).populate('project');
    if (!task || !task.project) {
        return res.status(404).json({ message: 'Tarea o proyecto asociado no encontrado.' });
    }

    if (!(task.project as any).members.some((m: any) => m.user.equals(userId))) {
      return res.status(403).json({ message: 'Acción no autorizada.' });
    }

    await Task.findByIdAndDelete(taskId);
    res.json({ message: 'Tarea eliminada con éxito.' });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
  }
};

// --- Sub-tareas ---
export const addSubtask = async (req: Request, res: Response) => {
    try {
        const { taskId } = req.params;
        const { text } = req.body;
        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ message: 'Tarea no encontrada.' });
        
        task.subtasks.push({ text, isCompleted: false } as any);
        await task.save();
        res.status(201).json(task.subtasks);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
    }
};

export const updateSubtask = async (req: Request, res: Response) => {
    try {
        const { taskId, subtaskId } = req.params;
        const { text, isCompleted } = req.body;
        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ message: 'Tarea no encontrada.' });

        const subtask = (task.subtasks as any).id(subtaskId);
        if (!subtask) return res.status(404).json({ message: 'Sub-tarea no encontrada.' });

        if (text) subtask.text = text;
        if (isCompleted !== undefined) subtask.isCompleted = isCompleted;
        await task.save();
        res.json(subtask);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
    }
};

export const deleteSubtask = async (req: Request, res: Response) => {
    try {
        const { taskId, subtaskId } = req.params;
        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ message: 'Tarea no encontrada.' });

        const subtask = (task.subtasks as any).id(subtaskId);
        if (!subtask) return res.status(404).json({ message: 'Sub-tarea no encontrada.' });
        
        subtask.remove();
        await task.save();
        res.json({ message: 'Sub-tarea eliminada.' });
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
    }
};

export const getAssignedTasks = async (req: Request, res: Response) => {
  try {
    const userId = getTypedUser(req)?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado.' });
    }

    const tasks = await Task.find({ assignee: userId })
      .populate('project', 'name color') 
      .sort({ dueDate: 1 }); 

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
  }
};