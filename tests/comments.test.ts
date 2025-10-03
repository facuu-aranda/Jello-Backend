import request from 'supertest';
import { app } from '../index';
import { User } from '../models/User.model';
import { Project } from '../models/Project.model';
import { Task } from '../models/Task.model';
import { Comment } from '../models/Comment.model';

describe('Endpoints de Comentarios', () => {
    let tokenOwner: string;
    let tokenMember: string;
    let ownerId: string;
    let memberId: string;
    let projectId: string;
    let taskId: string;

    beforeEach(async () => {
        const owner = await new User({ name: 'Owner', email: 'owner@test.com', password: 'password123' }).save();
        const member = await new User({ name: 'Member', email: 'member@test.com', password: 'password123' }).save();
        ownerId = (owner as any)._id.toString();   // CORRECCIÓN AQUÍ
        memberId = (member as any)._id.toString(); // CORRECCIÓN AQUÍ

        const ownerLogin = await request(app).post('/api/auth/login').send({ email: 'owner@test.com', password: 'password123' });
        tokenOwner = ownerLogin.body.token;
        const memberLogin = await request(app).post('/api/auth/login').send({ email: 'member@test.com', password: 'password123' });
        tokenMember = memberLogin.body.token;

        const project = await new Project({ 
            name: 'Project for Comments', 
            description: 'desc', 
            color: 'blue', 
            owner: ownerId, 
            members: [{ user: ownerId, role: 'admin' }, { user: memberId, role: 'member' }] 
        }).save();
        projectId = (project as any)._id.toString(); // CORRECCIÓN AQUÍ

        const task = await new Task({ title: 'Task for Comments', project: projectId }).save();
        taskId = (task as any)._id.toString(); // CORRECCIÓN AQUÍ
    });
    
    afterEach(async () => {
        await User.deleteMany({});
        await Project.deleteMany({});
        await Task.deleteMany({});
        await Comment.deleteMany({});
    });

    it('POST /api/tasks/:taskId/comments - debería permitir a un miembro del proyecto añadir un comentario', async () => {
        const response = await request(app)
            .post(`/api/tasks/${taskId}/comments`)
            .set('Authorization', `Bearer ${tokenMember}`)
            .send({ content: 'Este es un comentario de prueba' })
            .expect(201);
            
        expect(response.body.content).toBe('Este es un comentario de prueba');
        expect(response.body.author.id).toBe(memberId);
    });
    

    it('DELETE /api/comments/:commentId - debería permitir a un usuario eliminar su propio comentario', async () => {
        const comment = await new Comment({ content: 'A eliminar', author: memberId, task: taskId }).save();

        await request(app)
            .delete(`/api/comments/${comment._id}`)
            .set('Authorization', `Bearer ${tokenMember}`)
            .expect(204);

        const commentInDb = await Comment.findById(comment._id);
        expect(commentInDb).toBeNull();
    });

    it('DELETE /api/comments/:commentId - NO debería permitir a un usuario eliminar el comentario de otro', async () => {
        const comment = await new Comment({ content: 'Comentario del owner', author: ownerId, task: taskId }).save();

        await request(app)
            .delete(`/api/comments/${comment._id}`)
            .set('Authorization', `Bearer ${tokenMember}`) // Intenta eliminar como 'member'
            .expect(403);
    });
    
    it('DELETE /api/comments/:commentId - debería permitir al DUEÑO del proyecto eliminar cualquier comentario', async () => {
        const comment = await new Comment({ content: 'Comentario del miembro', author: memberId, task: taskId }).save();

        await request(app)
            .delete(`/api/comments/${comment._id}`)
            .set('Authorization', `Bearer ${tokenOwner}`) // Elimina como 'owner' del proyecto
            .expect(204);
            
        const commentInDb = await Comment.findById(comment._id);
        expect(commentInDb).toBeNull();
    });
});


