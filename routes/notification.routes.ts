import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

router.get('/', notificationController.getNotifications);

router.put('/read', notificationController.markAsRead);

router.put('/:notificationId/respond', notificationController.respondToInvitation);

router.delete('/:notificationId', notificationController.deleteNotification);

export default router;