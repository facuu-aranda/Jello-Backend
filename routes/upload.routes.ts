import { Router, Request, Response } from 'express';
import uploader from '../config/cloudinary.config';

const router = Router();

router.post('/upload', uploader.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: "No se subió ningún archivo." });
  }

  res.json({ fileUrl: req.file.path });
});

export default router;