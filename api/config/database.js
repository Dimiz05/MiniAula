import { Sequelize } from 'sequelize';
import { env } from './env.js';

export const sequelize = new Sequelize(
  env.MYSQL_DATABASE,
  env.MYSQL_USER,
  env.MYSQL_PASSWORD,
  {
    host: env.MYSQL_HOST,
    port: env.MYSQL_PORT,
    dialect: 'mysql',
    logging: env.MYSQL_LOGGING === 'true' ? (message) => console.debug(`[sql] ${message}`) : false,
    define: {
      underscored: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    },
    dialectOptions: {
      charset: 'utf8mb4',
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30_000,
      idle: 10_000,
    },
  },
);
