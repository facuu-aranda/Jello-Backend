const mongoose = require('mongoose');
const { Schema } = mongoose;

const TaskSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    default: 'Por Hacer',
  },
  assignmentDate: {
    type: Date,
    default: null,
  },
  completionDate: {
    type: Date,
    default: null,
  },
  estimatedTime: {
    type: Number,
    default: 0,
  },
subtasks: [{
    text: { type: String, required: true },
    isCompleted: { type: Boolean, default: false }
}],
  priority: {
    type: String,
    enum: ['Ninguna', 'Baja', 'Media', 'Alta', 'Crítica'],
    default: 'Ninguna'
  },
  labels: [{
    type: Schema.Types.ObjectId,
    ref: 'Label'
  }],
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  assignee: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },attachments: [{ 
    fileName: String, 
    url: String, 
    uploadedBy: { 
      type: Schema.Types.ObjectId,
       ref: 'User' 
      } 
    }]
}, { timestamps: true });

const Task = mongoose.model('Task', TaskSchema);
module.exports = Task;