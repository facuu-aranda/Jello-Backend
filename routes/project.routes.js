const express = require('express');
const router = express.Router();

const projectController = require('../controllers/project.controller');
const taskController = require('../controllers/task.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.post('/', projectController.createProject);
router.post('/', projectController.getProjectsForUser);

router.get('/:projectId', projectController.getProjectById);
router.put('/:projectId', projectController.updateProject);
router.post('/:projectId/members', projectController.addMember);
router.put('/:projectId/columns', projectController.updateColumns);


router.post('/:projectId/tasks', taskController.createTask);
router.get('/:projectId/tasks', taskController.getTasksForProject);
router.put('/:projectId/tasks/:taskId', taskController.updateTask);
router.delete('/:projectId/tasks/:taskId', taskController.deleteTask);

router.get('/:projectId/context', projectController.getProjectContextForAI);

module.exports = router;