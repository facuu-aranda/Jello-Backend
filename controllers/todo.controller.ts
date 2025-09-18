import { Request, Response } from 'express';
import Todo from '../models/Todo.model';
import { IJwtPayload } from '../middleware/auth.middleware';

// GET /api/todos - Obtiene todos los 'todos' del usuario logueado
export const getTodos = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as IJwtPayload).id;
    const todos = await Todo.find({ owner: userId }).sort({ createdAt: -1 });
    res.status(200).json(todos);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
  }
};

// POST /api/todos - Crea un nuevo 'todo'
export const createTodo = async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    const userId = (req.user as IJwtPayload).id;

    if (!text) {
      return res.status(400).json({ message: 'El campo "text" es requerido.' });
    }

    const newTodo = new Todo({
      text,
      owner: userId,
      completed: false
    });

    await newTodo.save();
    res.status(201).json(newTodo);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
  }
};

// PUT /api/todos/:todoId - Actualiza un 'todo'
export const updateTodo = async (req: Request, res: Response) => {
  try {
    const { todoId } = req.params;
    const userId = (req.user as IJwtPayload).id;
    const { text, completed } = req.body;

    // La condición { _id: todoId, owner: userId } asegura que solo el dueño pueda actualizarlo
    const updatedTodo = await Todo.findOneAndUpdate(
      { _id: todoId, owner: userId },
      { text, completed },
      { new: true, runValidators: true }
    );

    if (!updatedTodo) {
      return res.status(404).json({ message: 'Todo no encontrado o sin autorización.' });
    }

    res.status(200).json(updatedTodo);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
  }
};

// DELETE /api/todos/:todoId - Elimina un 'todo'
export const deleteTodo = async (req: Request, res: Response) => {
  try {
    const { todoId } = req.params;
    const userId = (req.user as IJwtPayload).id;

    // La condición { _id: todoId, owner: userId } asegura que solo el dueño pueda eliminarlo
    const result = await Todo.findOneAndDelete({ _id: todoId, owner: userId });

    if (!result) {
      return res.status(404).json({ message: 'Todo no encontrado o sin autorización.' });
    }

    res.status(204).send(); // 204 No Content para eliminaciones exitosas
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
  }
};