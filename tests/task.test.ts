import request from 'supertest';
import { app } from '../index';
import { User } from '../models/User.model';
import { Project } from '../models/Project.model';
import { Task } from '../models/Task.model';
import mongoose from 'mongoose';

describe('Endpoints de Tareas - /api/tasks y /api/projects/:projectId/tasks', () => {
    let token: string;
    let userId: string;
    let projectId: string;

    beforeEach(async () => {
        const user = await new User({ name: 'Task Test User', email: 'taskuser@test.com', password: 'password123' }).save();
        userId = (user as any)._id.toString(); // CORRECCIÓN AQUÍ

        const loginResponse = await request(app).post('/api/auth/login').send({ email: 'taskuser@test.com', password: 'password123' });
        token = loginResponse.body.token;

        const project = await new Project({ name: 'Project for Tasks', description: 'desc', color: 'green', owner: userId, members: [{ user: userId, role: 'admin' }] }).save();
        projectId = (project as any)._id.toString(); // CORRECCIÓN AQUÍ
    });

    afterEach(async () => {
        await User.deleteMany({});
        await Project.deleteMany({});
        await Task.deleteMany({});
    });

    it('POST /api/projects/:projectId/tasks - debería crear una nueva tarea en un proyecto', async () => {
        const taskData = {
            title: "Mi primera tarea de prueba",
            project: projectId
        };
        const response = await request(app)
            .post(`/api/projects/${projectId}/tasks`)
            .set('Authorization', `Bearer ${token}`)
            .send(taskData)
            .expect(201);
        
        expect(response.body.title).toBe(taskData.title);
        expect(response.body.projectId).toBe(projectId);
    });

    it('GET /api/tasks/:taskId - debería obtener los detalles de una tarea específica', async () => {
        const task = await new Task({ title: 'Tarea para obtener', project: projectId }).save();

        const response = await request(app)
            .get(`/api/tasks/${(task as any)._id}`) // CORRECCIÓN AQUÍ
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(response.body.title).toBe('Tarea para obtener');
        expect(response.body.id).toBe((task as any)._id.toString());
    });

    it('PUT /api/projects/:projectId/tasks/:taskId - debería actualizar una tarea', async () => {
        const task = await new Task({ title: 'Tarea para actualizar', project: projectId, status: 'todo' }).save();

        const response = await request(app)
            .put(`/api/projects/${projectId}/tasks/${task._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'in-progress' })
            .expect(200);

        expect(response.body.status).toBe('in-progress');
    });

    it('DELETE /api/projects/:projectId/tasks/:taskId - debería eliminar una tarea', async () => {
        const task = await new Task({ title: 'Tarea para eliminar', project: projectId }).save();

        await request(app)
            .delete(`/api/projects/${projectId}/tasks/${task._id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200); // El controlador devuelve 200 con mensaje

        const taskInDb = await Task.findById(task._id);
        expect(taskInDb).toBeNull();
    });
});