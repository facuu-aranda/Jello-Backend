const mongoose = require('mongoose');
const { Schema } = mongoose;

const LabelSchema = new Schema({
  name: { type: String, required: true },
  color: { type: String, required: true },
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true }
});

const Label = mongoose.model('Label', LabelSchema);
module.exports = Label;