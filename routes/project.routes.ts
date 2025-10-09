// Archivo: Jello-Backend/routes/project.routes.ts
import { Router } from 'express';
import * as projectController from '../controllers/project.controller';
import * as taskController from '../controllers/task.controller';
import authMiddleware from '../middleware/auth.middleware';
import uploader from '../config/cloudinary.config';
import { getProjectActivity} from '../controllers/project.controller';



const router = Router();

router.use(authMiddleware);

const projectUploads = uploader.fields([
    { name: 'projectImage', maxCount: 1 },
    { name: 'bannerImage', maxCount: 1 }
]);

// Rutas de Proyectos
router.get('/', projectController.getAllUserProjects); 
// Se aplica el middleware 'projectUploads' a la ruta POST
router.post('/', projectUploads, projectController.createProject);
router.get('/:projectId', projectController.getProjectById);
// También se aplica a la ruta PUT para permitir la actualización de imágenes
router.put('/:projectId', projectUploads, projectController.updateProject);
router.delete('/:projectId', projectController.deleteProject);
router.post('/:projectId/invitations', projectController.addMember);
router.post('/:projectId/tasks', uploader.array('attachments'), taskController.createTask);

/* --- Rutas de Tareas Anidadas --- */
router.post('/:projectId/tasks', taskController.createTask);
router.put('/:projectId/tasks/:taskId', taskController.updateTask);
router.delete('/:projectId/tasks/:taskId', taskController.deleteTask);

router.get('/:projectId/activity', getProjectActivity);

export default router;