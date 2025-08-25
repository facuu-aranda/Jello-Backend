const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller'); 
const commentController = require('../controllers/comment.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.post('/:taskId/comments', commentController.addComment);
router.post('/:taskId/subtasks', taskController.addSubtask);
router.put('/:taskId/subtasks/:subtaskId', taskController.updateSubtask);
router.delete('/:taskId/subtasks/:subtaskId', taskController.deleteSubtask);

module.exports = router;