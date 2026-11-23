import { DataTypes } from 'sequelize';

export async function up({ context: queryInterface }) {
  await queryInterface.addColumn('cursos', 'portada', {
    type: DataTypes.STRING(500),
    allowNull: true,
    after: 'descripcion',
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.removeColumn('cursos', 'portada');
}
