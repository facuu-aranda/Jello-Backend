// models/Activity.model.ts
import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User.model';
import { IProject } from './Project.model';
import { ITask } from './Task.model';

export interface IActivity extends Document {
  type: 'task_created' | 'comment_added' | 'user_joined' | 'task_status_changed';
  user: IUser['_id'];
  project: IProject['_id'];
  task?: ITask['_id'];
  meta?: object;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema: Schema<IActivity> = new Schema({
  type: {
    type: String,
    enum: ['task_created', 'comment_added', 'user_joined', 'task_status_changed'],
    required: true,
  },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  task: { type: Schema.Types.ObjectId, ref: 'Task' },
  meta: { type: Schema.Types.Mixed },
  text: { type: String, required: true }
}, { timestamps: true });

export const Activity = mongoose.model<IActivity>('Activity', ActivitySchema);