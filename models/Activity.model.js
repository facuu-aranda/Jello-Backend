const mongoose = require('mongoose');
const { Schema } = mongoose;

const ActivitySchema = new Schema({
  text: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  task: { type: Schema.Types.ObjectId, ref: 'Task' }
}, { timestamps: true });

const Activity = mongoose.model('Activity', ActivitySchema);
module.exports = Activity;