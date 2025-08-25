import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User.model'; 

interface IKanbanColumn {
  name: string;
  color: string;
}

export interface IProject extends Document {
  name: string;
  description?: string;
  coverImage?: string;
  techStack: string[];
  startDate: Date;
  estimatedEndDate?: Date;
  endDate?: Date;
  owner: IUser['_id']; 
  members: IUser['_id'][]; 
  kanbanColumns: IKanbanColumn[];
  allowWorkerEstimation: boolean;
  aiBotName: string;
  aiBotPrompt: string;
}

const ProjectSchema: Schema<IProject> = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String },
  coverImage: { type: String, default: null },
  techStack: [{ type: String, trim: true }],
  startDate: { type: Date, default: Date.now },
  estimatedEndDate: { type: Date },
  endDate: { type: Date, default: null },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  kanbanColumns: {
    type: [{
      name: { type: String, required: true },
      color: { type: String, default: '#4D4D4D' }
    }],
    default: [
      { name: 'Por Hacer', color: '#4D4D4D' },
      { name: 'En Progreso', color: '#2D87C9' },
      { name: 'Hecho', color: '#3E9D4F' }
    ]
  },
  allowWorkerEstimation: { type: Boolean, default: false },
  aiBotName: { type: String, default: 'Asistente del Proyecto' },
  aiBotPrompt: { type: String, default: 'Eres un asistente experto en gestión de proyectos.' },
}, { timestamps: true });

export default mongoose.model<IProject>('Project', ProjectSchema);