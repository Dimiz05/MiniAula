import { Usuario } from '../models/usuario.js';
import { AppError } from '../utils/errors.js';
import { hashPassword } from '../utils/password.js';

export function toPublicUsuario(usuario) {
  const { id, nombre, email, rol, creadoEn } = usuario.get({ plain: true });

  return { id, nombre, email, rol, creadoEn };
}

export async function actualizarPerfil(usuario, cambios) {
  if (cambios.email !== undefined && cambios.email !== usuario.email) {
    const existente = await Usuario.findOne({
      where: { email: cambios.email },
      attributes: ['id'],
    });

    if (existente) {
      throw new AppError(409, 'EMAIL_EN_USO', 'Ya existe una cuenta con ese email.');
    }

    usuario.email = cambios.email;
  }

  if (cambios.nombre !== undefined) {
    usuario.nombre = cambios.nombre;
  }

  if (cambios.password !== undefined) {
    usuario.passwordHash = await hashPassword(cambios.password);
  }

  await usuario.save();

  return toPublicUsuario(usuario);
}
