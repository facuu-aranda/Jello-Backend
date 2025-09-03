import 'dotenv/config';
import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';
import labelRoutes from './routes/label.routes';
import uploadRoutes from './routes/upload.routes';
import userRoutes from './routes/user.routes';
import notificationRoutes from './routes/notification.routes';
import passport from 'passport';
import './config/passport.config';

const app = express();

app.use(cors());
app.use(express.json());

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error('❌ FATAL ERROR: MONGO_URI no está definida en el archivo .env');
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => console.error('❌ Error al conectar a MongoDB:', err));

app.use(passport.initialize());
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api', labelRoutes);
app.use('/api', uploadRoutes);
app.use('/api/user', userRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('¡La API está funcionando correctamente con TypeScript!');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});