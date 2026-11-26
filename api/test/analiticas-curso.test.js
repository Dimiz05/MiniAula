import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import app from '../app.js';
import {
  Curso,
  Inscripcion,
  Leccion,
  Progreso,
  Usuario,
} from '../models/index.js';
import { obtenerAnaliticasCurso } from '../services/metrica.service.js';
import { signAccessToken } from '../utils/jwt.js';

async function iniciarServidor(t) {
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  await once(server, 'listening');

  return `http://127.0.0.1:${server.address().port}`;
}

function crearDatos(t, {
  curso = { id: 1, titulo: 'React', estado: 'publicado', instructorId: 9 },
  lecciones = [],
  inscripciones = [],
  progresos = [],
} = {}) {
  let consultaCurso;
  let consultaLecciones;
  let consultaInscripciones;
  let consultaProgresos;

  t.mock.method(Curso, 'findByPk', async (id) => {
    consultaCurso = id;
    return curso;
  });
  t.mock.method(Leccion, 'findAll', async (opciones) => {
    consultaLecciones = opciones;
    return lecciones;
  });
  t.mock.method(Inscripcion, 'findAll', async (opciones) => {
    consultaInscripciones = opciones;
    return inscripciones;
  });
  t.mock.method(Progreso, 'findAll', async (opciones) => {
    consultaProgresos = opciones;
    return progresos;
  });

  return {
    consultaCurso: () => consultaCurso,
    consultaLecciones: () => consultaLecciones,
    consultaInscripciones: () => consultaInscripciones,
    consultaProgresos: () => consultaProgresos,
  };
}

function leccion(id, orden, tipo = 'contenido', notaMinima = null) {
  return {
    id,
    cursoId: 1,
    titulo: `Lección ${orden}`,
    tipo,
    orden,
    notaMinima,
  };
}

function inscripcion(id) {
  return { id, cursoId: 1 };
}

function progreso(inscripcionId, leccionId, datos = {}) {
  return {
    inscripcionId,
    leccionId,
    completada: false,
    intentos: 0,
    mejorNota: null,
    ...datos,
  };
}

test('las analíticas detalladas calculan embudo, distribución y cuestionario', async (t) => {
  const consultas = crearDatos(t, {
    curso: { id: 1, titulo: 'React', estado: 'publicado', instructorId: 9 },
    lecciones: [
      leccion(11, 1),
      leccion(12, 2),
      leccion(13, 3, 'cuestionario', 70),
    ],
    inscripciones: [1, 2, 3, 4, 5, 6].map(inscripcion),
    progresos: [
      // Completa el curso en el primer intento.
      progreso(1, 11, { completada: true }),
      progreso(1, 12, { completada: true }),
      progreso(1, 13, { intentos: 1, mejorNota: 80 }),
      // Completa el curso en el segundo intento.
      progreso(2, 11, { completada: true }),
      progreso(2, 12, { completada: true }),
      progreso(2, 13, { intentos: 2, mejorNota: 70 }),
      // Se detiene en el cuestionario tras agotar sus intentos.
      progreso(3, 11, { completada: true }),
      progreso(3, 12, { completada: true }),
      progreso(3, 13, { intentos: 3, mejorNota: 50 }),
      // Se detiene en la segunda lección.
      progreso(4, 11, { completada: true }),
      // La inscripción 5 nunca registra actividad.
      progreso(6, 11, { completada: true }),
      progreso(6, 12, { completada: true }),
      progreso(6, 13, { intentos: 2, mejorNota: 40 }),
    ],
  });

  const resultado = await obtenerAnaliticasCurso(9, 1);

  assert.equal(consultas.consultaCurso(), 1);
  assert.equal(consultas.consultaLecciones().where.cursoId, 1);
  assert.equal(consultas.consultaInscripciones().where.cursoId, 1);
  assert.deepEqual(consultas.consultaProgresos().attributes, [
    'inscripcionId',
    'leccionId',
    'completada',
    'mejorNota',
    'intentos',
  ]);

  assert.deepEqual(resultado.curso, {
    id: 1,
    titulo: 'React',
    estado: 'publicado',
    totalLecciones: 3,
    totalInscritos: 6,
    progresoPromedio: 61.1,
    notaPromedio: 60,
    estudiantesCompletados: 2,
    tasaCompletado: 33.3,
    leccionMayorDesercion: {
      leccionId: 13,
      titulo: 'Lección 3',
      orden: 3,
      estudiantesDetenidos: 2,
    },
  });

  assert.deepEqual(resultado.embudo, [
    {
      id: 11,
      titulo: 'Lección 1',
      tipo: 'contenido',
      orden: 1,
      estudiantesAprobados: 5,
      porcentajeAprobados: 83.3,
      estudiantesDetenidos: 0,
    },
    {
      id: 12,
      titulo: 'Lección 2',
      tipo: 'contenido',
      orden: 2,
      estudiantesAprobados: 4,
      porcentajeAprobados: 66.7,
      estudiantesDetenidos: 1,
    },
    {
      id: 13,
      titulo: 'Lección 3',
      tipo: 'cuestionario',
      orden: 3,
      estudiantesAprobados: 2,
      porcentajeAprobados: 33.3,
      estudiantesDetenidos: 2,
    },
  ]);

  assert.deepEqual(resultado.distribucionProgreso, [
    { rango: '0% - 25%', etiqueta: 'Iniciando', estudiantes: 1, porcentaje: 16.7 },
    { rango: '26% - 50%', etiqueta: 'Básico', estudiantes: 1, porcentaje: 16.7 },
    {
      rango: '51% - 75%',
      etiqueta: 'Intermedio avanzado',
      estudiantes: 2,
      porcentaje: 33.3,
    },
    {
      rango: '76% - 100%',
      etiqueta: 'Completado o evaluando',
      estudiantes: 2,
      porcentaje: 33.3,
    },
  ]);

  assert.deepEqual(resultado.cuestionario, {
    leccionId: 13,
    titulo: 'Lección 3',
    orden: 3,
    notaMinima: 70,
    totalAprobados: 2,
    intentos: [
      { intento: 1, estudiantes: 1, notaPromedio: 80 },
      { intento: 2, estudiantes: 1, notaPromedio: 70 },
      { intento: 3, estudiantes: 0, notaPromedio: null },
    ],
  });
});

