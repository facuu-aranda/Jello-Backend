import request from 'supertest';
import { app } from '../index';
import { User } from '../models/User.model';

describe('Endpoint del Asistente - /api/assistant', () => {
    let token: string;

    beforeEach(async () => {
        await new User({ name: 'AI User', email: 'ai@test.com', password: 'password123' }).save();
        const response = await request(app).post('/api/auth/login').send({ email: 'ai@test.com', password: 'password123' });
        token = response.body.token;
    });

    afterEach(async () => {
        await User.deleteMany({});
    });

    it('POST /chat - debería devolver la respuesta mockeada correctamente', async () => {
        const history = [{ role: 'user', content: 'Hello' }];
        const response = await request(app)
            .post('/api/assistant/chat')
            .set('Authorization', `Bearer ${token}`)
            .send({ history })
            .expect(200);
        
        expect(response.body).toHaveProperty('response');
        expect(response.body.response).toContain('Soy tu asistente Jello');
    });

    it('POST /chat - debería devolver un error 400 si no se envía el historial', async () => {
        const response = await request(app)
            .post('/api/assistant/chat')
            .set('Authorization', `Bearer ${token}`)
            .send({}) // Enviamos un cuerpo vacío
            .expect(400);

        expect(response.body.error).toBe('El historial es requerido y debe ser un array.');
    });
});