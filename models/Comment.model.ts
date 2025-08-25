import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User.model';
import { ITask } from './Task.model';

export interface IComment extends Document {
  content: string;
  author: IUser['_id'];
  task: ITask['_id'];
  attachmentUrl?: string;
}

const CommentSchema: Schema<IComment> = new Schema({
  content: { 
    type: String, 
    required: true 
  },
  author: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  task: { 
    type: Schema.Types.ObjectId, 
    ref: 'Task', 
    required: true 
  },
  attachmentUrl: {
    type: String,
    default: null
  }
}, { timestamps: true });

export default mongoose.model<IComment>('Comment', CommentSchema);