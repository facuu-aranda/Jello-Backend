import { Router } from 'express';
import * as labelController from '../controllers/label.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/projects/:projectId/labels', labelController.createLabel);

router.get('/projects/:projectId/labels', labelController.getLabelsForProject);

router.put('/labels/:labelId', labelController.updateLabel);

router.put('/projects/:projectId/labels/batch', labelController.batchUpdateLabels);

router.delete('/labels/:labelId', labelController.deleteLabel);

export default router;