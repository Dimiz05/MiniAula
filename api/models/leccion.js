import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Leccion = sequelize.define(
  'Leccion',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    titulo: {
      type: DataTypes.STRING(160),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [3, 160],
      },
    },
    tipo: {
      type: DataTypes.ENUM('contenido', 'cuestionario'),
      allowNull: false,
      defaultValue: 'contenido',
    },
    contenido: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    videoUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'video_url',
      validate: {
        isUrl: true,
      },
    },
    orden: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    notaMinima: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: true,
      field: 'nota_minima',
      validate: {
        min: 0,
        max: 100,
      },
    },
    cursoId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'curso_id',
    },
  },
  {
    tableName: 'lecciones',
    timestamps: false,
  },
);
