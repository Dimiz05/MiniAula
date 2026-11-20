import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  Curso,
  Inscripcion,
  Leccion,
  sequelize,
} from '../models/index.js';
import {
  archivarCursoPropio,
  eliminarCursoPropio,
  publicarCursoPropio,
} from '../services/curso.service.js';

const TRANSACCION = { LOCK: { UPDATE: 'UPDATE' } };

function cursoFalso(cambios = {}) {
  const curso = {
    id: 5,
    titulo: 'Curso de prueba',
    descripcion: 'Descripción del curso',
    categoria: 'Diseño',
    nivel: 'basico',
    estado: 'borrador',
    instructorId: 9,
    creadoEn: new Date('2026-11-18T10:00:00.000Z'),
    ...cambios,
  };

  curso.get = () => ({ ...curso });
  curso.save = async () => {};
  curso.destroy = async () => {};

  return curso;
}

function simularTransaccion(t) {
  t.mock.method(sequelize, 'transaction', async (callback) => callback(TRANSACCION));
}

function bloquearCurso(t, curso) {
  let recibido;
  t.mock.method(Curso, 'findByPk', async (id, opciones) => {
    recibido = { id, opciones };
    return curso;
  });

  return () => recibido;
}

test('publishing a course without lessons fails without saving', async (t) => {
  simularTransaccion(t);
  const curso = cursoFalso();
  const opcionesCurso = bloquearCurso(t, curso);
  let guardado = false;
  curso.save = async () => {
    guardado = true;
  };
  t.mock.method(Leccion, 'count', async () => 0);

  await assert.rejects(
    () => publicarCursoPropio(9, 5),
    (error) => error.statusCode === 409 && error.code === 'CURSO_SIN_LECCIONES',
  );

  assert.equal(guardado, false);
  assert.equal(curso.estado, 'borrador');
  assert.equal(opcionesCurso().opciones.transaction, TRANSACCION);
  assert.equal(opcionesCurso().opciones.lock, 'UPDATE');
});

test('a valid own draft can be published and reports its totals', async (t) => {
  simularTransaccion(t);
  const curso = cursoFalso();
  bloquearCurso(t, curso);
  let guardado = false;
  curso.save = async () => {
    guardado = true;
  };
  t.mock.method(Leccion, 'count', async () => 2);
  t.mock.method(Inscripcion, 'count', async () => 0);

  const publicado = await publicarCursoPropio(9, 5);

  assert.equal(guardado, true);
  assert.equal(publicado.estado, 'publicado');
  assert.equal(publicado.totalLecciones, 2);
  assert.equal(publicado.totalInscritos, 0);
});

test('a course already published cannot be published again', async (t) => {
  simularTransaccion(t);
  bloquearCurso(t, cursoFalso({ estado: 'publicado' }));
  let leccionesConsultadas = false;
  t.mock.method(Leccion, 'count', async () => {
    leccionesConsultadas = true;
    return 1;
  });

  await assert.rejects(
    () => publicarCursoPropio(9, 5),
    (error) => error.statusCode === 409 && error.code === 'CURSO_YA_PUBLICADO',
  );

  assert.equal(leccionesConsultadas, false);
});

test('an archived course cannot be published', async (t) => {
  simularTransaccion(t);
  bloquearCurso(t, cursoFalso({ estado: 'archivado' }));

  await assert.rejects(
    () => publicarCursoPropio(9, 5),
    (error) => error.statusCode === 409 && error.code === 'TRANSICION_INVALIDA',
  );
});

test('an instructor cannot publish a foreign course', async (t) => {
  simularTransaccion(t);
  bloquearCurso(t, cursoFalso({ instructorId: 2 }));
  let leccionesConsultadas = false;
  t.mock.method(Leccion, 'count', async () => {
    leccionesConsultadas = true;
    return 1;
  });

  await assert.rejects(
    () => publicarCursoPropio(9, 5),
    (error) => error.statusCode === 403 && error.code === 'CURSO_NO_PROPIO',
  );

  assert.equal(leccionesConsultadas, false);
});

test('a course with enrolled students can be archived', async (t) => {
  simularTransaccion(t);
  const curso = cursoFalso({ estado: 'publicado' });
  bloquearCurso(t, curso);
  let guardado = false;
  curso.save = async () => {
    guardado = true;
  };
  t.mock.method(Leccion, 'count', async () => 3);
  t.mock.method(Inscripcion, 'count', async () => 2);

  const archivado = await archivarCursoPropio(9, 5);

  assert.equal(guardado, true);
  assert.equal(archivado.estado, 'archivado');
  assert.equal(archivado.totalLecciones, 3);
  assert.equal(archivado.totalInscritos, 2);
});

test('a draft can also be archived', async (t) => {
  simularTransaccion(t);
  const curso = cursoFalso();
  bloquearCurso(t, curso);
  t.mock.method(Leccion, 'count', async () => 0);
  t.mock.method(Inscripcion, 'count', async () => 0);

  const archivado = await archivarCursoPropio(9, 5);

  assert.equal(archivado.estado, 'archivado');
});

test('an already archived course cannot be archived again', async (t) => {
  simularTransaccion(t);
  bloquearCurso(t, cursoFalso({ estado: 'archivado' }));

  await assert.rejects(
    () => archivarCursoPropio(9, 5),
    (error) => error.statusCode === 409 && error.code === 'CURSO_YA_ARCHIVADO',
  );
});

test('deleting a course with enrolled students fails without destroying it', async (t) => {
  simularTransaccion(t);
  const curso = cursoFalso();
  bloquearCurso(t, curso);
  let destruido = false;
  curso.destroy = async () => {
    destruido = true;
  };
  t.mock.method(Inscripcion, 'count', async () => 1);

  await assert.rejects(
    () => eliminarCursoPropio(9, 5),
    (error) => error.statusCode === 409 && error.code === 'CURSO_CON_INSCRIPCIONES',
  );

  assert.equal(destruido, false);
});

test('deleting a course without enrollments destroys it inside the transaction', async (t) => {
  simularTransaccion(t);
  const curso = cursoFalso();
  bloquearCurso(t, curso);
  let transaccionRecibida;
  curso.destroy = async (opciones) => {
    transaccionRecibida = opciones.transaction;
  };
  t.mock.method(Inscripcion, 'count', async () => 0);

  await eliminarCursoPropio(9, 5);

  assert.equal(transaccionRecibida, TRANSACCION);
});

test('an instructor cannot delete a foreign course', async (t) => {
  simularTransaccion(t);
  const curso = cursoFalso({ instructorId: 2 });
  bloquearCurso(t, curso);
  let inscripcionesConsultadas = false;
  t.mock.method(Inscripcion, 'count', async () => {
    inscripcionesConsultadas = true;
    return 0;
  });

  await assert.rejects(
    () => eliminarCursoPropio(9, 5),
    (error) => error.statusCode === 403 && error.code === 'CURSO_NO_PROPIO',
  );

  assert.equal(inscripcionesConsultadas, false);
});

test('state changes and deletion report a missing course as 404', async (t) => {
  simularTransaccion(t);
  t.mock.method(Curso, 'findByPk', async () => null);

  for (const operacion of [
    () => publicarCursoPropio(9, 5),
    () => archivarCursoPropio(9, 5),
    () => eliminarCursoPropio(9, 5),
  ]) {
    await assert.rejects(
      operacion,
      (error) => error.statusCode === 404 && error.code === 'CURSO_NO_ENCONTRADO',
    );
  }
});
