import { DataTypes } from 'sequelize';

export async function up({ context: queryInterface }) {
  await queryInterface.createTable('progresos', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    inscripcion_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'inscripciones', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    leccion_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'lecciones', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
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
    },
    mejor_nota: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    actualizado_en: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  await queryInterface.addConstraint('progresos', {
    fields: ['inscripcion_id', 'leccion_id'],
    type: 'unique',
    name: 'progresos_inscripcion_leccion_unique',
  });

  await queryInterface.addIndex('progresos', ['leccion_id'], {
    name: 'progresos_leccion_id_idx',
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable('progresos');
}
