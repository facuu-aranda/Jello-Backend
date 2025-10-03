import request from 'supertest';
import { app } from '../index';
import { User } from '../models/User.model';
import { Project } from '../models/Project.model';

describe('Endpoint de Búsqueda - /api/search', () => {
    let token: string;
    let userId: string;

    beforeEach(async () => {
        const user = await new User({ name: 'Search User', email: 'search@test.com', password: 'password123' }).save();
        userId = (user as any)._id.toString(); // CORRECCIÓN AQUÍ
        
        await new User({ name: 'John Doe', email: 'john@test.com', password: 'password123' }).save();

        const loginRes = await request(app).post('/api/auth/login').send({ email: 'search@test.com', password: 'password123' });
        token = loginRes.body.token;

        await new Project({ name: 'Project Alpha', description: 'desc', color: 'red', owner: userId, members: [{ user: userId, role: 'admin' }] }).save();
    });

    afterEach(async () => {
        await User.deleteMany({});
        await Project.deleteMany({});
    });

    it('GET /?q=... - debería encontrar proyectos y usuarios que coincidan', async () => {
        const response = await request(app)
            .get('/api/search?q=John')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(response.body).toHaveLength(1);
        expect(response.body[0].type).toBe('user');
        expect(response.body[0].name).toBe('John Doe');
    });

    it('GET /?q=...&type=project - debería filtrar por tipo de entidad', async () => {
        const response = await request(app)
            .get('/api/search?q=Pro&type=project')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(response.body).toHaveLength(1);
        expect(response.body[0].type).toBe('project');
        expect(response.body[0].name).toBe('Project Alpha');
    });

    it('GET / - debería devolver un error 400 si no hay query de búsqueda', async () => {
        await request(app)
            .get('/api/search')
            .set('Authorization', `Bearer ${token}`)
            .expect(400);
    });
});