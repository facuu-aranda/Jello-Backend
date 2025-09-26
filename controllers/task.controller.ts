import { Request, Response } from 'express';
import { Task, ITask } from '../models/Task.model';
import { Project } from '../models/Project.model';
import { Notification } from '../models/Notification.model';
import { Activity } from '../models/Activity.model';
import { Comment } from '../models/Comment.model';
import { IJwtPayload } from '../middleware/auth.middleware';
import mongoose from 'mongoose';

// =================================================================================
// Helper para formatear la respuesta de una tarea al formato TaskDetails
// =================================================================================
const formatTaskDetails = async (task: ITask) => {
    // Populamos los campos que puedan no estarlo
    const populatedTask = await task.populate([
        { path: 'assignees', select: 'name avatarUrl' },
        { path: 'labels' }
    ]);

    // Buscamos los comentarios asociados a la tarea
    const comments = await Comment.find({ task: (populatedTask as any)._id })
        .populate('author', 'name avatarUrl')
        .sort({ createdAt: 'desc' });

    // Casteamos populatedTask a 'any' para acceder a sus propiedades de forma segura.
    const populatedTaskAny = populatedTask as any;

    // Mapeamos todos los campos al formato esperado por el frontend
    return {
        id: populatedTaskAny._id.toString(),
        title: populatedTaskAny.title,
        description: populatedTaskAny.description,
        status: populatedTaskAny.status,
        priority: populatedTaskAny.priority,
        dueDate: populatedTaskAny.dueDate ? populatedTaskAny.dueDate.toISOString() : null,
        projectId: populatedTaskAny.project._id ? populatedTaskAny.project._id.toString() : populatedTaskAny.project.toString(),
        labels: populatedTaskAny.labels.map((label: any) => ({
            id: label._id.toString(),
            name: label.name,
            color: label.color,
        })),
        assignees: populatedTaskAny.assignees.map((assignee: any) => ({
            id: assignee._id.toString(),
            name: assignee.name,
            avatarUrl: assignee.avatarUrl,
        })),
        subtasks: populatedTaskAny.subtasks.map((subtask: any) => ({
            id: subtask._id.toString(),
            text: subtask.text,
            completed: subtask.completed,
        })),
        attachments: populatedTaskAny.attachments.map((attachment: any) => ({
            id: attachment._id.toString(),
            name: attachment.name,
            url: attachment.url,
            size: attachment.size,
            type: attachment.type,
        })),
        comments: comments.map((comment: any) => ({
            id: comment._id.toString(),
            author: {
                id: comment.author._id.toString(),
                name: comment.author.name,
                avatarUrl: comment.author.avatarUrl,
            },
            content: comment.content,
            timestamp: comment.createdAt.toISOString(),
        })),
    };
};

// =================================================================================
// Funciones del controlador
// =================================================================================

// Obtener una tarea por su ID
export const getTaskById = async (req: Request, res: Response) => {
    try {
        const { taskId } = req.params;
        const userId = (req.user as IJwtPayload).id;

        const task = await Task.findById(taskId).populate('project');

        if (!task) {
            return res.status(404).json({ error: "Tarea no encontrada." });
        }
        
        const project = task.project as any;
        if (!project.members.some((m: any) => m.user.equals(userId))) {
            return res.status(403).json({ error: "Acción no autorizada." });
        }

        const formattedTask = await formatTaskDetails(task);
        res.json(formattedTask);

    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
    }
};

// Crear una nueva tarea
export const createTask = async (req: Request, res: Response) => {
  try {
    const { title, description, priority, status, dueDate, assignees, labels, project } = req.body;
    const user = req.user as IJwtPayload;

    const newTask = new Task({ title, description, priority, status, dueDate, assignees, labels, project });
    await newTask.save();
    
    await new Activity({
        type: 'task_created',
        user: user.id,
        project: project,
        task: newTask._id,
        text: `${user.name} creó la tarea "${title}".`
    }).save();

    const formattedTask = await formatTaskDetails(newTask);
    res.status(201).json(formattedTask);

  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
  }
};

// Obtener todas las tareas de un proyecto
export const getTasksForProject = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const user = req.user as IJwtPayload;

    const project = await Project.findById(projectId);
    if (!project || !project.members.some(m => (m.user as any).equals(user.id))) {
        return res.status(403).json({ message: "Acción no autorizada." });
    }

    const tasks = await Task.find({ project: projectId })
      .populate('assignees', 'name avatar')
      .populate('labels');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
  }
};

// Actualizar una tarea
export const updateTask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const updateData = req.body;
    const user = req.user as IJwtPayload;

    const task = await Task.findById(taskId).populate('project');
    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada.' });
    }

    const updatedTask = await Task.findByIdAndUpdate(taskId, updateData, { new: true });
    if (!updatedTask) {
      return res.status(404).json({ message: 'No se pudo actualizar la tarea.' });
    }
    
    // Lógica de notificación
    if (updateData.status && updateData.status !== task.status) {
      const project = (task.project as any);
      const recipients = new Set<string>();
      if (project.owner) {
        recipients.add(project.owner.toString());
      }
      task.assignees.forEach((assigneeId: any) => recipients.add(assigneeId.toString()));

      recipients.delete(user.id);

      for (const recipientId of recipients) {
        await new Notification({
            recipient: recipientId,
            sender: user.id,
            type: 'comment',
            status: 'unread',
            project: project._id,
            task: task._id,
            text: `${user.name} actualizó el estado de la tarea "${task.title}" a "${updateData.status}".`,
            link: `/project/${project._id}`
        }).save();
      }
    }
    
    const formattedTask = await formatTaskDetails(updatedTask);
    res.json(formattedTask);
    
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
  }
};

// Eliminar una tarea
export const deleteTask = async (req: Request, res: Response) => {
    try {
        const { taskId } = req.params;
        await Task.findByIdAndDelete(taskId);
        res.json({ message: 'Tarea eliminada con éxito.' });
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
    }
};

// Añadir una subtarea
export const addSubtask = async (req: Request, res: Response) => {
    try {
        const { taskId } = req.params;
        const { text } = req.body;
        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ message: 'Tarea no encontrada.' });

        task.subtasks.push({ text, completed: false });
        await task.save();

        const formattedTask = await formatTaskDetails(task);
        res.status(201).json(formattedTask);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
    }
};

// Actualizar una subtarea
export const updateSubtask = async (req: Request, res: Response) => {
    try {
        const { taskId, subtaskId } = req.params;
        const { text, completed } = req.body;
        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ message: 'Tarea no encontrada.' });

        const subtask = (task.subtasks as any).id(subtaskId);
        if (!subtask) return res.status(404).json({ message: 'Subtarea no encontrada.' });

        if (text !== undefined) subtask.text = text;
        if (completed !== undefined) subtask.completed = completed;
        
        await task.save();
        const formattedTask = await formatTaskDetails(task);
        res.json(formattedTask);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
    }
};

// Eliminar una subtarea
export const deleteSubtask = async (req: Request, res: Response) => {
    try {
        const { taskId, subtaskId } = req.params;
        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ message: 'Tarea no encontrada.' });

        (task.subtasks as any).pull({ _id: subtaskId });
        await task.save();
        
        const formattedTask = await formatTaskDetails(task);
        res.json(formattedTask);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
    }
};

// Obtener tareas asignadas al usuario
export const getAssignedTasks = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as IJwtPayload).id;
        const tasks = await Task.find({ assignees: userId })
            .populate('project', 'name')
            .populate('labels');
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
    }
};