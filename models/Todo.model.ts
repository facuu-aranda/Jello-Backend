import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User.model';

export interface ITodo extends Document {
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category: string;
  dueDate?: Date;
  owner: IUser['_id'];
  createdAt: Date;
  updatedAt: Date;
}

const TodoSchema: Schema<ITodo> = new Schema({
  text: { type: String, required: true },
  completed: { type: Boolean, default: false },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  category: { type: String, default: 'General' },
  dueDate: { type: Date },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
}, { timestamps: true });

export const Todo = mongoose.model<ITodo>('Todo', TodoSchema);