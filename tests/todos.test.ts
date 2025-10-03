import request from 'supertest';
import { app } from '../index';
import { User } from '../models/User.model';
import { Todo } from '../models/Todo.model';

describe('Endpoints de Tareas Personales - /api/todos', () => {
    let token: string;
    let userId: string;

    beforeEach(async () => {
        const user = new User({ name: 'Todo User', email: 'todo@test.com', password: 'password123' });
        const savedUser = await user.save();
        userId = (savedUser as any)._id.toString(); // CORRECCIÓN AQUÍ

        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'todo@test.com', password: 'password123' });
        token = response.body.token;
    });

    afterEach(async () => {
        await User.deleteMany({});
        await Todo.deleteMany({});
    });

    it('POST / - debería crear un nuevo todo para el usuario autenticado', async () => {
        const todoData = { text: 'Comprar leche' };
        const response = await request(app)
            .post('/api/todos')
            .set('Authorization', `Bearer ${token}`)
            .send(todoData)
            .expect(201);
        
        expect(response.body.text).toBe(todoData.text);
        expect(response.body.owner).toBe(userId);
    });

    it('GET / - debería obtener la lista de todos del usuario', async () => {
        await new Todo({ text: 'Pasear al perro', owner: userId }).save();
        await new Todo({ text: 'Llamar al banco', owner: userId }).save();

        const response = await request(app)
            .get('/api/todos')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        
        expect(response.body).toHaveLength(2);
    });

    it('PUT /:todoId - debería actualizar un todo existente', async () => {
        const todo = await new Todo({ text: 'Tarea inicial', completed: false, owner: userId }).save();

        const response = await request(app)
            .put(`/api/todos/${todo._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ completed: true, text: 'Tarea actualizada' })
            .expect(200);

        expect(response.body.completed).toBe(true);
        expect(response.body.text).toBe('Tarea actualizada');
    });

    it('DELETE /:todoId - debería eliminar un todo', async () => {
        const todo = await new Todo({ text: 'Tarea a eliminar', owner: userId }).save();

        await request(app)
            .delete(`/api/todos/${todo._id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(204);

        const todoInDb = await Todo.findById(todo._id);
        expect(todoInDb).toBeNull();
    });
});