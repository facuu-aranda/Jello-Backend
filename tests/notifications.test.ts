import request from 'supertest';
import { app } from '../index';
import { User } from '../models/User.model';
import { Project } from '../models/Project.model';
import { Notification } from '../models/Notification.model';
import mongoose from 'mongoose';

describe('Endpoints de Notificaciones - /api/notifications', () => {
    let tokenSender: string, tokenRecipient: string;
    let senderId: string, recipientId: string;
    let projectId: string;
    let notificationId: string;

    beforeEach(async () => {
        const sender = await new User({ name: 'Sender', email: 'sender@test.com', password: 'password123' }).save();
        const recipient = await new User({ name: 'Recipient', email: 'recipient@test.com', password: 'password123' }).save();
        senderId = (sender as any)._id.toString();       // CORRECCIÓN AQUÍ
        recipientId = (recipient as any)._id.toString(); // CORRECCIÓN AQUÍ

        const senderLogin = await request(app).post('/api/auth/login').send({ email: 'sender@test.com', password: 'password123' });
        tokenSender = senderLogin.body.token;
        const recipientLogin = await request(app).post('/api/auth/login').send({ email: 'recipient@test.com', password: 'password123' });
        tokenRecipient = recipientLogin.body.token;

        const project = await new Project({ name: 'Notification Project', description: 'desc', color: 'purple', owner: senderId, members: [{ user: senderId, role: 'admin' }] }).save();
        projectId = (project as any)._id.toString(); // CORRECCIÓN AQUÍ
        
        const notification = await new Notification({ recipient: recipientId, sender: senderId, type: 'invitation', status: 'pending', project: projectId, text: 'invitacion', link: '/' }).save();
        notificationId = (notification as any)._id.toString(); // CORRECCIÓN AQUÍ
    });

    afterEach(async () => {
        await User.deleteMany({});
        await Project.deleteMany({});
        await Notification.deleteMany({});
    });

    it('GET / - debería obtener las notificaciones del usuario', async () => {
        const response = await request(app)
            .get('/api/notifications')
            .set('Authorization', `Bearer ${tokenRecipient}`)
            .expect(200);

        expect(response.body).toHaveLength(1);
        expect(response.body[0].recipient).toBe(recipientId);
    });

    it('PUT /:notificationId/respond - debería permitir aceptar una invitación', async () => {
        await request(app)
            .put(`/api/notifications/${notificationId}/respond`)
            .set('Authorization', `Bearer ${tokenRecipient}`)
            .send({ response: 'accepted' })
            .expect(200);

        const project = await Project.findById(projectId);
        const isMember = project?.members.some(m => (m.user as any).equals(recipientId));
        expect(isMember).toBe(true);
    });
});