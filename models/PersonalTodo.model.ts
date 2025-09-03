import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User.model';

export interface IPersonalTodo extends Document {
  title: string;
  description?: string;
  status: string;
  owner: IUser['_id'];
  createdAt: Date; 
  updatedAt: Date;
}

const PersonalTodoSchema: Schema<IPersonalTodo> = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, required: true, default: 'Pendiente' },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
}, { timestamps: true });

export default mongoose.model<IPersonalTodo>('PersonalTodo', PersonalTodoSchema);