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
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    categoria: {
      type: DataTypes.STRING(60),
      allowNull: false,
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
    instructor_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'usuarios', key: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
    creado_en: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  await queryInterface.addIndex('cursos', ['estado'], { name: 'cursos_estado_idx' });
  await queryInterface.addIndex('cursos', ['categoria'], { name: 'cursos_categoria_idx' });
  await queryInterface.addIndex('cursos', ['instructor_id'], { name: 'cursos_instructor_id_idx' });
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable('cursos');
}
