import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Pregunta = sequelize.define(
  'Pregunta',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    enunciado: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    opciones: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    indiceCorrecto: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      field: 'indice_correcto',
    },
    leccionId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'leccion_id',
    },
  },
  {
    tableName: 'preguntas',
    timestamps: false,
    indexes: [{ fields: ['leccion_id'] }],
    validate: {
      opcionesValidas() {
        const opciones = this.opciones;

        if (!Array.isArray(opciones) || opciones.length < 2) {
          throw new Error('La pregunta requiere al menos dos opciones.');
        }

        if (opciones.some((opcion) => typeof opcion !== 'string' || opcion.trim() === '')) {
          throw new Error('Cada opción debe ser un texto no vacío.');
        }

        if (!Number.isInteger(this.indiceCorrecto)
          || this.indiceCorrecto < 0
          || this.indiceCorrecto >= opciones.length) {
          throw new Error('El índice de la respuesta correcta debe apuntar a una opción existente.');
        }
      },
    },
  },
);
