// Archivo: Jello-Backend/__mocks__/cloudinary.ts

// Simulamos la estructura del paquete 'cloudinary' que tu aplicación utiliza.
export const v2 = {
  // Creamos una función 'config' falsa que no hace nada.
  // Esto evita el error de las variables de entorno.
  config: jest.fn(),
  
  // Creamos un 'uploader' falso.
  uploader: {
    // Simulamos la función 'upload' que multer-storage-cloudinary podría usar.
    // Simplemente devuelve una URL falsa de inmediato.
    upload: jest.fn((file, options) => {
      return Promise.resolve({
        path: 'https://fake.cloudinary.url/mock-image.png',
        secure_url: 'https://fake.cloudinary.url/mock-image.png'
      });
    }),
  },
};