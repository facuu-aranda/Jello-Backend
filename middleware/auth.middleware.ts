import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface IJwtPayload {
  id: string;
  name: string;
}


const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Acceso denegado. Token no proporcionado.' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as IJwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'El token no es válido.' });
  }
};

export default authMiddleware;