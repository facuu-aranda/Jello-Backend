// Archivo: Jello-Backend/tests/setup.ts

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { server } from '../index'; // <-- 1. Importamos el servidor

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const mongoUri = mongo.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
  server.close(); // <-- 2. Añadimos esta línea para cerrar el servidor
});