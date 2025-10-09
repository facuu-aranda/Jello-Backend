import mongoose, { Schema, Document } from 'mongoose';
import { IProject } from './Project.model';
import { IUser } from './User.model';
import { ILabel } from './Label.model';

export interface ISubtask extends mongoose.Types.Subdocument { 
  text: string;
  completed: boolean;
}

export interface IAttachment extends mongoose.Types.Subdocument {
  name: string;
  url: string;
  size: string;
  type: 'image' | 'document' | 'other';
}

export interface ITask extends Document {
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  project: IProject['_id'];
  assignees: IUser['_id'][];
  labels: ILabel['_id'][];
  subtasks: mongoose.Types.DocumentArray<ISubtask>; // Tipo correcto para subdocumentos
  attachments: mongoose.Types.DocumentArray<IAttachment>;
  dueDate?: Date;
}

const AttachmentSchema: Schema = new Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  size: { type: String },
  type: { type: String, enum: ['image', 'document', 'other'] }
});

const TaskSchema: Schema<ITask> = new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['todo', 'in-progress', 'review', 'done'], default: 'todo' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  assignees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  labels: [{ type: Schema.Types.ObjectId, ref: 'Label' }],
  subtasks: [{ text: { type: String, required: true }, completed: { type: Boolean, default: false } }],
  attachments: [AttachmentSchema],
  dueDate: { type: Date },
}, { timestamps: true });

// Exportación nombrada
export const Task = mongoose.model<ITask>('Task', TaskSchema);