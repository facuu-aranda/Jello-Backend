import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  githubId?: string;
  googleId?: string;
  password?: string;
  avatarUrl?: string;
  aiBotName: string;
  aiBotPrompt: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  personalTodoStatuses: { name: string, color: string }[]; 
}

const UserSchema: Schema<IUser> = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  githubId: { type: String, unique: true, sparse: true },
  googleId: { type: String, unique: true, sparse: true },
  password: { type: String, required: false, select: false },
  avatarUrl: { type: String, default: '/public/assets/Jelli-avatar.png' },
  aiBotName: { type: String, default: 'Mi Asistente Personal' },
  aiBotPrompt: { type: String, default: 'Eres un asistente personal experto en productividad.' },
  passwordResetToken: String,
  passwordResetExpires: Date,
  personalTodoStatuses: {
    type: [{
      name: { type: String, required: true },
      color: { type: String, required: true }
    }],
    default: [
      { name: 'Pendiente', color: '#64748b' },
      { name: 'Completado', color: '#22c55e' }
    ]
  }
}, { timestamps: true });

UserSchema.pre<IUser>('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);