import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import authMiddleware from '../middleware/auth.middleware';
import uploader from '../config/cloudinary.config'; // <-- Importamos el uploader

const router = Router();

// Aplicamos el middleware de autenticación a todas las rutas de este archivo
router.use(authMiddleware);

// Rutas de perfil
router.get('/me', userController.getMyProfile);
router.put('/profile', userController.updateProfile);

// NUEVO: Rutas para subir imágenes
router.post('/me/avatar', uploader.single('file'), userController.uploadAvatar);
router.post('/me/banner', uploader.single('file'), userController.uploadBanner);

// NUEVO: Ruta para la configuración
router.put('/me/settings', userController.updateUserSettings);

export default router;