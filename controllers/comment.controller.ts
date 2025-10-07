import { Request, Response } from 'express';
import { Comment } from '../models/Comment.model';
import { Task } from '../models/Task.model';
import { IJwtPayload } from '../middleware/auth.middleware';
import { createActivityLog } from '../services/activity.service';

export const addComment = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body; 
    const author = req.user as IJwtPayload;

    if (!content || content.trim() === "") {
        return res.status(400).json({ error: 'El contenido del comentario no puede estar vacío.' });
    }

    const task = await Task.findById(taskId).populate('project');
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada.' });
    }

    const newCommentData: any = {
      content,
      author: author.id,
      task: taskId
    };

    if (req.file) {
      newCommentData.attachmentUrl = req.file.path;
    }

    const newComment = new Comment(newCommentData);
    await newComment.save();
    
    const project = task.project as any;
    // --- CORRECCIÓN AQUÍ ---
    await createActivityLog({
    type: 'comment_added',
    user: author.id,
    project: (task.project as any)._id.toString(),
    task: (task as any)._id.toString(), // <-- CORRECTED LINE
    text: `comentó en la tarea "${task.title}"`
});

    const populatedComment = await newComment.populate('author', 'name avatarUrl');

    const responseComment = {
      id: populatedComment._id,
      author: {
        id: (populatedComment.author as any)._id,
        name: (populatedComment.author as any).name,
        avatarUrl: (populatedComment.author as any).avatarUrl
      },
      content: populatedComment.content,
      attachmentUrl: populatedComment.attachmentUrl,
      timestamp: (populatedComment as any).createdAt
    };

    res.status(201).json(responseComment);
  } catch (error) {
    console.error("Error adding comment:", error);
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
        const isProjectOwner = (project.owner as any).equals(userId);

        if (!isAuthor && !isProjectOwner) {
            return res.status(403).json({ error: 'Acción no autorizada.' });
        }

        await Comment.findByIdAndDelete(commentId);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor', details: (error as Error).message });
    }
};