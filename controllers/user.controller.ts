// controllers/user.controller.ts
import { Request, Response } from 'express';
import User from '../models/User.model';
import PersonalTodo from '../models/PersonalTodo.model';
import { IJwtPayload } from '../middleware/auth.middleware';

export const updateAiProfile = async (req: Request, res: Response) => {
  try {
    const { aiBotName, aiBotPrompt } = req.body;
    const userId = (req.user as IJwtPayload).id;

    const updateData: { aiBotName?: string; aiBotPrompt?: string } = {};
    if (aiBotName) updateData.aiBotName = aiBotName;
    if (aiBotPrompt) updateData.aiBotPrompt = aiBotPrompt;

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

    res.json({
      message: "Perfil de IA actualizado con éxito.",
      aiBotName: updatedUser?.aiBotName,
      aiBotPrompt: updatedUser?.aiBotPrompt
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { name, avatarUrl } = req.body;
    const userId = (req.user as IJwtPayload).id;

    const updateData: { name?: string; avatarUrl?: string } = {};
    if (name) updateData.name = name;
    if (avatarUrl) updateData.avatarUrl = avatarUrl;

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true })
        .select('-password');

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
  }
};

export const updatePersonalTodoStatuses = async (req: Request, res: Response) => {
  try {
    const { statuses } = req.body; 
    const userId = (req.user as IJwtPayload).id;

    if (!Array.isArray(statuses)) {
      return res.status(400).json({ message: 'Se esperaba un array de estados.' });
    }

    const user = await User.findByIdAndUpdate(
      userId, 
      { personalTodoStatuses: statuses }, 
      { new: true, runValidators: true }
    );

    res.json(user?.personalTodoStatuses);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
  }
};

export const getPersonalContextForAI = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as IJwtPayload).id;
        if (!userId) return res.status(401).json({ message: "Usuario no autenticado." });

        const [user, todos] = await Promise.all([
            User.findById(userId).select('personalTodoStatuses'),
            PersonalTodo.find({ owner: userId }).sort({ createdAt: -1 })
        ]);

        if (!user) return res.status(404).json({ message: "Usuario no encontrado." });

        const context = {
            customStatuses: user.personalTodoStatuses,
            todos: todos.map(t => ({
                title: t.title,
                status: t.status,
                createdAt: t.createdAt,
            }))
        };
        res.json(context);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
    }
};