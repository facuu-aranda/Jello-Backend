// Archivo: Jello-Backend/config/cloudinary.config.ts

import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

let storage;

// Si estamos en un entorno de prueba, usamos el almacenamiento en memoria de multer.
// Esto es súper rápido y no requiere ninguna conexión externa ni credenciales.
if (process.env.NODE_ENV === 'test') {
  storage = multer.memoryStorage();
} else {
  // Si no, configuramos y usamos Cloudinary como siempre.
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'jello-app',
      allowed_formats: ['jpg', 'png', 'pdf', 'gif']
    } as any 
  });
}

export default multer({ storage });