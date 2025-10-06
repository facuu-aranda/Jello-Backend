// Archivo: Jello-Backend/controllers/notification.controller.ts
import { Request, Response } from 'express';
import { Notification } from '../models/Notification.model';
import { Project } from '../models/Project.model';
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

export const respondToNotification = async (req: Request, res: Response) => {
    try {
        const { notificationId } = req.params;
        const { response } = req.body;
        const currentUser = req.user as IJwtPayload;

        const notification = await Notification.findById(notificationId);
        if (!notification || (notification.recipient as any).toString() !== currentUser.id) {
            return res.status(403).json({ error: "Acción no autorizada." });
        }
        if (notification.status !== 'pending') {
            return res.status(400).json({ error: "Esta notificación ya ha sido respondida." });
        }

        if (response === 'accepted') {
            let userToAddId;
            if (notification.type === 'invitation') {
                userToAddId = notification.recipient;
            } else if (notification.type === 'collaboration_request') {
                userToAddId = notification.sender;
            }

            if (userToAddId && notification.project) {
                await Project.findByIdAndUpdate(notification.project, {
                    $addToSet: { members: { user: userToAddId, role: 'member' } }
                });
            }
            notification.status = 'accepted';
        } else {
            notification.status = 'declined';
        }
        
        await notification.save();
        res.json(notification);
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor', details: (error as Error).message });
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

// --- NUEVA FUNCIÓN AÑADIDA ---
// Esta función maneja la lógica para crear una solicitud de colaboración.
export const createCollaborationRequest = async (req: Request, res: Response) => {
    try {
        const { projectId, message } = req.body;
        const sender = req.user as IJwtPayload;

        if (!projectId || !message) {
            return res.status(400).json({ error: "El ID del proyecto y el mensaje son requeridos." });
        }

        const project = await Project.findById(projectId).select('owner name');
        if (!project) {
            return res.status(404).json({ error: "Proyecto no encontrado." });
        }
        
        if ((project.owner as import('mongoose').Types.ObjectId).equals(sender.id)) {
            return res.status(400).json({ error: "No puedes solicitar colaborar en tu propio proyecto." });
        }

        const existingRequest = await Notification.findOne({
            sender: sender.id,
            project: projectId,
            type: 'collaboration_request'
        });

        if (existingRequest) {
            return res.status(409).json({ error: "Ya has enviado una solicitud para este proyecto." });
        }

        const newNotification = new Notification({
            recipient: project.owner,
            sender: sender.id,
            type: 'collaboration_request',
            status: 'pending',
            project: projectId,
            text: `${sender.name} quiere colaborar en tu proyecto "${project.name}". Mensaje: "${message}"`,
            link: `/project/${projectId}`
        });

        await newNotification.save();

        res.status(201).json({ message: "Solicitud de colaboración enviada con éxito." });

    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor', details: (error as Error).message });
    }
};