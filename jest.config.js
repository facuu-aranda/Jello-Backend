module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // MODIFICADO: Añadimos el nuevo archivo al principio del array
  setupFilesAfterEnv: ['./tests/loadEnv.ts', './tests/setup.ts'],
};