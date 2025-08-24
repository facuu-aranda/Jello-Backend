const mongoose = require('mongoose');
const { Schema } = mongoose;
const NotificationSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // A quién notificar
    text: { type: String, required: true },
    link: { type: String }, 
    read: { type: Boolean, default: false }
}, { timestamps: true });
module.exports = mongoose.model('Notification', NotificationSchema)