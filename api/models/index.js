import { sequelize } from '../config/database.js';
import { Curso } from './curso.js';
import { Usuario } from './usuario.js';

Usuario.hasMany(Curso, {
  foreignKey: 'instructorId',
  as: 'cursos',
});

Curso.belongsTo(Usuario, {
  foreignKey: 'instructorId',
  as: 'instructor',
});

export { sequelize, Curso, Usuario };
