import { Request, Response } from 'express';
import Comment from '../models/Comment.model';
import Task from '../models/Task.model';
import User from '../models/User.model';
import Notification from '../models/Notification.model';
import { createActivityLog } from '../services/activity.service';
import { IJwtPayload } from '../middleware/auth.middleware';

export const addComment = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { content, attachmentUrl } = req.body;
    const author = req.user as IJwtPayload;

    if (!author) {
      return res.status(401).json({ message: 'Usuario no autenticado.' });
    }

    const task = await Task.findById(taskId).populate('project', 'name');
    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada.' });
    }

    const newComment = new Comment({
      content,
      attachmentUrl,
      author: author.id,
      task: taskId
    });
    await newComment.save();

    await createActivityLog({
        type: 'comment_added',
        user: author.id,
        // --- CORRECCIÓN AQUÍ ---
        project: (task.project as any)._id.toString(),
        task: taskId,
        text: `${author.name} ha comentado en la tarea "${task.title}".`
    });

    // Lógica de Menciones (@mentions)
    const mentions = content.match(/@(\w+)/g);
    if (mentions) {
      const usernames = mentions.map((mention: string) => mention.substring(1));
      const mentionedUsers = await User.find({ name: { $in: usernames } });

      for (const user of mentionedUsers) {
        if ((user._id as any).toString() !== author.id) {
          const notification = new Notification({
            user: user._id,
            text: `${author.name} te ha mencionado en un comentario en la tarea "${task.title}".`,
            link: `/projects/${task.project}/tasks/${taskId}`
          });
          await notification.save();
        }
      }
    }

    // Lógica de Notificación al Asignado
    if (task.assignee && task.assignee.toString() !== author.id) {
        const project = task.project as any;
        const notification = new Notification({
            recipient: task.assignee,
            sender: author.id,
            type: 'comment',
            status: 'unread',
            task: taskId,
            project: project._id,
            text: `${author.name} comentó en la tarea "${task.title}" del proyecto "${project.name}".`,
            link: `/project/${project._id}/tasks/${taskId}`
        });
        await notification.save();
    }

    const populatedComment = await newComment.populate('author', 'name email avatarUrl');
    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
  }
};