import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User.model';
import { ITask } from './Task.model';

export interface IActivity extends Document {
  text: string;
  user: IUser['_id'];
  task: ITask['_id'];
}

const ActivitySchema: Schema<IActivity> = new Schema({
  text: { 
    type: String, 
    required: true 
  },
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  task: { 
    type: Schema.Types.ObjectId, 
    ref: 'Task', 
    required: true 
  }
}, { timestamps: true });

export default mongoose.model<IActivity>('Activity', ActivitySchema);