import { sequelize } from '../config/database.js';
import { Curso } from './curso.js';
import { Leccion } from './leccion.js';
import { Usuario } from './usuario.js';

Usuario.hasMany(Curso, {
  foreignKey: 'instructorId',
  as: 'cursos',
});

Curso.belongsTo(Usuario, {
  foreignKey: 'instructorId',
  as: 'instructor',
});

Curso.hasMany(Leccion, {
  foreignKey: 'cursoId',
  as: 'lecciones',
});

Leccion.belongsTo(Curso, {
  foreignKey: 'cursoId',
  as: 'curso',
});

export { sequelize, Curso, Leccion, Usuario };
