import assert from 'node:assert/strict';
import { once } from 'node:events';
import {
  access,
  mkdtemp,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import app from '../app.js';
import {
  Curso,
  Inscripcion,
  Leccion,
  Usuario,
} from '../models/index.js';
import {
  detectarFormatoImagen,
  eliminarPortadaPropia,
  guardarPortadaPropia,
} from '../services/portada.service.js';
import { signAccessToken } from '../utils/jwt.js';

const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(16),
]);
const JPG = Buffer.concat([
  Buffer.from([0xff, 0xd8, 0xff]),
  Buffer.alloc(16),
]);
const WEBP = Buffer.alloc(16);
WEBP.write('RIFF', 0, 'ascii');
WEBP.write('WEBP', 8, 'ascii');

function cursoFalso(cambios = {}) {
  const curso = {
    id: 5,
    titulo: 'Curso de prueba',
    portada: null,
    instructorId: 9,
    ...cambios,
  };

  curso.get = () => ({ ...curso });
  curso.save = async () => {};

  return curso;
}

async function directorioTemporal(t) {
  const directorio = await mkdtemp(path.join(os.tmpdir(), 'miniaula-portadas-'));
  t.after(() => rm(directorio, { recursive: true, force: true }));
  return directorio;
}

function mockRelacionados(t) {
  t.mock.method(Leccion, 'count', async () => 2);
  t.mock.method(Inscripcion, 'count', async () => 1);
}

async function iniciarServidor(t) {
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  await once(server, 'listening');

  return `http://127.0.0.1:${server.address().port}`;
}

function tokenDe(id, rol) {
  return `Bearer ${signAccessToken({ id, rol })}`;
}

test('detects png, jpg and webp signatures and rejects other content', () => {
  assert.equal(detectarFormatoImagen(PNG), 'png');
  assert.equal(detectarFormatoImagen(JPG), 'jpg');
  assert.equal(detectarFormatoImagen(WEBP), 'webp');
  assert.equal(detectarFormatoImagen(Buffer.from('texto plano')), null);
  assert.equal(detectarFormatoImagen(Buffer.alloc(0)), null);
  assert.equal(detectarFormatoImagen('no-es-buffer'), null);
});

test('uploading a cover writes the image, updates the course and removes the old file', async (t) => {
  const directorio = await directorioTemporal(t);
  const anterior = path.join(directorio, 'anterior.png');
  await writeFile(anterior, PNG);

  const curso = cursoFalso({ portada: '/uploads/portadas/anterior.png' });
  let guardado = 0;
  curso.save = async () => {
    guardado += 1;
  };
  t.mock.method(Curso, 'findByPk', async () => curso);
  mockRelacionados(t);

  const resultado = await guardarPortadaPropia(9, 5, PNG, { directorio });
  const archivos = await readdir(directorio);

  assert.equal(guardado, 1);
  assert.match(resultado.portada, /^\/uploads\/portadas\/[0-9a-f-]+\.png$/);
  assert.deepEqual(archivos, [path.basename(resultado.portada)]);
  await assert.rejects(() => access(anterior));
});

test('invalid files are rejected before touching the filesystem', async (t) => {
  const directorio = await directorioTemporal(t);
  let consultado = false;
  t.mock.method(Curso, 'findByPk', async () => {
    consultado = true;
    return cursoFalso();
  });

  await assert.rejects(
    () => guardarPortadaPropia(9, 5, Buffer.from('no es una imagen'), { directorio }),
    (error) => error.statusCode === 422 && error.code === 'PORTADA_INVALIDA',
  );
  assert.equal(consultado, false);
  assert.deepEqual(await readdir(directorio), []);
});

test('a foreign course cannot store or delete its cover', async (t) => {
  const directorio = await directorioTemporal(t);
  t.mock.method(Curso, 'findByPk', async () => cursoFalso({ instructorId: 2 }));

  await assert.rejects(
    () => guardarPortadaPropia(9, 5, PNG, { directorio }),
    (error) => error.statusCode === 403 && error.code === 'CURSO_NO_PROPIO',
  );
  await assert.rejects(
    () => eliminarPortadaPropia(9, 5, { directorio }),
    (error) => error.statusCode === 403 && error.code === 'CURSO_NO_PROPIO',
  );
  assert.deepEqual(await readdir(directorio), []);
});

test('deleting a cover clears the field and removes the stored file', async (t) => {
  const directorio = await directorioTemporal(t);
  const archivo = path.join(directorio, 'portada.webp');
  await writeFile(archivo, WEBP);

  const curso = cursoFalso({ portada: '/uploads/portadas/portada.webp' });
  t.mock.method(Curso, 'findByPk', async () => curso);
  mockRelacionados(t);

  const resultado = await eliminarPortadaPropia(9, 5, { directorio });

  assert.equal(resultado.portada, null);
  assert.equal(curso.portada, null);
  await assert.rejects(() => access(archivo));
});

test('cover routes require an instructor session', async (t) => {
  const baseUrl = await iniciarServidor(t);

  for (const method of ['POST', 'DELETE']) {
    const response = await fetch(`${baseUrl}/api/cursos/5/portada`, {
      method,
      headers: { 'Content-Type': 'image/png' },
      body: method === 'POST' ? PNG : undefined,
    });

    assert.equal(response.status, 401, `${method} /api/cursos/5/portada`);
    assert.equal((await response.json()).error.code, 'NO_AUTENTICADO');
  }
});

test('CORS preflight allows the authorization and image content-type headers', async (t) => {
  const baseUrl = await iniciarServidor(t);

  const response = await fetch(`${baseUrl}/api/cursos/5/portada`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://localhost:5173',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'authorization,content-type',
    },
  });

  assert.equal(response.status, 204);
  assert.match(
    response.headers.get('access-control-allow-headers') ?? '',
    /authorization/i,
  );
  assert.match(response.headers.get('access-control-allow-headers') ?? '', /content-type/i);
});

test('an oversized cover is rejected before reaching the controller', async (t) => {
  const baseUrl = await iniciarServidor(t);
  t.mock.method(Usuario, 'findByPk', async () => ({ id: 9, rol: 'instructor' }));
  let consultado = false;
  t.mock.method(Curso, 'findByPk', async () => {
    consultado = true;
    return cursoFalso();
  });

  const response = await fetch(`${baseUrl}/api/cursos/5/portada`, {
    method: 'POST',
    headers: {
      Authorization: tokenDe(9, 'instructor'),
      'Content-Type': 'image/png',
    },
    body: Buffer.alloc(5 * 1024 * 1024 + 1),
  });

  assert.equal(response.status, 413);
  assert.equal((await response.json()).error.code, 'CUERPO_DEMASIADO_GRANDE');
  assert.equal(consultado, false);
});

test('an invalid image through the route returns 422', async (t) => {
  const baseUrl = await iniciarServidor(t);
  t.mock.method(Usuario, 'findByPk', async () => ({ id: 9, rol: 'instructor' }));
  t.mock.method(Curso, 'findByPk', async () => cursoFalso());

  const response = await fetch(`${baseUrl}/api/cursos/5/portada`, {
    method: 'POST',
    headers: {
      Authorization: tokenDe(9, 'instructor'),
      'Content-Type': 'text/plain',
    },
    body: 'esto no es una imagen',
  });

  assert.equal(response.status, 422);
  assert.equal((await response.json()).error.code, 'PORTADA_INVALIDA');
});
