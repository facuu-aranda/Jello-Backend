import { Router } from 'express';
import * as commentController from '../controllers/comment.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

// Todas las rutas de comentarios requieren autenticación
router.use(authMiddleware);

// DELETE /api/comments/:commentId
router.delete('/:commentId', commentController.deleteComment);

export default router;