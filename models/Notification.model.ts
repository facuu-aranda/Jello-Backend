// Jello-Backend/models/Notification.model.ts

import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User.model';
import { IProject } from './Project.model';
import { ITask } from './Task.model';

export interface INotification extends Document {
  recipient: IUser['_id'];
  sender: IUser['_id'];
  // --- MODIFICADO: Añadimos y renombramos tipos para mayor claridad ---
  type:
    | 'project_invitation' // Antes 'invitation'
    | 'collaboration_request'
    | 'task_created' // NUEVO: Notificación general de tarea nueva
    | 'task_assigned' // Antes 'task_assignment'
    | 'task_status_changed' // NUEVO: Para cambios en el Kanban
    | 'new_comment' // Antes 'comment'
    | 'invitation_accepted' // NUEVO: Para notificar la respuesta
    | 'invitation_declined' // NUEVO: Para notificar la respuesta
    | 'collaboration_accepted' // NUEVO: Para notificar la respuesta
    | 'collaboration_declined'; // NUEVO: Para notificar la respuesta
  status: 'pending' | 'accepted' | 'declined' | 'info'; // 'info' para notificaciones no interactivas
  read: boolean;
  project?: IProject['_id'];
  task?: ITask['_id'];
  text: string;
  link: string;
}

const NotificationSchema: Schema<INotification> = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      // --- MODIFICADO: Actualizamos el enum ---
      enum: [
        'project_invitation',
        'collaboration_request',
        'task_created',
        'task_assigned',
        'task_status_changed',
        'new_comment',
        'invitation_accepted',
        'invitation_declined',
        'collaboration_accepted',
        'collaboration_declined',
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'info'],
      default: 'pending',
    },
    read: { type: Boolean, default: false },
    project: { type: Schema.Types.ObjectId, ref: 'Project' },
    task: { type: Schema.Types.ObjectId, ref: 'Task' },
    text: { type: String, required: true },
    link: { type: String, required: true },
  },
  { timestamps: true },
);

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);