import { sequelize } from '../config/database.js';
import { migrator, seeder } from '../config/umzug.js';

async function prepararBaseDeDatos() {
  await sequelize.authenticate();

  const migraciones = await migrator.up();
  console.log(`[startup] ${migraciones.length} migración(es) aplicada(s).`);

  const seeds = await seeder.up();
  console.log(`[startup] ${seeds.length} seeder(s) ejecutado(s).`);
}

try {
  await prepararBaseDeDatos();
} catch (error) {
  console.error(`[startup] No se pudo preparar la base de datos: ${error.message}`);
  await sequelize.close().catch(() => {});
  process.exit(1);
}

await import('../index.js');
