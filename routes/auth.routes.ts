import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken'; 
import { IUser } from '../models/User.model'; 
import { IJwtPayload } from '../middleware/auth.middleware';
import * as authController from '../controllers/auth.controller';

const router = Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    const user = req.user as IUser;

    const payload = { id: user._id, name: user.name };
    const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '1h' });

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${token}`);
  }
);

router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get(
  '/github/callback',
  passport.authenticate('github', { failureRedirect: '/login', session: false }),
  (req, res) => {
    const payload = req.user as IJwtPayload;
    const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '1h' });
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${token}`);
  }
);

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// CORRECCIÓN: Se eliminan las rutas a controladores que no existen.
// Las funciones 'forgotPassword' y 'resetPassword' no están definidas en auth.controller.ts.
// router.post('/forgot-password', authController.forgotPassword);
// router.post('/reset-password/:token', authController.resetPassword);

export default router;
