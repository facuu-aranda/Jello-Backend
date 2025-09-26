import { Router } from 'express';
import * as assistantController from '../controllers/assistant.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/chat', assistantController.chatWithAssistant);

export default router;
