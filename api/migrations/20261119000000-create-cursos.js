import { DataTypes } from 'sequelize';

export async function up({ context: queryInterface }) {
  await queryInterface.createTable('cursos', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    titulo: {
      type: DataTypes.STRING(160),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    categoria: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    nivel: {
      type: DataTypes.ENUM('principiante', 'intermedio', 'avanzado'),
      allowNull: false,
      defaultValue: 'principiante',
    },
    estado: {
      type: DataTypes.ENUM('borrador', 'publicado', 'archivado'),
      allowNull: false,
      defaultValue: 'borrador',
    },
    instructor_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    creado_en: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  await queryInterface.addConstraint('cursos', {
    fields: ['instructor_id'],
    type: 'foreign key',
    name: 'cursos_instructor_id_fk',
    references: {
      table: 'usuarios',
      field: 'id',
    },
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });

  await queryInterface.addIndex('cursos', ['estado', 'categoria', 'creado_en'], {
    name: 'cursos_catalogo_idx',
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable('cursos');
}
