import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Curso = sequelize.define(
  'Curso',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    titulo: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [3, 150],
      },
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    categoria: {
      type: DataTypes.STRING(60),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 60],
      },
      set(value) {
        this.setDataValue('categoria', String(value).trim());
      },
    },
    nivel: {
      type: DataTypes.ENUM('basico', 'intermedio', 'avanzado'),
      allowNull: false,
      defaultValue: 'basico',
    },
    estado: {
      type: DataTypes.ENUM('borrador', 'publicado', 'archivado'),
      allowNull: false,
      defaultValue: 'borrador',
    },
    instructorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'instructor_id',
    },
    creadoEn: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'creado_en',
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'cursos',
    timestamps: true,
    createdAt: 'creadoEn',
    updatedAt: false,
    indexes: [
      { fields: ['estado'] },
      { fields: ['categoria'] },
      { fields: ['instructor_id'] },
    ],
  },
);
