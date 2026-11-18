import { sequelize } from '../config/database.js';
import { migrator } from '../config/umzug.js';

const direction = process.argv[2] ?? 'up';

if (!['up', 'down'].includes(direction)) {
  throw new Error('Uso: node scripts/migrate.js [up|down]');
}

try {
  const migrations = direction === 'up'
    ? await migrator.up()
    : await migrator.down();

  const verb = direction === 'up' ? 'aplicada(s)' : 'revertida(s)';
  console.log(`${migrations.length} migración(es) ${verb}.`);
} catch (error) {
  console.error(`No se pudieron ejecutar las migraciones: ${error.message}`);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
