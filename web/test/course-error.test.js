import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  MENSAJE_CURSO_NO_DISPONIBLE,
  mensajeErrorCurso,
} from '../src/utils/courseError.js';

test('a missing or unpublished course explains that the instructor removed it', () => {
  assert.equal(MENSAJE_CURSO_NO_DISPONIBLE, 'El instructor eliminó el curso.');
  assert.equal(
    mensajeErrorCurso({
      code: 'CURSO_NO_ENCONTRADO',
      message: 'El curso no existe o no está publicado.',
    }),
    'El instructor eliminó el curso.',
  );
});

test('other course errors keep the message returned by the server', () => {
  assert.equal(
    mensajeErrorCurso({
      code: 'ERROR_DE_RED',
      message: 'No pudimos conectar con el servidor.',
    }),
    'No pudimos conectar con el servidor.',
  );
  assert.equal(mensajeErrorCurso(null), 'No pudimos cargar el curso.');
});
