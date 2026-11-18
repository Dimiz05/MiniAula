import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Inscripcion = sequelize.define(
  'Inscripcion',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    estudianteId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'estudiante_id',
    },
    cursoId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'curso_id',
    },
    fechaInscripcion: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'fecha_inscripcion',
      defaultValue: DataTypes.NOW,
    },
    completado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: 'inscripciones',
    timestamps: false,
    indexes: [
      { unique: true, fields: ['estudiante_id', 'curso_id'], name: 'inscripciones_estudiante_curso_unique' },
      { fields: ['curso_id'] },
    ],
  },
);
