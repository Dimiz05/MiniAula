import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calcularResumenAprendizaje } from '../src/pages/student/dashboardStats.js';

const resumenVacio = {
  inscritos: 0,
  completados: 0,
  activos: 0,
  leccionesCompletadas: 0,
  totalLecciones: 0,
};

test('resume cursos inscritos, completados y lecciones', () => {
  const resumen = calcularResumenAprendizaje([
    { porcentajeAvance: 100, leccionesCompletadas: 5, totalLecciones: 5 },
    { porcentajeAvance: 40, leccionesCompletadas: 2, totalLecciones: 5 },
    { porcentajeAvance: 0 },
  ]);

  assert.deepEqual(resumen, {
    inscritos: 3,
    completados: 1,
    activos: 2,
    leccionesCompletadas: 7,
    totalLecciones: 10,
  });
});

test('devuelve ceros sin inscripciones o con datos inválidos', () => {
  assert.deepEqual(calcularResumenAprendizaje([]), resumenVacio);
  assert.deepEqual(calcularResumenAprendizaje(null), resumenVacio);
  assert.deepEqual(calcularResumenAprendizaje('no-es-lista'), resumenVacio);
});

test('redondea el avance y descarta conteos inválidos', () => {
  const resumen = calcularResumenAprendizaje([
    { porcentajeAvance: 99.6, leccionesCompletadas: '3', totalLecciones: '8' },
    { porcentajeAvance: 'sin dato', leccionesCompletadas: -2, totalLecciones: null },
  ]);

  assert.equal(resumen.inscritos, 2);
  assert.equal(resumen.completados, 1);
  assert.equal(resumen.activos, 1);
  assert.equal(resumen.leccionesCompletadas, 3);
  assert.equal(resumen.totalLecciones, 8);
});
