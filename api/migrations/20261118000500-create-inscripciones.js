import { DataTypes } from 'sequelize';

export async function up({ context: queryInterface }) {
  await queryInterface.createTable('inscripciones', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    estudiante_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'usuarios', key: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
    curso_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'cursos', key: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
    fecha_inscripcion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    completado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  });

  await queryInterface.addConstraint('inscripciones', {
    fields: ['estudiante_id', 'curso_id'],
    type: 'unique',
    name: 'inscripciones_estudiante_curso_unique',
  });

  await queryInterface.addIndex('inscripciones', ['curso_id'], {
    name: 'inscripciones_curso_id_idx',
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable('inscripciones');
}
