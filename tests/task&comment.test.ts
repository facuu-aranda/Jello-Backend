import request from 'supertest';
import { app } from '../index';
import { User } from '../models/User.model';
import { Project } from '../models/Project.model';
import { Task } from '../models/Task.model';
import { Comment } from '../models/Comment.model';

describe('Endpoints de Tareas y Comentarios', () => {
    let token: string;
    let userId: string;
    let projectId: string;

    beforeEach(async () => {
        const user = await new User({ name: 'Task User', email: 'task@test.com', password: 'password123' }).save();
        userId = (user as any)._id.toString();

        const response = await request(app).post('/api/auth/login').send({ email: 'task@test.com', password: 'password123' });
        token = response.body.token;

        const project = await new Project({ name: 'Project for Tasks', description: 'desc', color: 'green', owner: userId, members: [{ user: userId, role: 'admin' }] }).save();
        projectId = (project as any)._id.toString();
    });
    
    afterEach(async () => {
        await User.deleteMany({});
        await Project.deleteMany({});
        await Task.deleteMany({});
        await Comment.deleteMany({});
    });

    it('POST /api/projects/:projectId/tasks - debería crear una nueva tarea en un proyecto', async () => {
        const taskData = {
            title: "Mi primera tarea",
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

    it('POST /api/tasks/:taskId/comments - debería añadir un comentario a una tarea', async () => {
        const task = await new Task({ title: 'Task with comments', project: projectId }).save();

        const response = await request(app)
            .post(`/api/tasks/${task._id}/comments`)
            .set('Authorization', `Bearer ${token}`)
            .send({ content: 'Este es un comentario de prueba' })
            .expect(201);
            
        expect(response.body.content).toBe('Este es un comentario de prueba');
        expect(response.body.author.id).toBe(userId);
    });
});