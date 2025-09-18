import { Router } from 'express';
import * as activityController from '../controllers/activity.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

// Todas las rutas de actividad requieren que el usuario esté autenticado
router.use(authMiddleware);

router.get('/recent', activityController.getRecentActivity);

export default router;