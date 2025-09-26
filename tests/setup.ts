import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongo: MongoMemoryServer;

// Se ejecuta una vez, antes de todas las pruebas
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const mongoUri = mongo.getUri();
  await mongoose.connect(mongoUri);
});

// Se ejecuta una vez, después de todas las pruebas
afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});