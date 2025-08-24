const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.'],
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['leader', 'worker'],
    default: 'worker ',
  },
  avatarUrl: {
    type: String,
    default: 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fmedium.com%2Finsider-coub%2Fdefault-avatars-4275c0e41f62&psig=AOvVaw2zNIMxFjG6P0Y-JxZhN61W&ust=1756135018469000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCICyxvPeo48DFQAAAAAdAAAAABAE' 
  },

  aiBotName: {
    type: String,
    default: 'Mi Asistente Personal' 
  },
  aiBotPrompt: {
    type: String,
    default: 'Eres un asistente personal experto en productividad. Ayúdame a organizar mis tareas, priorizar mi día y mantenerme enfocado.'
  },
  passwordResetToken: String,
    passwordResetExpires: Date,
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword =  function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', UserSchema);
module.exports = User;