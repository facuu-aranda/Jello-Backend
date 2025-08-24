const express = require('express');
const router = express.Router();
const labelController = require('../controllers/label.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.post('/projects/:projectId/labels', labelController.createLabel);

router.get('/projects/:projectId/labels', labelController.getLabelsForProject);

router.put('/labels/:labelId', labelController.updateLabel);

router.delete('/labels/:labelId', labelController.deleteLabel);

module.exports = router;
