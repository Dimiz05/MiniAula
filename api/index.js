import app from './app.js';
import { sequelize } from './config/database.js';
import { env } from './config/env.js';

async function main() {
  await sequelize.authenticate();
  console.log('Conexión a MySQL establecida.');

  const server = app.listen(env.PORT, '0.0.0.0');

  server.once('listening', () => {
    console.log(`MiniAula API listening on port ${server.address().port}`);
  });

  server.once('error', async (error) => {
    console.error(`MiniAula API failed to start: ${error.message}`);
    await sequelize.close().catch(() => {});
    process.exitCode = 1;
  });

  const shutdown = (signal) => {
    console.log(`${signal} recibido; cerrando la API.`);
    server.close(async () => {
      await sequelize.close();
      process.exit(0);
    });
  };

  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));
}

main().catch(async (error) => {
  console.error(`MiniAula API failed to start: ${error.message}`);
  await sequelize.close().catch(() => {});
  process.exitCode = 1;
});
