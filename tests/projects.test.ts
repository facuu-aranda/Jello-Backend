import request from 'supertest';
import { app } from '../index';
import { User } from '../models/User.model';
import { Project } from '../models/Project.model';
import mongoose from 'mongoose';

describe('Endpoints de Proyectos - /api/projects', () => {
    let token: string;
    let userId: string;

    beforeEach(async () => {
        const user = new User({ name: 'Project User', email: 'project@test.com', password: 'password123' });
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
        const projectData = { name: "Nuevo Proyecto de Prueba", description: "Descripción", color: "bg-blue-500", members: [] };
        const response = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${token}`)
            .field('data', JSON.stringify(projectData))
            .expect(201);
        expect(response.body.name).toBe(projectData.name);
        expect(response.body.isOwner).toBe(true);
    });

    it('GET / - debería devolver solo los proyectos del usuario', async () => {
        await new Project({ name: 'Proyecto 1', description: 'desc', color: 'red', owner: userId, members: [{ user: userId, role: 'admin' }] }).save();
        await new Project({ name: 'Proyecto de Otro', description: 'desc', color: 'blue', owner: new mongoose.Types.ObjectId(), members: [] }).save();
        const response = await request(app)
            .get('/api/projects')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].name).toBe('Proyecto 1');
    });
    
    it('GET /:projectId - debería devolver los detalles de un proyecto específico', async () => {
        const project = await new Project({ name: 'Proyecto Detalle', description: 'desc', color: 'red', owner: userId, members: [{ user: userId, role: 'admin' }] }).save();
        const response = await request(app)
            .get(`/api/projects/${(project as any)._id}`) // CORRECCIÓN AQUÍ
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        expect(response.body.name).toBe('Proyecto Detalle');
        expect(response.body.id).toBe((project as any)._id.toString());
    });

    it('PUT /:projectId - debería permitir al propietario actualizar su proyecto', async () => {
        const project = await new Project({ name: 'Proyecto Original', description: 'desc', color: 'red', owner: userId, members: [{ user: userId, role: 'admin' }] }).save();
        const updatedData = { name: 'Proyecto Actualizado' };
        const response = await request(app)
            .put(`/api/projects/${(project as any)._id}`) // CORRECCIÓN AQUÍ
            .set('Authorization', `Bearer ${token}`)
            .field('data', JSON.stringify(updatedData))
            .expect(200);
        expect(response.body.name).toBe('Proyecto Actualizado');
    });

    it('DELETE /:projectId - debería permitir al propietario eliminar su proyecto', async () => {
        const project = await new Project({ name: 'A eliminar', description: 'desc', color: 'red', owner: userId, members: [] }).save();
        
        await request(app)
            .delete(`/api/projects/${(project as any)._id}`) // CORRECCIÓN AQUÍ
            .set('Authorization', `Bearer ${token}`)
            .expect(204);

        const projectInDb = await Project.findById((project as any)._id); // CORRECCIÓN AQUÍ
        expect(projectInDb).toBeNull();
    });

    it('DELETE /:projectId - debería denegar el acceso si el usuario no es el propietario', async () => {
        const project = await new Project({ name: 'Proyecto ajeno', description: 'desc', color: 'red', owner: new mongoose.Types.ObjectId(), members: [] }).save();
        
        await request(app)
            .delete(`/api/projects/${(project as any)._id}`) // CORRECCIÓN AQUÍ
            .set('Authorization', `Bearer ${token}`)
            .expect(403);
    });
});