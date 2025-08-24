require ('dotenv').config();
const express = require ('express');
const mongoose = require ('mongoose');
const cors = require ('cors');
const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const taskRoutes = require('./routes/task.routes');
const labelRoutes = require('./routes/label.routes');
const uploadRoutes = require('./routes/upload.routes');
const userRoutes = require('./routes/user.routes'); 

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/tasks', taskRoutes);
app.use('/api', labelRoutes);
app.use('/api', uploadRoutes);
app.use('/api/user', userRoutes);

// Database connection
mongoose.connect(process.env.MONGO_URI).then(() => console.log('Connected to MongoDB')).catch(err => console.error('Could not connect to MongoDB...', err));

// Routes
app.get('/', (req, res) => {
    res.send('La API esta funcionando');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.get('/', (req, res) => {
  res.send('¡La API está funcionando!');
});

app.use('/api/auth', authRoutes);

app.use('/api/projects', projectRoutes);