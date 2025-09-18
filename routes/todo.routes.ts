import { Router } from 'express';
import * as todoController from '../controllers/todo.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

// Todas las rutas de 'todos' requieren que el usuario esté autenticado
router.use(authMiddleware);

router.route('/')
  .get(todoController.getTodos)
  .post(todoController.createTodo);

router.route('/:todoId')
  .put(todoController.updateTodo)
  .delete(todoController.deleteTodo);

export default router;