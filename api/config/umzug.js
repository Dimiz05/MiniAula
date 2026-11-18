import { fileURLToPath } from 'node:url';
import { SequelizeStorage, Umzug } from 'umzug';
import { sequelize } from './database.js';

function resolveGlob(directory) {
  return fileURLToPath(new URL(`../${directory}/*.js`, import.meta.url))
    .replaceAll('\\', '/');
}

export const migrator = new Umzug({
  migrations: { glob: resolveGlob('migrations') },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({
    sequelize,
    modelName: 'SequelizeMeta',
    tableName: 'sequelize_meta',
  }),
  logger: console,
});

export const seeder = new Umzug({
  migrations: { glob: resolveGlob('seeders') },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({
    sequelize,
    modelName: 'SequelizeData',
    tableName: 'sequelize_data',
  }),
  logger: console,
});
