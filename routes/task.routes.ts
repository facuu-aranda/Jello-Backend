import { Router } from 'express';
import * as taskController from '../controllers/task.controller';
import * as commentController from '../controllers/comment.controller';
import * as attachmentController from '../controllers/attachment.controller';
import authMiddleware from '../middleware/auth.middleware';
import uploader from '../config/cloudinary.config';

const router = Router();
router.use(authMiddleware);

// Tareas asignadas al usuario
router.get('/my-tasks', taskController.getAssignedTasks);

// NUEVO: Ruta para obtener los detalles de una tarea específica
router.get('/:taskId', taskController.getTaskById);

// Comentarios
router.post('/:taskId/comments', uploader.single('attachment'), commentController.addComment);


// Subtareas
router.post('/:taskId/subtasks', taskController.addSubtask);
router.put('/:taskId/subtasks/:subtaskId', taskController.updateSubtask);
router.delete('/:taskId/subtasks/:subtaskId', taskController.deleteSubtask);

// Adjuntos
router.post('/:taskId/attachments', uploader.single('file'), attachmentController.addAttachment);
router.delete('/:taskId/attachments/:attachmentId', attachmentController.deleteAttachment);

export default router;