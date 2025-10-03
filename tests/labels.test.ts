import request from 'supertest';
import { app } from '../index';
import { User } from '../models/User.model';
import { Project } from '../models/Project.model';
import { Label } from '../models/Label.model';
import mongoose from 'mongoose';

describe('Endpoints de Etiquetas (Labels)', () => {
    let token: string;
    let userId: string;
    let projectId: string;

    beforeEach(async () => {
        const user = await new User({ name: 'Label User', email: 'label@test.com', password: 'password123' }).save();
        userId = (user as any)._id.toString(); // CORRECCIÓN AQUÍ

        const loginRes = await request(app).post('/api/auth/login').send({ email: 'label@test.com', password: 'password123' });
        token = loginRes.body.token;

        const project = await new Project({ name: 'Project for Labels', description: 'desc', color: 'red', owner: userId, members: [{ user: userId, role: 'admin' }] }).save();
        projectId = (project as any)._id.toString(); // CORRECCIÓN AQUÍ
    });

    afterEach(async () => {
        await User.deleteMany({});
        await Project.deleteMany({});
        await Label.deleteMany({});
    });

    it('POST /api/projects/:projectId/labels - debería crear una nueva etiqueta', async () => {
        const labelData = { name: 'Bug', color: '#FF0000' };
        const response = await request(app)
            .post(`/api/projects/${projectId}/labels`)
            .set('Authorization', `Bearer ${token}`)
            .send(labelData)
            .expect(201);
        
        expect(response.body.name).toBe('Bug');
        expect(response.body.color).toBe('#FF0000');
    });

    it('GET /api/projects/:projectId/labels - debería obtener todas las etiquetas de un proyecto', async () => {
        await new Label({ name: 'Feature', color: '#00FF00', project: projectId }).save();
        
        const response = await request(app)
            .get(`/api/projects/${projectId}/labels`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(response.body).toHaveLength(1);
        expect(response.body[0].name).toBe('Feature');
    });

    it('PUT /api/labels/:labelId - debería actualizar una etiqueta', async () => {
        const label = await new Label({ name: 'Old Name', color: '#000000', project: projectId }).save();
        
        const response = await request(app)
            .put(`/api/labels/${label._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'New Name', color: '#FFFFFF' })
            .expect(200);

        expect(response.body.name).toBe('New Name');
    });

    it('DELETE /api/labels/:labelId - debería eliminar una etiqueta', async () => {
        const label = await new Label({ name: 'To Delete', color: '#000000', project: projectId }).save();

        await request(app)
            .delete(`/api/labels/${label._id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200); // El controlador devuelve 200 con mensaje

        const labelInDb = await Label.findById(label._id);
        expect(labelInDb).toBeNull();
    });
});