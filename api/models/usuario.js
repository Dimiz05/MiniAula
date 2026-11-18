import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Usuario = sequelize.define(
  'Usuario',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 120],
      },
    },
    email: {
      type: DataTypes.STRING(180),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
      set(value) {
        this.setDataValue('email', String(value).trim().toLowerCase());
      },
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash',
    },
    rol: {
      type: DataTypes.ENUM('estudiante', 'instructor'),
      allowNull: false,
      defaultValue: 'estudiante',
    },
    creadoEn: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'creado_en',
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'usuarios',
    timestamps: true,
    createdAt: 'creadoEn',
    updatedAt: false,
    defaultScope: {
      attributes: { exclude: ['passwordHash'] },
    },
    scopes: {
      withPassword: {},
    },
  },
);
