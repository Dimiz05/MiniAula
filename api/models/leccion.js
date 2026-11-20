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
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [3, 150],
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
    },
    orden: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    notaMinima: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'nota_minima',
      validate: {
        min: 1,
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
    indexes: [{ fields: ['curso_id', 'orden'] }],
    validate: {
      contenidoSegunTipo() {
        if (this.tipo === 'contenido' && !this.contenido) {
          throw new Error('Una lección de contenido requiere el campo contenido.');
        }

        if (this.tipo === 'cuestionario' && (this.notaMinima === null || this.notaMinima === undefined)) {
          throw new Error('Un cuestionario requiere la nota mínima de aprobación.');
        }
      },
    },
  },
);
