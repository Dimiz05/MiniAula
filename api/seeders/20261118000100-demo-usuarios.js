import { Usuario } from '../models/usuario.js';
import { hashPassword } from '../utils/password.js';

const PASSWORD_DEMO = 'Miniaula123!';

const usuariosDemo = [
  { nombre: 'Ana Torres', email: 'ana.instructora@miniaula.test', rol: 'instructor' },
  { nombre: 'Bruno Salas', email: 'bruno.instructor@miniaula.test', rol: 'instructor' },
  { nombre: 'Carla Méndez', email: 'carla.estudiante@miniaula.test', rol: 'estudiante' },
  { nombre: 'Diego Rojas', email: 'diego.estudiante@miniaula.test', rol: 'estudiante' },
  { nombre: 'Elena Paredes', email: 'elena.estudiante@miniaula.test', rol: 'estudiante' },
];

export async function up() {
  for (const datos of usuariosDemo) {
    const [, creado] = await Usuario.findOrCreate({
      where: { email: datos.email },
      defaults: {
        ...datos,
        passwordHash: await hashPassword(PASSWORD_DEMO),
      },
    });

    if (!creado) {
      console.log(`El usuario ${datos.email} ya existe; se omite.`);
    }
  }
}

export async function down() {
  await Usuario.destroy({
    where: { email: usuariosDemo.map((usuario) => usuario.email) },
  });
}
