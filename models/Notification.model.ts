import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User.model';

export interface INotification extends Document {
  user: IUser['_id']; 
  text: string;
  link?: string; 
  read: boolean;
}

const NotificationSchema: Schema<INotification> = new Schema({
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  text: { 
    type: String, 
    required: true 
  },
  link: { 
    type: String 
  },
  read: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

export default mongoose.model<INotification>('Notification', NotificationSchema);