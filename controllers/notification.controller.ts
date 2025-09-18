// controllers/notification.controller.ts
import { Request, Response } from 'express';
import Notification from '../models/Notification.model';
import Project from '../models/Project.model';
import { IJwtPayload } from '../middleware/auth.middleware';
import { createActivityLog } from '../services/activity.service';
import User from '../models/User.model';

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

export const respondToNotification = async (req: Request, res: Response) => {
    try {
        const { notificationId } = req.params;
        const { response } = req.body; // 'accepted' o 'declined'
        const currentUser = req.user as IJwtPayload;

        const notification = await Notification.findById(notificationId);
        
        // La notificación debe existir y el usuario actual debe ser el destinatario
        if (!notification || (notification.recipient as any).toString() !== currentUser.id) {
            return res.status(403).json({ message: "Acción no autorizada." });
        }
        if (notification.status !== 'pending') {
            return res.status(400).json({ message: "Esta notificación ya ha sido respondida." });
        }

        if (response === 'accepted') {
            // Lógica para añadir al miembro correcto al proyecto
            let userToadd;
            if (notification.type === 'invitation') {
                userToadd = notification.recipient; // Si me invitan, me añaden a mí
            } else if (notification.type === 'collaboration_request') {
                userToadd = notification.sender; // Si acepto una solicitud, añado a quien la envió
            }

            if (userToadd && notification.project) {
                await Project.findByIdAndUpdate(notification.project, {
                    $addToSet: { members: { user: userToadd, role: 'member' } }
                });
            }
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