// Jello-Backend/models/Notification.model.ts

import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User.model';
import { IProject } from './Project.model';
import { ITask } from './Task.model';

export interface INotification extends Document {
  recipient: IUser['_id'];
  sender: IUser['_id'];
  // MODIFICADO: Añadimos 'task_assignment' y 'generic' para consistencia
  type: 'invitation' | 'mention' | 'comment' | 'collaboration_request' | 'task_assignment' | 'generic';
  // El status es solo para notificaciones que requieren una acción
  status: 'pending' | 'accepted' | 'declined';
  read: boolean; // <-- Este es el campo correcto para leído/no leído
  project?: IProject['_id'];
  task?: ITask['_id'];
  text: string;
  link: string;
}

const NotificationSchema: Schema<INotification> = new Schema({
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    // MODIFICADO: Añadimos los nuevos tipos
    enum: ['invitation', 'mention', 'comment', 'collaboration_request', 'task_assignment', 'generic'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending' // Es importante tener un default
  },
  read: { type: Boolean, default: false }, // <-- Este es el campo clave
  project: { type: Schema.Types.ObjectId, ref: 'Project' },
  task: { type: Schema.Types.ObjectId, ref: 'Task' },
  text: { type: String, required: true },
  link: { type: String, required: true },
}, { timestamps: true });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);