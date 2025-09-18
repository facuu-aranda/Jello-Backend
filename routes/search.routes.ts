import { Router } from 'express';
import * as searchController from '../controllers/search.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

// GET /api/search?q=texto_a_buscar
router.get('/', searchController.globalSearch);

export default router;