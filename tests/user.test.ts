import request from 'supertest';
import { app } from '../index';
import { User } from '../models/User.model';

describe('Endpoints de Usuario - /api/user', () => {
    let token: string;
    let userId: string;

    beforeEach(async () => {
        const user = new User({
            name: 'Profile User',
            email: 'profile@test.com',
            password: 'password123'
        });
        const savedUser = await user.save();
        userId = (savedUser as any)._id.toString();

        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'profile@test.com', password: 'password123' });
        
        token = response.body.token;
    });

    afterEach(async () => {
        await User.deleteMany({});
    });

    it('GET /me - debería obtener el perfil del usuario autenticado', async () => {
        const response = await request(app)
            .get('/api/user/me')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(response.body.id).toBe(userId);
        expect(response.body.email).toBe('profile@test.com');
    });

    it('PUT /profile - debería actualizar el perfil del usuario', async () => {
        const updates = {
            name: 'Profile User Updated',
            bio: 'This is my new bio.',
            skills: ['React', 'Node.js']
        };

        const response = await request(app)
            .put('/api/user/profile')
            .set('Authorization', `Bearer ${token}`)
            .send(updates)
            .expect(200);

        expect(response.body.name).toBe('Profile User Updated');
        expect(response.body.bio).toBe('This is my new bio.');
        expect(response.body.skills).toEqual(['React', 'Node.js']);
    });

    it('POST /me/avatar - debería manejar la subida de un avatar en el entorno de prueba', async () => {
        const buffer = Buffer.from('fake-image-data');
        const filename = 'test-avatar.png';

        const response = await request(app)
            .post('/api/user/me/avatar')
            .set('Authorization', `Bearer ${token}`)
            .attach('file', buffer, filename)
            .expect(200);

        // Verificamos que la URL devuelta sea la que genera nuestra lógica de prueba en el controlador
        expect(response.body.url).toBe(`https://fake.cloudinary.url/${filename}`);

        const userInDb = await User.findById(userId);
        expect(userInDb?.avatarUrl).toBe(`https://fake.cloudinary.url/${filename}`);
    });
});