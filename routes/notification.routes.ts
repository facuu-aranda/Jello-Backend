// Jello-Backend/routes/notification.routes.ts
import { Router } from 'express';
import { 
    getNotifications, 
    respondToNotification, 
    markAllAsRead, // <-- Renombramos para claridad
    markOneAsRead, // <-- NUEVO
    deleteNotification,
    createCollaborationRequest
} from '../controllers/notification.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

router.get('/', getNotifications);
router.put('/read', markAllAsRead); // Ruta para marcar todas
router.put('/:notificationId/read', markOneAsRead); // NUEVA RUTA para marcar una
router.put('/:notificationId/respond', respondToNotification);
router.delete('/:notificationId', deleteNotification);
router.post('/collaborate', createCollaborationRequest);

export default router;