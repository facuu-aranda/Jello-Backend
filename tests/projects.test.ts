// Archivo: Jello-Backend/tests/projects.test.ts
import request from 'supertest';
import app from '../index'; 
import mongoose from 'mongoose';
import { User } from '../models/User.model';

describe('Endpoints de Proyectos - /api/projects', () => {
    let token: string;
    let userId: string;

    beforeEach(async () => {
        // Limpiamos la base de datos y creamos un usuario de prueba
        await User.deleteMany({});
        const userResponse = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Test User', email: 'test@example.com', password: 'password123' });
        
        token = userResponse.body.token;
        userId = userResponse.body.user.id;
    });

    afterEach(async () => {
        await mongoose.connection.db.dropDatabase();
    });

    it('POST / - debería crear un nuevo proyecto si el usuario está autenticado', async () => {
        const projectData = {
            name: 'Nuevo Proyecto de Prueba',
            description: 'Esta es una descripción de prueba.',
            color: 'bg-blue-500'
        };

        // --- SECCIÓN MODIFICADA ---
        // En lugar de enviar un campo 'data' con JSON, ahora enviamos cada
        // propiedad del objeto 'projectData' como un campo separado.
        // Esto simula correctamente un 'multipart/form-data' que el controlador espera.
        const response = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${token}`)
            .field('name', projectData.name)
            .field('description', projectData.description)
            .field('color', projectData.color)
            .expect(201); // Verificamos que el código de estado sea 201 (Created)

        expect(response.body.name).toBe(projectData.name);
        expect(response.body.isOwner).toBe(true);
        expect(response.body.members).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: userId })
            ])
        );
    });

    it('GET / - debería devolver los proyectos del usuario autenticado', async () => {
        // Primero creamos un proyecto para poder obtenerlo después
        await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${token}`)
            .field('name', 'Proyecto para GET')
            .field('description', 'Desc GET')
            .field('color', 'bg-red-500');

        const response = await request(app)
            .get('/api/projects')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBe(1);
        expect(response.body[0].name).toBe('Proyecto para GET');
    });

    it('GET /:projectId - debería devolver detalles de un proyecto específico', async () => {
        const createResponse = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${token}`)
            .field('name', 'Proyecto para GET por ID')
            .field('description', 'Desc GET por ID')
            .field('color', 'bg-green-500');

        const projectId = createResponse.body.id;

        const response = await request(app)
            .get(`/api/projects/${projectId}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(response.body.id).toBe(projectId);
        expect(response.body.name).toBe('Proyecto para GET por ID');
    });

    it('PUT /:projectId - debería actualizar un proyecto', async () => {
        const createResponse = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${token}`)
            .field('name', 'Proyecto a Actualizar')
            .field('description', 'Desc Original')
            .field('color', 'bg-yellow-500');

        const projectId = createResponse.body.id;
        const updatedData = { name: 'Proyecto Actualizado', description: 'Desc Actualizada' };

        const response = await request(app)
            .put(`/api/projects/${projectId}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updatedData) // Para PUT no es necesario 'multipart', podemos enviar JSON
            .expect(200);

        expect(response.body.name).toBe(updatedData.name);
        expect(response.body.description).toBe(updatedData.description);
    });

    it('DELETE /:projectId - debería eliminar un proyecto', async () => {
        const createResponse = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${token}`)
            .field('name', 'Proyecto a Eliminar')
            .field('description', 'Desc a Eliminar')
            .field('color', 'bg-purple-500');

        const projectId = createResponse.body.id;

        await request(app)
            .delete(`/api/projects/${projectId}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(204); // Verificamos que la respuesta sea 204 (No Content)
    });
});