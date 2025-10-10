import { Request, Response } from 'express';
import { Notification } from '../models/Notification.model';
import { Project } from '../models/Project.model';
import { IJwtPayload } from '../middleware/auth.middleware';


// GET /api/notifications
export const getNotifications = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as IJwtPayload).id;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 30;

        const notifications = await Notification.find({ recipient: userId })
            .sort({ createdAt: -1 })
            .limit(limit) 
            .populate('sender', 'name avatarUrl')
            .populate('project', 'name');
            
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
    }
};

// PUT /api/notifications/read
export const markAllAsRead = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as IJwtPayload).id;
        await Notification.updateMany(
            { recipient: userId, read: false },
            { read: true }
        );
        res.status(200).json({ message: 'Notificaciones marcadas como leídas.' });
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
    }
};

// PUT /api/notifications/:notificationId/read 
export const markOneAsRead = async (req: Request, res: Response) => {
    try {
        const { notificationId } = req.params;
        const userId = (req.user as IJwtPayload).id;

        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, recipient: userId },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: "Notificación no encontrada o sin autorización." });
        }

        res.status(200).json(notification);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: (error as Error).message });
    }
};


export const respondToNotification = async (req: Request, res: Response) => {
    try {
        const { notificationId } = req.params;
        const { response } = req.body; // 'accepted' o 'declined'
        const currentUser = req.user as IJwtPayload;

        const notification = await Notification.findById(notificationId).populate('project', 'name').populate('sender', 'name');
        if (!notification || (notification.recipient as any).toString() !== currentUser.id) {
            return res.status(403).json({ error: "Acción no autorizada." });
        }
        if (notification.status !== 'pending') {
            return res.status(400).json({ error: "Esta notificación ya ha sido respondida." });
        }

        // --- INICIO DE LA CORRECCIÓN DEFINITIVA ---
        // Si la notificación tiene el tipo antiguo 'invitation', lo actualizamos al nuevo
        // para que pase la validación al guardar.
        if ((notification.type as string) === 'invitation') {
            notification.type = 'project_invitation';
        }
        // Hacemos lo mismo para cualquier otro tipo antiguo que pudiera existir.
        if ((notification.type as string) === 'comment') {
            notification.type = 'new_comment';
        }
        if ((notification.type as string) === 'task_assignment') {
            notification.type = 'task_assigned';
        }

        const project = notification.project as any;
        const sender = notification.sender as any;
        type NotificationType = 'project_invitation' | 'collaboration_request' | 'invitation_accepted' | 'invitation_declined' | 'collaboration_accepted' | 'collaboration_declined';
        let responseNotificationType: NotificationType;
        let responseText: string;

        if (response === 'accepted') {
            notification.status = 'accepted';
            let userToAddId;

            if (notification.type === 'project_invitation') {
                userToAddId = notification.recipient;
                responseNotificationType = 'invitation_accepted';
                responseText = `${currentUser.name} ha aceptado tu invitación para unirte al proyecto "${project.name}".`;
            } else { // 'collaboration_request'
                userToAddId = notification.sender;
                responseNotificationType = 'collaboration_accepted';
                responseText = `Tu solicitud para colaborar en el proyecto "${project.name}" ha sido aceptada.`;
            }

            if (userToAddId && project) {
                await Project.findByIdAndUpdate(project._id, {
                    $addToSet: { members: { user: userToAddId, role: 'member' } }
                });
            }
        } else { // 'declined'
            notification.status = 'declined';
            if (notification.type === 'project_invitation') {
                responseNotificationType = 'invitation_declined';
                responseText = `${currentUser.name} ha rechazado tu invitación al proyecto "${project.name}".`;
            } else { // 'collaboration_request'
                responseNotificationType = 'collaboration_declined';
                responseText = `Tu solicitud para colaborar en el proyecto "${project.name}" ha sido rechazada.`;
            }
        }
        
        await notification.save();

        // --- INICIO DE LA LÓGICA DE NOTIFICACIÓN DE RESPUESTA ---
        await new Notification({
            recipient: sender._id,
            sender: currentUser.id,
            type: responseNotificationType,
            status: 'info',
            project: project._id,
            text: responseText,
            link: `/project/${project._id}`
        }).save();
        // --- FIN DE LA LÓGICA DE NOTIFICACIÓN DE RESPUESTA ---

        res.json(notification);
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor', details: (error as Error).message });
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