import mongoose, { Schema, Document } from 'mongoose';
import { IProject } from './Project.model';
import { IUser } from './User.model';
import { ILabel } from './Label.model';

interface ISubtask {
  text: string;
  isCompleted: boolean;
}

interface IAttachment {
  fileName: string;
  url: string;
  uploadedBy: IUser['_id'];
}

export interface ITask extends Document {
  title: string;
  description?: string;
  status: string;
  priority: 'Ninguna' | 'Baja' | 'Media' | 'Alta' | 'Crítica';
  project: IProject['_id'];
  assignee?: IUser['_id'];
  labels: ILabel['_id'][];
  subtasks: ISubtask[];
  attachments: IAttachment[];
  assignmentDate?: Date;
  completionDate?: Date;
  dueDate?: Date;
  estimatedTime: number;
}

const TaskSchema: Schema<ITask> = new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  status: { type: String, default: 'Por Hacer' },
  priority: {
    type: String,
    enum: ['Ninguna', 'Baja', 'Media', 'Alta', 'Crítica'],
    default: 'Ninguna'
  },
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  assignee: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  labels: [{ type: Schema.Types.ObjectId, ref: 'Label' }],
  subtasks: [{
    text: { type: String, required: true },
    isCompleted: { type: Boolean, default: false }
  }],
  attachments: [{
    fileName: String,
    url: String,
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  }],
  assignmentDate: { type: Date, default: null },
  completionDate: { type: Date, default: null },
  dueDate: { type: Date, default: null },
  estimatedTime: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model<ITask>('Task', TaskSchema);