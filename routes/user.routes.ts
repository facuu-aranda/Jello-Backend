import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.put('/ai-profile', userController.updateAiProfile);

router.put('/profile', userController.updateProfile);

export default router;