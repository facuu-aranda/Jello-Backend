// Archivo: Jello-Backend/tests/auth.test.ts

import request from 'supertest';
import { app } from '../index';
import { User } from '../models/User.model';

// Describe agrupa un conjunto de pruebas relacionadas.
describe('Endpoints de Autenticación - /api/auth', () => {

    const testUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
    };

    // afterEach se ejecuta después de cada prueba en este bloque.
    // Es crucial para limpiar la base de datos y asegurar que las pruebas no interfieran entre sí.
    afterEach(async () => {
        await User.deleteMany({});
    });

    // --- Pruebas para el endpoint de Registro ---
    describe('POST /api/auth/register', () => {
        it('debería registrar un nuevo usuario y devolver un token y datos del usuario', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send(testUser)
                .expect(201); // Assert: Esperamos un código de estado 201 (Creado)

            // Assert: Verificamos que la respuesta tenga la estructura correcta
            expect(response.body).toHaveProperty('token');
            expect(response.body.user.name).toBe(testUser.name);
            expect(response.body.user.email).toBe(testUser.email);

            // Assert: Verificamos que el usuario fue realmente guardado en la BD
            const userInDb = await User.findOne({ email: testUser.email });
            expect(userInDb).not.toBeNull();
        });

        it('debería devolver un error 400 si el email ya está en uso', async () => {
            await new User(testUser).save(); // Arrange: Creamos un usuario primero

            const response = await request(app)
                .post('/api/auth/register')
                .send(testUser)
                .expect(400); // Assert: Esperamos un código de estado 400 (Bad Request)
            
            expect(response.body.error).toBe('El correo ya está en uso');
        });
    });

    // --- Pruebas para el endpoint de Login ---
    describe('POST /api/auth/login', () => {
        // beforeEach se ejecuta antes de cada prueba en este bloque anidado.
        // Aquí, nos aseguramos de que siempre exista un usuario para intentar hacer login.
        beforeEach(async () => {
            const user = new User(testUser);
            await user.save();
        });

        it('debería iniciar sesión con credenciales correctas y devolver un token', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: testUser.email, password: testUser.password })
                .expect(200); // Assert: Esperamos un código 200 (OK)

            expect(response.body).toHaveProperty('token');
            expect(response.body.user.email).toBe(testUser.email);
        });

        it('debería devolver un error 401 con una contraseña incorrecta', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: testUser.email, password: 'wrongpassword' })
                .expect(401); // Assert: Esperamos un 401 (No autorizado)
            
            expect(response.body.error).toBe('Credenciales inválidas');
        });

        it('debería devolver un error 401 si el usuario no existe', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'nouser@example.com', password: 'password123' })
                .expect(401); // Assert: Esperamos un 401 (No autorizado)

            expect(response.body.error).toBe('Credenciales inválidas');
        });
    });
});