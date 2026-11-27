import { porcentajeAvanceInscripcion } from '../../services/inscripcion.service.js';

function normalizarConteo(valor) {
  const numero = Number(valor);

  if (!Number.isFinite(numero) || numero <= 0) {
    return 0;
  }

  return Math.floor(numero);
}

export function calcularResumenAprendizaje(inscripciones = []) {
  const lista = Array.isArray(inscripciones) ? inscripciones : [];
  const inscritos = lista.length;
  const completados = lista.filter(
    (inscripcion) => porcentajeAvanceInscripcion(inscripcion) >= 100,
  ).length;

  const { leccionesCompletadas, totalLecciones } = lista.reduce(
    (acumulado, inscripcion) => ({
      leccionesCompletadas:
        acumulado.leccionesCompletadas
        + normalizarConteo(inscripcion?.leccionesCompletadas),
      totalLecciones:
        acumulado.totalLecciones + normalizarConteo(inscripcion?.totalLecciones),
    }),
    { leccionesCompletadas: 0, totalLecciones: 0 },
  );

  return {
    inscritos,
    completados,
    activos: inscritos - completados,
    leccionesCompletadas,
    totalLecciones,
  };
}
