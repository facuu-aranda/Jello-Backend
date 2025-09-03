import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.put('/ai-profile', userController.updateAiProfile);

router.put('/profile', userController.updateProfile);

router.put('/personal-todo-statuses', userController.updatePersonalTodoStatuses);

router.get('/personal-context', userController.getPersonalContextForAI);
export default router;