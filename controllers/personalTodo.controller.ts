// controllers/personalTodo.controller.ts
import { Request, Response } from 'express';
import PersonalTodo from '../models/PersonalTodo.model';
import { IJwtPayload } from '../middleware/auth.middleware';

export const getTodos = async (req: Request, res: Response) => {
  const userId = (req.user as IJwtPayload).id;
  const todos = await PersonalTodo.find({ owner: userId }).sort({ createdAt: -1 });
  res.json(todos);
};

export const createTodo = async (req: Request, res: Response) => {
  const { title, description, status } = req.body;
  const userId = (req.user as IJwtPayload).id;
  const newTodo = new PersonalTodo({ title, description, status, owner: userId });
  await newTodo.save();
  res.status(201).json(newTodo);
};

export const updateTodo = async (req: Request, res: Response) => {
  const { todoId } = req.params;
  const userId = (req.user as IJwtPayload).id;
  const updatedTodo = await PersonalTodo.findOneAndUpdate(
    { _id: todoId, owner: userId }, 
    req.body, 
    { new: true }
  );
  if (!updatedTodo) return res.status(404).json({ message: 'To-do no encontrado o sin autorización.' });
  res.json(updatedTodo);
};

export const deleteTodo = async (req: Request, res: Response) => {
  const { todoId } = req.params;
  const userId = (req.user as IJwtPayload).id;
  const deletedTodo = await PersonalTodo.findOneAndDelete({ _id: todoId, owner: userId });
  if (!deletedTodo) return res.status(404).json({ message: 'To-do no encontrado o sin autorización.' });
  res.json({ message: 'To-do eliminado.' });
};