import { Request, Response } from 'express';
import { Comment } from '../models/Comment.model';
import { Task } from '../models/Task.model';
import { User } from '../models/User.model';
import { IJwtPayload } from '../middleware/auth.middleware';
import { createActivityLog } from '../services/activity.service';

// POST /api/tasks/:taskId/comments
export const addComment = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
    const author = req.user as IJwtPayload;

    const task = await Task.findById(taskId).populate('project');
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada.' });
    }

    const newComment = new Comment({
      content,
      author: author.id,
      task: taskId
    });
    await newComment.save();
    
    // Registrar actividad
    const project = task.project as any;
    await createActivityLog({
        type: 'comment_added',
        user: author.id,
        project: project._id.toString(),
        task: taskId,
        text: `${author.name} comentó en la tarea "${task.title}".`
    });

    // Poblar el autor para devolver el formato UserSummary
    const populatedComment = await newComment.populate<{ author: { name: string, avatarUrl: string | null } }>('author', 'name avatarUrl');

    const responseComment = {
      id: populatedComment._id,
      author: {
        id: (populatedComment.author as any)._id,
        name: (populatedComment.author as any).name,
        avatarUrl: (populatedComment.author as any).avatarUrl
      },
      content: populatedComment.content,
      timestamp: (populatedComment as any).createdAt
    };

    res.status(201).json(responseComment);
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor', details: (error as Error).message });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
    try {
        const { commentId } = req.params;
        const userId = (req.user as IJwtPayload).id;

        const comment = await Comment.findById(commentId).populate({
            path: 'task',
            populate: { path: 'project' }
        });

        if (!comment) {
            return res.status(404).json({ error: 'Comentario no encontrado.' });
        }

        const project = (comment.task as any).project;
        const isAuthor = (comment.author as any).equals(userId);
        const isProjectOwner = project.owner.equals(userId);

        if (!isAuthor && !isProjectOwner) {
            return res.status(403).json({ error: 'Acción no autorizada.' });
        }

        await Comment.findByIdAndDelete(commentId);
        res.status(204).send();

    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor', details: (error as Error).message });
    }
};