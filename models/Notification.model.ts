// models/Notification.model.ts
import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User.model';
import { IProject } from './Project.model';
import { ITask } from './Task.model';

export interface INotification extends Document {
  recipient: IUser['_id']; 
    sender: IUser['_id'];    
  type: 'invitation' | 'mention' | 'comment';
  status: 'pending' | 'accepted' | 'declined' | 'read' | 'unread';
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
    enum: ['invitation', 'mention', 'comment'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'read', 'unread'],
    required: true
  },
  project: { type: Schema.Types.ObjectId, ref: 'Project' },
  task: { type: Schema.Types.ObjectId, ref: 'Task' },
  text: { type: String, required: true },
  link: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model<INotification>('Notification', NotificationSchema);