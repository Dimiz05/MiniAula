import { sequelize } from '../config/database.js';
import { seeder } from '../config/umzug.js';

try {
  const seeds = await seeder.up();
  console.log(`${seeds.length} seeder(s) ejecutado(s).`);
} catch (error) {
  console.error(`No se pudieron ejecutar los seeders: ${error.message}`);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
