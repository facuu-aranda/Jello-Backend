// models/Label.model.ts
import mongoose, { Schema, Document } from 'mongoose';
import { IProject } from './Project.model';

export interface ILabel extends Document {
  name: string;
  color: string;
  project: IProject['_id'];
}

const LabelSchema: Schema<ILabel> = new Schema({
  name: { type: String, required: true },
  color: { type: String, required: true },
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true }
});

export const Label = mongoose.model<ILabel>('Label', LabelSchema);