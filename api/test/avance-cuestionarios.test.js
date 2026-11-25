import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  Inscripcion,
  Leccion,
  Pregunta,
  Progreso,
  sequelize,
} from '../models/index.js';
import { construirTemarioEstudiante } from '../services/inscripcion.service.js';
import { registrarIntento } from '../services/intento.service.js';
import { obtenerLeccionEstudiante } from '../services/leccion.service.js';

const TRANSACCION = { LOCK: { UPDATE: 'UPDATE' } };

function leccionFalsa({
  id,
  orden,
  titulo,
  tipo = 'contenido',
  contenido = 'Texto de la lección',
  notaMinima = null,
}) {
  const leccion = {
    id,
    cursoId: 5,
    titulo,
    tipo,
    contenido: tipo === 'contenido' ? contenido : null,
    videoUrl: null,
    orden,
    notaMinima,
  };

  leccion.get = () => ({ ...leccion });
  return leccion;
}

function progresoFalso(cambios = {}) {
  const progreso = {
    id: 21,
    inscripcionId: 11,
    leccionId: 12,
    completada: false,
    intentos: 0,
    mejorNota: null,
    ...cambios,
  };

  progreso.save = async () => {};
  return progreso;
}

function prepararEscenario(t) {
  const cuestionario = leccionFalsa({
    id: 12,
    orden: 1,
    titulo: 'Cuestionario final',
    tipo: 'cuestionario',
    notaMinima: 70,
  });
  const siguiente = leccionFalsa({
    id: 13,
    orden: 2,
    titulo: 'Siguiente lección',
    contenido: 'Contenido desbloqueado',
  });
  const lecciones = [cuestionario, siguiente];
  const progreso = progresoFalso();
  const inscripcion = {
    id: 11,
    estudianteId: 7,
    cursoId: 5,
  };

  t.mock.method(Leccion, 'findByPk', async (id) => (
    Number(id) === Number(siguiente.id) ? siguiente : cuestionario
  ));
  t.mock.method(Inscripcion, 'findOne', async () => inscripcion);
  t.mock.method(Leccion, 'findAll', async () => lecciones);
  t.mock.method(Pregunta, 'findAll', async () => [{
    id: 41,
    enunciado: '¿Cuál es la respuesta correcta?',
    opciones: ['Incorrecta', 'Correcta'],
    indiceCorrecto: 1,
    leccionId: 12,
  }]);
  t.mock.method(Progreso, 'findOrCreate', async () => [progreso, true]);
  t.mock.method(Progreso, 'findOne', async ({ where }) => (
    Number(where.leccionId) === Number(progreso.leccionId) ? progreso : null
  ));
  t.mock.method(
    sequelize,
    'transaction',
    async (callback) => callback(TRANSACCION),
  );

  return { cuestionario, siguiente, lecciones, progreso };
}

test('a failing attempt keeps the next lesson locked for the same enrollment', async (t) => {
  const { lecciones, progreso } = prepararEscenario(t);

  const resultado = await registrarIntento(7, 12, [
    { preguntaId: 41, opcion: 0 },
  ]);

  assert.equal(resultado.nota, 0);
  assert.equal(resultado.aprobada, false);
  assert.equal(resultado.mejorNota, 0);
  assert.equal(progreso.intentos, 1);
  assert.equal(progreso.mejorNota, 0);

  const temario = construirTemarioEstudiante(lecciones, [progreso]);
  assert.deepEqual(
    temario.map((leccion) => leccion.estado),
    ['disponible', 'bloqueada'],
  );

  await assert.rejects(
    () => obtenerLeccionEstudiante(7, 13),
    (error) => error.statusCode === 403
      && error.code === 'LECCION_BLOQUEADA',
  );
});

test('a passing attempt unlocks the next lesson through the stored best grade', async (t) => {
  const { lecciones, progreso } = prepararEscenario(t);

  const resultado = await registrarIntento(7, 12, [
    { preguntaId: 41, opcion: 1 },
  ]);

  assert.equal(resultado.nota, 100);
  assert.equal(resultado.aprobada, true);
  assert.equal(resultado.mejorNota, 100);
  assert.equal(progreso.intentos, 1);
  assert.equal(progreso.mejorNota, 100);

  const temario = construirTemarioEstudiante(lecciones, [progreso]);
  assert.deepEqual(
    temario.map((leccion) => leccion.estado),
    ['completada', 'disponible'],
  );

  const siguiente = await obtenerLeccionEstudiante(7, 13);
  assert.equal(siguiente.id, 13);
  assert.equal(siguiente.contenido, 'Contenido desbloqueado');
});

test('a failed retry does not revoke access already earned with the best grade', async (t) => {
  const { lecciones, progreso } = prepararEscenario(t);

  await registrarIntento(7, 12, [{ preguntaId: 41, opcion: 1 }]);
  const reintento = await registrarIntento(7, 12, [
    { preguntaId: 41, opcion: 0 },
  ]);

  assert.equal(reintento.nota, 0);
  assert.equal(reintento.aprobada, true);
  assert.equal(reintento.mejorNota, 100);
  assert.equal(progreso.intentos, 2);
  assert.equal(progreso.mejorNota, 100);

  const temario = construirTemarioEstudiante(lecciones, [progreso]);
  assert.deepEqual(
    temario.map((leccion) => leccion.estado),
    ['completada', 'disponible'],
  );

  const siguiente = await obtenerLeccionEstudiante(7, 13);
  assert.equal(siguiente.id, 13);
});
