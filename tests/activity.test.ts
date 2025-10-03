import request from 'supertest';
import { app } from '../index';
import { User } from '../models/User.model';
import { Project } from '../models/Project.model';
import { Activity } from '../models/Activity.model';
import mongoose from 'mongoose';

describe('Endpoint de Actividad - /api/activity', () => {
    let token: string;
    let userId: string;
    let projectId: string;

    beforeEach(async () => {
        const user = await new User({ name: 'Activity User', email: 'activity@test.com', password: 'password123' }).save();
        userId = (user as any)._id.toString(); // CORRECCIÓN AQUÍ

        const loginRes = await request(app).post('/api/auth/login').send({ email: 'activity@test.com', password: 'password123' });
        token = loginRes.body.token;

        const project = await new Project({ 
            name: 'Project for Activity', 
            description: 'desc', 
            color: 'blue', 
            owner: userId, 
            members: [{ user: userId, role: 'admin' }] 
        }).save();
        projectId = (project as any)._id.toString(); // CORRECCIÓN AQUÍ

        await new Activity({ type: 'task_created', user: userId, project: projectId, text: 'User created a task' }).save();
        await new Activity({ type: 'comment_added', user: userId, project: projectId, text: 'User added a comment' }).save();
    });

    afterEach(async () => {
        await User.deleteMany({});
        await Project.deleteMany({});
        await Activity.deleteMany({});
    });

    it('GET /recent - debería obtener la actividad reciente de los proyectos del usuario', async () => {
        const response = await request(app)
            .get('/api/activity/recent')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        
        expect(response.body).toHaveLength(2);
        expect(response.body[0].user.name).toBe('Activity User');
    });

    it('GET /recent - no debería obtener actividad de proyectos a los que el usuario no pertenece', async () => {
        const otherProjectId = new mongoose.Types.ObjectId();
        await new Activity({ type: 'task_created', user: userId, project: otherProjectId, text: 'Activity in other project' }).save();

        const response = await request(app)
            .get('/api/activity/recent')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(response.body).toHaveLength(2);
    });
});