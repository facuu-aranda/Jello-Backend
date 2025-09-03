import { Router } from 'express';
import * as projectController from '../controllers/project.controller';
import * as taskController from '../controllers/task.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

// GET /api/projects -> Obtener los proyectos del usuario logueado

router.get('/', projectController.getAllUserProjects); 
router.get('/owned', projectController.getOwnedProjects);
router.get('/working', projectController.getWorkingProjects);

// POST /api/projects -> Crear un nuevo proyecto
router.post('/', projectController.createProject);

// GET /api/projects/:projectId -> Obtener un proyecto por ID
router.get('/:projectId', projectController.getProjectById);

// PUT /api/projects/:projectId -> Actualizar un proyecto por ID
router.put('/:projectId', projectController.updateProject);

// PUT /api/projects/:projectId/columns -> Actualizar las columnas del Kanban
router.put('/:projectId/columns', projectController.updateColumns);

// POST /api/projects/:projectId/members -> Añadir un miembro
router.post('/:projectId/members', projectController.addMember);

// GET /api/projects/:projectId/context -> Obtener contexto para la IA
router.get('/:projectId/context', projectController.getProjectContextForAI);


/* --- Rutas de Tareas (Anidadas) --- */
// GET /api/projects/:projectId/tasks -> Obtener todas las tareas de un proyecto
router.get('/:projectId/tasks', taskController.getTasksForProject);

// POST /api/projects/:projectId/tasks -> Crear una nueva tarea en un proyecto
router.post('/:projectId/tasks', taskController.createTask);

// PUT /api/projects/:projectId/tasks/:taskId -> Actualizar una tarea
router.put('/:projectId/tasks/:taskId', taskController.updateTask);

// DELETE /api/projects/:projectId/tasks/:taskId -> Eliminar una tarea
router.delete('/:projectId/tasks/:taskId', taskController.deleteTask);

export default router;