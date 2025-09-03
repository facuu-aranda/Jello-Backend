// controllers/notification.controller.ts
import { Request, Response } from 'express';
import Notification from '../models/Notification.model';
import Project from '../models/Project.model';
import { IJwtPayload } from '../middleware/auth.middleware';

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as IJwtPayload).id;
        const notifications = await Notification.find({ recipient: userId })
            .sort({ createdAt: -1 }) 
            .limit(30)
            .populate('sender', 'name avatarUrl')
            .populate('project', 'name');
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
    }
};

export const respondToInvitation = async (req: Request, res: Response) => {
    try {
        const { notificationId } = req.params;
        const { response } = req.body; 
        const userId = (req.user as IJwtPayload).id;

        const notification = await Notification.findById(notificationId);
        
        if (!notification || (notification.recipient as any).toString() !== userId) {
            return res.status(403).json({ message: "Acción no autorizada." });
        }
        if (notification.type !== 'invitation' || notification.status !== 'pending') {
            return res.status(400).json({ message: "Esta invitación ya no es válida." });
        }

        if (response === 'accepted') {
            const projectId = notification.project;
            if (!projectId) return res.status(400).json({ message: "Invitación sin proyecto válido." });

            await Project.findByIdAndUpdate(projectId, {
                $addToSet: { members: { user: userId, role: 'member' } }
            });
            notification.status = 'accepted';
        } else {
            notification.status = 'declined';
        }
        
        await notification.save();
        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
    }
};

export const markAsRead = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as IJwtPayload).id;
        await Notification.updateMany(
            { recipient: userId, status: 'unread' },
            { status: 'read' }
        );
        res.status(200).json({ message: 'Notificaciones marcadas como leídas.' });
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
    }
};

export const deleteNotification = async (req: Request, res: Response) => {
    try {
        const { notificationId } = req.params;
        const userId = (req.user as IJwtPayload).id;
        await Notification.findOneAndDelete({ _id: notificationId, recipient: userId });
        res.status(200).json({ message: 'Notificación eliminada.' });
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
    }
};