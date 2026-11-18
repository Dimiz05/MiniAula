import { Usuario } from '../models/usuario.js';
import { AppError } from '../utils/errors.js';
import { signAccessToken } from '../utils/jwt.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { toPublicUsuario } from './usuario.service.js';

export async function registrarUsuario({ nombre, email, password, rol }) {
  const existente = await Usuario.findOne({
    where: { email },
    attributes: ['id'],
  });

  if (existente) {
    throw new AppError(409, 'EMAIL_EN_USO', 'Ya existe una cuenta con ese email.');
  }

  const usuario = await Usuario.create({
    nombre,
    email,
    rol,
    passwordHash: await hashPassword(password),
  });

  return {
    usuario: toPublicUsuario(usuario),
    token: signAccessToken(usuario),
  };
}

export async function iniciarSesion({ email, password }) {
  const usuario = await Usuario.scope('withPassword').findOne({
    where: { email },
  });

  const passwordValida = usuario
    ? await verifyPassword(password, usuario.passwordHash)
    : false;

  if (!usuario || !passwordValida) {
    throw new AppError(401, 'CREDENCIALES_INVALIDAS', 'Email o contraseña incorrectos.');
  }

  return {
    usuario: toPublicUsuario(usuario),
    token: signAccessToken(usuario),
  };
}