test('un curso sin inscripciones no inventa porcentajes ni notas', async (t) => {
  crearDatos(t, {
    curso: { id: 2, titulo: 'Sin estudiantes', estado: 'borrador', instructorId: 9 },
    lecciones: [leccion(21, 1), leccion(22, 2, 'cuestionario', 60)],
    inscripciones: [],
    progresos: [],
  });

  const resultado = await obtenerAnaliticasCurso(9, 2);

  assert.deepEqual(resultado.curso, {
    id: 2,
    titulo: 'Sin estudiantes',
    estado: 'borrador',
    totalLecciones: 2,
    totalInscritos: 0,
    progresoPromedio: null,
    notaPromedio: null,
    estudiantesCompletados: 0,
    tasaCompletado: null,
    leccionMayorDesercion: null,
  });
  assert.deepEqual(resultado.embudo[0], {
    id: 21,
    titulo: 'Lección 1',
    tipo: 'contenido',
    orden: 1,
    estudiantesAprobados: 0,
    porcentajeAprobados: null,
    estudiantesDetenidos: 0,
  });
  assert.equal(resultado.distribucionProgreso[0].porcentaje, null);
  assert.deepEqual(resultado.cuestionario.intentos, [
    { intento: 1, estudiantes: 0, notaPromedio: null },
    { intento: 2, estudiantes: 0, notaPromedio: null },
    { intento: 3, estudiantes: 0, notaPromedio: null },
  ]);
});

test('aprobar la última lección cuenta como curso completado', async (t) => {
  crearDatos(t, {
    curso: { id: 7, titulo: 'Inglés técnico', estado: 'publicado', instructorId: 9 },
    lecciones: [
      leccion(71, 1),
      leccion(72, 2),
      leccion(73, 3, 'cuestionario', 60),
    ],
    inscripciones: [inscripcion(71)],
    // El estudiante aprobó el cuestionario final; el desbloqueo secuencial
    // garantiza que completó las lecciones anteriores.
    progresos: [progreso(71, 73, { intentos: 1, mejorNota: 80 })],
  });

  const resultado = await obtenerAnaliticasCurso(9, 7);

  assert.equal(resultado.curso.estudiantesCompletados, 1);
  assert.equal(resultado.curso.tasaCompletado, 100);
  assert.equal(resultado.curso.leccionMayorDesercion, null);
  assert.equal(resultado.cuestionario.totalAprobados, 1);
});

test('un curso sin cuestionarios devuelve el desempeño vacío', async (t) => {
  crearDatos(t, {
    curso: { id: 3, titulo: 'Solo contenido', estado: 'publicado', instructorId: 9 },
    lecciones: [leccion(31, 1)],
    inscripciones: [inscripcion(31)],
    progresos: [progreso(31, 31, { completada: true })],
  });

  const resultado = await obtenerAnaliticasCurso(9, 3);

  assert.equal(resultado.cuestionario, null);
  assert.equal(resultado.curso.estudiantesCompletados, 1);
  assert.equal(resultado.curso.tasaCompletado, 100);
});

test('un instructor no puede leer las analíticas de un curso ajeno', async (t) => {
  crearDatos(t, {
    curso: { id: 4, titulo: 'Ajeno', estado: 'publicado', instructorId: 7 },
  });

  await assert.rejects(() => obtenerAnaliticasCurso(9, 4), {
    statusCode: 403,
    code: 'CURSO_NO_PROPIO',
  });
});

test('la ruta de analíticas exige un instructor autenticado', async (t) => {
  const baseUrl = await iniciarServidor(t);

  const response = await fetch(`${baseUrl}/api/cursos/mios/1/analiticas`);

  assert.equal(response.status, 401);
  assert.equal((await response.json()).error.code, 'NO_AUTENTICADO');
});

test('la ruta de analíticas rechaza a un estudiante', async (t) => {
  const baseUrl = await iniciarServidor(t);
  t.mock.method(Usuario, 'findByPk', async () => ({ id: 3, rol: 'estudiante' }));
  const token = signAccessToken({ id: 3, rol: 'estudiante' });

  const response = await fetch(`${baseUrl}/api/cursos/mios/1/analiticas`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  assert.equal(response.status, 403);
  assert.equal((await response.json()).error.code, 'SIN_PERMISO');
});

test('la ruta de analíticas devuelve el detalle del curso propio', async (t) => {
  const baseUrl = await iniciarServidor(t);
  t.mock.method(Usuario, 'findByPk', async () => ({ id: 9, rol: 'instructor' }));
  crearDatos(t, {
    curso: { id: 1, titulo: 'React', estado: 'publicado', instructorId: 9 },
    lecciones: [leccion(11, 1)],
    inscripciones: [inscripcion(11)],
    progresos: [progreso(11, 11, { completada: true })],
  });
  const token = signAccessToken({ id: 9, rol: 'instructor' });

  const response = await fetch(`${baseUrl}/api/cursos/mios/1/analiticas`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.analiticas.curso.titulo, 'React');
  assert.equal(body.analiticas.embudo[0].estudiantesAprobados, 1);
});
