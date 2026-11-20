import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Progreso = sequelize.define(
  'Progreso',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    inscripcionId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'inscripcion_id',
    },
    leccionId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'leccion_id',
    },
    completada: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    intentos: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 3,
      },
    },
    mejorNota: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'mejor_nota',
      validate: {
        min: 0,
        max: 100,
      },
    },
    actualizadoEn: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'actualizado_en',
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'progresos',
    timestamps: true,
    createdAt: false,
    updatedAt: 'actualizadoEn',
    indexes: [
      { unique: true, fields: ['inscripcion_id', 'leccion_id'], name: 'progresos_inscripcion_leccion_unique' },
      { fields: ['leccion_id'] },
    ],
  },
);
