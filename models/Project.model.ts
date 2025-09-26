import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User.model';
import { ITask } from './Task.model';

interface IProjectMember {
  user: IUser['_id'];
  role: 'admin' | 'member';
}

export interface IProject extends Document {
  name: string;
  description: string;
  color: string;
  dueDate?: Date;
  owner: IUser['_id'];
  projectImageUrl?: string;
  bannerImageUrl?: string;
  members: IProjectMember[];
  tasks: ITask['_id'][]; // Campo para las tareas
}

const ProjectSchema: Schema<IProject> = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  color: { type: String, required: true },
  dueDate: { type: Date },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  projectImageUrl: { type: String },
  bannerImageUrl: { type: String },
  members: [{
    _id: false,
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    }
  }],
  tasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }] // Campo para las tareas
}, { timestamps: true });

// Exportación nombrada
export const Project = mongoose.model<IProject>('Project', ProjectSchema);