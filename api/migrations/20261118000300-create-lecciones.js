import { DataTypes } from 'sequelize';

export async function up({ context: queryInterface }) {
  await queryInterface.createTable('lecciones', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    titulo: {
      type: DataTypes.STRING(150),
      allowNull: false,
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
    video_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    orden: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    nota_minima: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    curso_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'cursos', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  });

  await queryInterface.addIndex('lecciones', ['curso_id', 'orden'], {
    name: 'lecciones_curso_orden_idx',
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable('lecciones');
}
