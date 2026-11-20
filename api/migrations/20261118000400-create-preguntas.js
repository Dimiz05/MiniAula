import { DataTypes } from 'sequelize';

export async function up({ context: queryInterface }) {
  await queryInterface.createTable('preguntas', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    enunciado: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    opciones: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    indice_correcto: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
    },
    leccion_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'lecciones', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  });

  await queryInterface.addIndex('preguntas', ['leccion_id'], { name: 'preguntas_leccion_id_idx' });
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable('preguntas');
}
