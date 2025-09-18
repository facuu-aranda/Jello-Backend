import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User.model';

export interface ITodo extends Document {
  text: string;
  completed: boolean;
  owner: IUser['_id'];
}

const TodoSchema: Schema<ITodo> = new Schema({
  text: {
    type: String,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true 
  },
}, { timestamps: true }); 

export default mongoose.model<ITodo>('Todo', TodoSchema);