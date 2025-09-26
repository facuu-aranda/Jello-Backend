import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

// NUEVO: Definimos la interfaz para la configuración del usuario
export interface IUserSettings {
  notifications: {
    tasks: { email: boolean; push: boolean; inApp: boolean };
    meetings: { email: boolean; push: boolean; inApp: boolean };
    team: { email: boolean; push: boolean; inApp: boolean };
    mentions: { email: boolean; push: boolean; inApp: boolean };
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    accentColor: string;
    animations: boolean;
  };
}

// Interfaz actualizada para incluir la configuración
export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  githubId?: string;
  googleId?: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string | null;
  jobTitle: string | null;
  timezone: string | null;
  skills: string[];
  settings?: IUserSettings; // <-- NUEVO CAMPO
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema<IUser> = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: false, select: false },
  githubId: { type: String, unique: true, sparse: true },
  googleId: { type: String, unique: true, sparse: true },
  avatarUrl: { type: String, default: null },
  bannerUrl: { type: String, default: null },
  bio: { type: String, default: null },
  jobTitle: { type: String, default: null },
  timezone: { type: String, default: null },
  skills: { type: [String], default: [] },
  
  settings: {
    notifications: {
        tasks: { email: Boolean, push: Boolean, inApp: Boolean },
        meetings: { email: Boolean, push: Boolean, inApp: Boolean },
        team: { email: Boolean, push: Boolean, inApp: Boolean },
        mentions: { email: Boolean, push: Boolean, inApp: Boolean },
    },
    appearance: {
        theme: String,
        accentColor: String,
        animations: Boolean,
    }
  },

  passwordResetToken: String,
  passwordResetExpires: Date,
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
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidatePassword, this.password);
};

// Exportación nombrada
export const User = mongoose.model<IUser>('User', UserSchema);