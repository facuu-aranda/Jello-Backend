import { Request, Response } from 'express';
import { Task, ITask } from '../models/Task.model';
import { Project } from '../models/Project.model';
import { Notification } from '../models/Notification.model';
import { Comment } from '../models/Comment.model';
import { IJwtPayload } from '../middleware/auth.middleware';
import { createActivityLog } from '../services/activity.service';

const formatTaskDetails = async (task: ITask) => {
    const populatedTask = await task.populate([
        { path: 'assignees', select: 'name avatarUrl' },
        { path: 'labels' }
    ]);

    const comments = await Comment.find({ task: (populatedTask as any)._id })
        .populate('author', 'name avatarUrl')
        .sort({ createdAt: 'desc' });

    const populatedTaskAny = populatedTask as any;

    return {
        id: populatedTaskAny._id.toString(),
        title: populatedTaskAny.title,
        description: populatedTaskAny.description,
        status: populatedTaskAny.status,
        priority: populatedTaskAny.priority,
        labels: populatedTaskAny.labels.map((l: any) => ({ id: l._id, name: l.name, color: l.color })),
        assignees: populatedTaskAny.assignees.map((a: any) => ({ id: a._id, name: a.name, avatarUrl: a.avatarUrl })),
        dueDate: populatedTaskAny.dueDate,
        subtasks: populatedTaskAny.subtasks.map((s: any) => ({ id: s._id, text: s.text, completed: s.completed })),
        comments: comments.map((c: any) => ({
            id: c._id,
            author: { id: (c.author as any)._id, name: (c.author as any).name, avatarUrl: (c.author as any).avatarUrl },
            content: c.content,
            timestamp: c.createdAt,
            attachmentUrl: c.attachmentUrl
        })),
        projectId: (populatedTaskAny.project as any)._id.toString(),
    };
};

export const createTask = async (req: Request, res: Response) => {
    try {
        const { title, description, priority, status, dueDate, labels, assignees, subtasks, projectId } = req.body;
        const userId = (req.user as IJwtPayload).id;
        const userName = (req.user as any).name;

        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: "Proyecto no encontrado" });

        const newTask = new Task({
            title, description, priority, status, dueDate, labels, assignees,
            subtasks: subtasks ? subtasks.map((text: string) => ({ text })) : [],
            project: projectId, createdBy: userId
        });
        await newTask.save();
        
        if (assignees && assignees.length > 0) {
            for (const assigneeId of assignees) {
                if (assigneeId.toString() !== userId.toString()) {
                    await new Notification({
                        recipient: assigneeId, sender: userId, type: 'task_assigned',
                        project: projectId, task: newTask._id,
                        text: `${userName} te asignó la tarea "${title}" en el proyecto "${project.name}".`
                    }).save();
                }
            }
        }

        // --- CORRECCIÓN AQUÍ ---
      await createActivityLog({
    type: 'task_created',
    user: userId,
    project: projectId,
    task: (newTask as any)._id.toString(), // <-- CORRECTED LINE
    text: `creó la tarea "${title}"`
});

        const formattedTask = await formatTaskDetails(newTask);
        res.status(201).json(formattedTask);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
    }
};

export const updateTask = async (req: Request, res: Response) => {
    try {
        const { taskId } = req.params;
        const { assignees, ...updateData } = req.body;
        const userId = (req.user as IJwtPayload).id;
        const userName = (req.user as any).name;

        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ message: 'Tarea no encontrada.' });

        // --- CORRECCIÓN AQUÍ ---
        const originalAssignees = task.assignees.map(id => (id as any).toString());

        Object.assign(task, updateData);
        if (assignees !== undefined) task.assignees = assignees;
        await task.save();

        if (assignees) {
            const newAssignees = assignees.filter((id: string) => !originalAssignees.includes(id));
            if (newAssignees.length > 0) {
                const project = await Project.findById(task.project);
                for (const assigneeId of newAssignees) {
                     if (assigneeId.toString() !== userId.toString()) {
                        await new Notification({
                           recipient: assigneeId, sender: userId, type: 'task_assigned',
                           project: task.project, task: task._id,
                           text: `${userName} te asignó la tarea "${task.title}" en el proyecto "${(project as any)?.name}".`
                        }).save();
                    }
                }
            }
        }
        
        const formattedTask = await formatTaskDetails(task);
        res.json(formattedTask);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
    }
};
export const getTaskById = async (req: Request, res: Response) => {
    try {
        const { taskId } = req.params;
        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ message: 'Tarea no encontrada.' });
        
        const formattedTask = await formatTaskDetails(task);
        res.json(formattedTask);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
    }
};

export const deleteTask = async (req: Request, res: Response) => {
    try {
        const { taskId } = req.params;
        const deletedTask = await Task.findByIdAndDelete(taskId);
        if (!deletedTask) return res.status(404).json({ message: 'Tarea no encontrada.' });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
    }
};

export const addSubtask = async (req: Request, res: Response) => {
    try {
        const { taskId } = req.params;
        const { text } = req.body;
        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ message: 'Tarea no encontrada.' });
        (task.subtasks as any).push({ text });
        await task.save();
        const formattedTask = await formatTaskDetails(task);
        res.status(201).json(formattedTask);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
    }
};

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

export const getAssignedTasks = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as IJwtPayload).id;
        const tasks = await Task.find({ assignees: userId }).populate('project', 'name color');
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
    }
};