import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Curso, Inscripcion, Leccion, Pregunta, Progreso } from '../models/index.js';

async function rechaza(modelo, datos, mensajeEsperado) {
  await assert.rejects(
    () => modelo.build(datos).validate(),
    (error) => {
      const mensajes = error.errors.map((item) => item.message).join(' | ');
      return mensajes.includes(mensajeEsperado);
    },
  );
}

test('a content lesson requires content', async () => {
  await rechaza(
    Leccion,
    { cursoId: 1, orden: 1, titulo: 'Lección', tipo: 'contenido' },
    'Una lección de contenido requiere el campo contenido.',
  );
});

test('a quiz requires the passing grade', async () => {
  await rechaza(
    Leccion,
    { cursoId: 1, orden: 1, titulo: 'Quiz', tipo: 'cuestionario', notaMinima: null },
    'Un cuestionario requiere la nota mínima de aprobación.',
  );
});

test('a valid quiz passes validation', async () => {
  const leccion = Leccion.build({
    cursoId: 1,
    orden: 1,
    titulo: 'Quiz',
    tipo: 'cuestionario',
    notaMinima: 70,
  });

  await leccion.validate();
  assert.equal(leccion.tipo, 'cuestionario');
});

test('a question requires at least two options', async () => {
  await rechaza(
    Pregunta,
    { leccionId: 1, enunciado: 'Pregunta', opciones: ['única'], indiceCorrecto: 0 },
    'La pregunta requiere al menos dos opciones.',
  );
});

test('the correct answer index must point to an existing option', async () => {
  await rechaza(
    Pregunta,
    { leccionId: 1, enunciado: 'Pregunta', opciones: ['a', 'b'], indiceCorrecto: 5 },
    'El índice de la respuesta correcta debe apuntar a una opción existente.',
  );
});

test('progress rejects more than three attempts', async () => {
  await rechaza(
    Progreso,
    { inscripcionId: 1, leccionId: 1, intentos: 4 },
    'Validation max on intentos failed',
  );
});

test('progress rejects a score above 100', async () => {
  await rechaza(
    Progreso,
    { inscripcionId: 1, leccionId: 1, mejorNota: 120 },
    'Validation max on mejorNota failed',
  );
});

test('a new course starts as a draft', async () => {
  const curso = Curso.build({ titulo: 'Curso', descripcion: 'Descripción', categoria: 'Diseño', instructorId: 1 });

  assert.equal(curso.estado, 'borrador');
  assert.equal(curso.nivel, 'basico');
});

test('models expose the relations the API needs', () => {
  assert.equal(Curso.associations.instructor.target.name, 'Usuario');
  assert.equal(Curso.associations.lecciones.target.name, 'Leccion');
  assert.equal(Leccion.associations.preguntas.target.name, 'Pregunta');
  assert.equal(Inscripcion.associations.estudiante.target.name, 'Usuario');
  assert.equal(Progreso.associations.inscripcion.target.name, 'Inscripcion');
});
