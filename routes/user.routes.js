const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);
router.put('/ai-profile', userController.updateAiProfile);
router.put('/profile', userController.updateProfile);

module.exports = router;