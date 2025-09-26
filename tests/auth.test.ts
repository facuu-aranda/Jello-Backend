import request from 'supertest';
import { app } from '../index'; // Ajusta la ruta si es necesario
import { User } from '../models/User.model';

// Limpiamos la colección de usuarios después de cada prueba para mantenerlas aisladas
afterEach(async () => {
    await User.deleteMany({});
});

describe('Endpoints de Autenticación - /api/auth', () => {

    const testUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
    };

    it('POST /register - debería registrar un nuevo usuario correctamente', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send(testUser)
            .expect(201);

        expect(response.body).toHaveProperty('token');
        expect(response.body.user.email).toBe(testUser.email);

        const userInDb = await User.findOne({ email: testUser.email });
        expect(userInDb).not.toBeNull();
    });

    it('POST /register - debería devolver un error 400 si el email ya existe', async () => {
        await new User(testUser).save(); // Guardamos un usuario primero

        await request(app)
            .post('/api/auth/register')
            .send(testUser)
            .expect(400);
    });

    it('POST /login - debería iniciar sesión y devolver un token para un usuario válido', async () => {
        await new User(testUser).save(); // Guardamos el usuario para poder hacer login

        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: testUser.email, password: testUser.password })
            .expect(200);

        expect(response.body).toHaveProperty('token');
    });

    it('POST /login - debería devolver un error 401 para credenciales inválidas', async () => {
        await new User(testUser).save();

        await request(app)
            .post('/api/auth/login')
            .send({ email: testUser.email, password: 'wrongpassword' })
            .expect(401);
    });
});