// Archivo: Jello-Backend/routes/notification.routes.ts
import { Router } from 'express';
import { 
    getNotifications, 
    respondToNotification, 
    markAsRead, 
    deleteNotification,
    createCollaborationRequest // <-- 1. Importar la nueva función
} from '../controllers/notification.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

router.get('/', getNotifications);
router.put('/read', markAsRead);
router.put('/:notificationId/respond', respondToNotification);
router.delete('/:notificationId', deleteNotification);

// --- 2. NUEVA RUTA AÑADIDA ---
// Se registra el endpoint POST que faltaba.
router.post('/collaborate', createCollaborationRequest);

export default router;