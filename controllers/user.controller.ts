import { Request, Response } from 'express';
import User from '../models/User.model';

export const updateAiProfile = async (req: Request, res: Response) => {
  try {
    const { aiBotName, aiBotPrompt } = req.body;
    const userId = req.user?.id;

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

// Actualizar el perfil básico del usuario (nombre, avatar)
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { name, avatarUrl } = req.body;
    const userId = req.user?.id;

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