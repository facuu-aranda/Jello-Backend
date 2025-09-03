import { Router } from 'express';
import * as taskController from '../controllers/task.controller';
import * as commentController from '../controllers/comment.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/:taskId/comments', commentController.addComment);
    
router.post('/:taskId/subtasks', taskController.addSubtask);

router.put('/:taskId/subtasks/:subtaskId', taskController.updateSubtask);

router.delete('/:taskId/subtasks/:subtaskId', taskController.deleteSubtask);

router.get('/my-tasks', taskController.getAssignedTasks);

export default router;