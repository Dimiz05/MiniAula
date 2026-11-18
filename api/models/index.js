import { sequelize } from '../config/database.js';
import { Curso } from './curso.js';
import { Inscripcion } from './inscripcion.js';
import { Leccion } from './leccion.js';
import { Pregunta } from './pregunta.js';
import { Progreso } from './progreso.js';
import { Usuario } from './usuario.js';

Curso.belongsTo(Usuario, { as: 'instructor', foreignKey: 'instructorId' });
Usuario.hasMany(Curso, { as: 'cursos', foreignKey: 'instructorId' });

Curso.hasMany(Leccion, { as: 'lecciones', foreignKey: 'cursoId' });
Leccion.belongsTo(Curso, { as: 'curso', foreignKey: 'cursoId' });

Leccion.hasMany(Pregunta, { as: 'preguntas', foreignKey: 'leccionId' });
Pregunta.belongsTo(Leccion, { as: 'leccion', foreignKey: 'leccionId' });

Inscripcion.belongsTo(Usuario, { as: 'estudiante', foreignKey: 'estudianteId' });
Usuario.hasMany(Inscripcion, { as: 'inscripciones', foreignKey: 'estudianteId' });

Inscripcion.belongsTo(Curso, { as: 'curso', foreignKey: 'cursoId' });
Curso.hasMany(Inscripcion, { as: 'inscripciones', foreignKey: 'cursoId' });

Progreso.belongsTo(Inscripcion, { as: 'inscripcion', foreignKey: 'inscripcionId' });
Inscripcion.hasMany(Progreso, { as: 'progresos', foreignKey: 'inscripcionId' });

Progreso.belongsTo(Leccion, { as: 'leccion', foreignKey: 'leccionId' });
Leccion.hasMany(Progreso, { as: 'progresos', foreignKey: 'leccionId' });

export { sequelize, Usuario, Curso, Leccion, Pregunta, Inscripcion, Progreso };
