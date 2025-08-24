const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: false,
  },
  techStack: [{
    type: String,
    trim: true,
  }],
  startDate: {
    type: Date,
    default: Date.now,
  },
  estimatedEndDate: {
    type: Date,
  },
  endDate: {
    type: Date,
    default: null,
  },
  allowWorkerEstimation: {
    type: Boolean,
    default: false, 
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
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
coverImage: { 
  type: String, 
  default: null 
},

aiBotName: {
    type: String,
    default: 'Asistente del Proyecto'
},
aiBotPrompt: {
    type: String,
    default: 'Eres un asistente experto en gestión de proyectos. Eres conciso, amigable y proactivo.'
},

}, { timestamps: true });

const Project = mongoose.model('Project', ProjectSchema);
module.exports = Project;