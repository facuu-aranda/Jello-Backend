import { Router } from 'express';
import { 
    getNotifications, 
    markAllAsRead, 
    markOneAsRead, 
    respondToNotification, 
    createCollaborationRequest, 
    deleteNotification 
} from '../controllers/notification.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

router.get('/', authMiddleware, getNotifications);
router.put('/read/all', authMiddleware, markAllAsRead);
router.put('/:notificationId/read', authMiddleware, markOneAsRead);
router.put('/:notificationId/respond', authMiddleware, respondToNotification);
router.post('/request-collaboration', authMiddleware, createCollaborationRequest);
router.delete('/:notificationId', authMiddleware, deleteNotification);

export default router;