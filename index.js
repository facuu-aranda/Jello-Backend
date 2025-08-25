require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// 1. IMPORTAR TODAS LAS RUTAS JUNTAS
const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const taskRoutes = require('./routes/task.routes');
const labelRoutes = require('./routes/label.routes');
const uploadRoutes = require('./routes/upload.routes');
const userRoutes = require('./routes/user.routes');

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => console.error('❌ Error al conectar a MongoDB:', err));


app.use('/api/auth', authRoutes);
app.use('/api', uploadRoutes); 

app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api', labelRoutes);
app.use('/api/user', userRoutes);

app.get('/', (req, res) => {
  res.send('¡La API está funcionando correctamente!');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});