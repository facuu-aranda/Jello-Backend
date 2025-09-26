import request from 'supertest';
import { app } from '../index';
import { User } from '../models/User.model';
import { Project } from '../models/Project.model';
import mongoose from 'mongoose';

describe('Endpoints de Proyectos - /api/projects', () => {
    let token: string;
    let userId: string;

    // Antes de cada prueba, creamos un usuario y obtenemos su token
    beforeEach(async () => {
        const user = new User({
            name: 'Project User',
            email: 'project@test.com',
            password: 'password123'
        });
        const savedUser = await user.save();
        userId = (savedUser as any)._id.toString();

        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'project@test.com', password: 'password123' });
        
        token = response.body.token;
    });

    afterEach(async () => {
        await User.deleteMany({});
        await Project.deleteMany({});
    });

    it('POST / - debería crear un nuevo proyecto si el usuario está autenticado', async () => {
        const projectData = {
            name: "Nuevo Proyecto de Prueba",
            description: "Esta es una descripción.",
            color: "bg-blue-500"
        };
        
        const response = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${token}`)
            .field('data', JSON.stringify(projectData)) // Usamos .field para multipart/form-data
            .expect(201);
        
        expect(response.body.name).toBe(projectData.name);
        expect(response.body.isOwner).toBe(true);
    });

    it('GET / - debería devolver solo los proyectos del usuario autenticado', async () => {
        // Creamos un proyecto para el usuario de prueba
        await new Project({ name: 'Proyecto 1', description: 'desc', color: 'red', owner: userId, members: [{ user: userId, role: 'admin' }] }).save();
        
        // Creamos un proyecto de otro usuario
        await new Project({ name: 'Proyecto de Otro', description: 'desc', color: 'blue', owner: new mongoose.Types.ObjectId(), members: [] }).save();

        const response = await request(app)
            .get('/api/projects')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(response.body).toHaveLength(1);
        expect(response.body[0].name).toBe('Proyecto 1');
    });

    it('DELETE /:projectId - debería permitir al propietario eliminar su proyecto', async () => {
        const project = await new Project({ name: 'A eliminar', description: 'desc', color: 'red', owner: userId, members: [] }).save();
        
        await request(app)
            .delete(`/api/projects/${project._id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(204);

        const projectInDb = await Project.findById(project._id);
        expect(projectInDb).toBeNull();
    });

    it('DELETE /:projectId - debería denegar el acceso si el usuario no es el propietario', async () => {
        const project = await new Project({ name: 'Proyecto ajeno', description: 'desc', color: 'red', owner: new mongoose.Types.ObjectId(), members: [] }).save();
        
        await request(app)
            .delete(`/api/projects/${project._id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(403);
    });
});