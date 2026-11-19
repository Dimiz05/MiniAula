import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Usuario } from '../models/usuario.js';
import { registrarUsuario, iniciarSesion } from '../services/auth.service.js';
import { actualizarPerfil, toPublicUsuario } from '../services/usuario.service.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

function usuarioFalso(cambios = {}) {
  const usuario = {
    id: 7,
    nombre: 'Carla Méndez',
    email: 'carla@example.com',
    rol: 'estudiante',
    passwordHash: 'hash-previo',
    creadoEn: new Date('2026-11-18T10:00:00.000Z'),
    ...cambios,
  };

  usuario.get = () => ({
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    passwordHash: usuario.passwordHash,
    creadoEn: usuario.creadoEn,
  });
  usuario.save = async () => {};

  return usuario;
}

test('toPublicUsuario strips the password hash', () => {
  const publico = toPublicUsuario(usuarioFalso());

  assert.deepEqual(Object.keys(publico).sort(), ['creadoEn', 'email', 'id', 'nombre', 'rol']);
  assert.equal(publico.passwordHash, undefined);
});

test('registrarUsuario rejects a duplicate email without creating the account', async (t) => {
  t.mock.method(Usuario, 'findOne', async () => ({ id: 1 }));
  let creado = false;
  t.mock.method(Usuario, 'create', async () => {
    creado = true;
    return usuarioFalso();
  });

  await assert.rejects(
    () => registrarUsuario({
      nombre: 'Carla Méndez',
      email: 'carla@example.com',
      password: 'Miniaula123!',
      rol: 'estudiante',
    }),
    (error) => error.statusCode === 409 && error.code === 'EMAIL_EN_USO',
  );

  assert.equal(creado, false);
});

test('registrarUsuario stores a hash and returns the public user with a token', async (t) => {
  t.mock.method(Usuario, 'findOne', async () => null);
  let datosCreados;
  t.mock.method(Usuario, 'create', async (datos) => {
    datosCreados = datos;
    return usuarioFalso({ nombre: datos.nombre, email: datos.email });
  });

  const resultado = await registrarUsuario({
    nombre: 'Carla Méndez',
    email: 'carla@example.com',
    password: 'Miniaula123!',
    rol: 'estudiante',
  });

  assert.notEqual(datosCreados.passwordHash, 'Miniaula123!');
  assert.equal(await verifyPassword('Miniaula123!', datosCreados.passwordHash), true);
  assert.equal(resultado.usuario.passwordHash, undefined);
  assert.equal(verifyAccessToken(resultado.token).sub, '7');
  assert.equal(verifyAccessToken(resultado.token).rol, 'estudiante');
});

test('iniciarSesion returns the user token for valid credentials', async (t) => {
  const usuario = usuarioFalso({
    passwordHash: await hashPassword('Miniaula123!'),
  });
  t.mock.method(Usuario, 'scope', () => ({ findOne: async () => usuario }));

  const resultado = await iniciarSesion({
    email: 'carla@example.com',
    password: 'Miniaula123!',
  });

  assert.equal(resultado.usuario.email, 'carla@example.com');
  assert.equal(resultado.usuario.passwordHash, undefined);
  assert.equal(verifyAccessToken(resultado.token).sub, '7');
});

test('iniciarSesion rejects a wrong password with 401', async (t) => {
  const usuario = usuarioFalso({
    passwordHash: await hashPassword('OtraClave123!'),
  });
  t.mock.method(Usuario, 'scope', () => ({ findOne: async () => usuario }));

  await assert.rejects(
    () => iniciarSesion({ email: 'carla@example.com', password: 'Miniaula123!' }),
    (error) => error.statusCode === 401 && error.code === 'CREDENCIALES_INVALIDAS',
  );
});

test('iniciarSesion rejects an unknown email with 401', async (t) => {
  t.mock.method(Usuario, 'scope', () => ({ findOne: async () => null }));

  await assert.rejects(
    () => iniciarSesion({ email: 'nadie@example.com', password: 'Miniaula123!' }),
    (error) => error.statusCode === 401 && error.code === 'CREDENCIALES_INVALIDAS',
  );
});

test('actualizarPerfil changes name, email, and password', async (t) => {
  const usuario = usuarioFalso();
  let guardado = false;
  usuario.save = async () => {
    guardado = true;
  };
  t.mock.method(Usuario, 'findOne', async () => null);

  const publico = await actualizarPerfil(usuario, {
    nombre: 'Carla Actualizada',
    email: 'nueva@example.com',
    password: 'NuevaClave123!',
  });

  assert.equal(guardado, true);
  assert.equal(publico.nombre, 'Carla Actualizada');
  assert.equal(publico.email, 'nueva@example.com');
  assert.notEqual(usuario.passwordHash, 'hash-previo');
  assert.equal(await verifyPassword('NuevaClave123!', usuario.passwordHash), true);
  assert.equal(publico.passwordHash, undefined);
});

test('actualizarPerfil rejects an email used by another account', async (t) => {
  const usuario = usuarioFalso();
  t.mock.method(Usuario, 'findOne', async () => ({ id: 99 }));

  await assert.rejects(
    () => actualizarPerfil(usuario, { email: 'ocupado@example.com' }),
    (error) => error.statusCode === 409 && error.code === 'EMAIL_EN_USO',
  );
});

test('actualizarPerfil keeps the same email without a duplicate lookup', async (t) => {
  const usuario = usuarioFalso();
  let consultas = 0;
  t.mock.method(Usuario, 'findOne', async () => {
    consultas += 1;
    return null;
  });

  const publico = await actualizarPerfil(usuario, { email: 'carla@example.com' });

  assert.equal(consultas, 0);
  assert.equal(publico.email, 'carla@example.com');
});
