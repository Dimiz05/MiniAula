import {
  actualizarCursoPropio,
  archivarCursoPropio,
  crearCurso,
  eliminarCursoPropio,
  listarCursosPropios,
  listarCursosPublicados,
  obtenerCursoPropio,
  obtenerCursoPublicado,
  publicarCursoPropio,
} from '../services/curso.service.js';
import { listarLeccionesPropias } from '../services/leccion.service.js';
import { obtenerMetricasCursos } from '../services/metrica.service.js';
import { AppError } from '../utils/errors.js';

export async function listar(request, response) {
  const resultado = await listarCursosPublicados(request.validated.query);
  response.status(200).json(resultado);
}

export async function detalle(request, response) {
  const resultado = await obtenerCursoPublicado(request.validated.params.id);

  if (!resultado) {
    throw new AppError(
      404,
      'CURSO_NO_ENCONTRADO',
      'El curso no existe o no está publicado.',
    );
  }

  response.status(200).json(resultado);
}

export async function misCursos(request, response) {
  const cursos = await listarCursosPropios(request.usuario.id);
  response.status(200).json({ cursos });
}

export async function metricas(request, response) {
  const resultado = await obtenerMetricasCursos(request.usuario.id);
  response.status(200).json(resultado);
}

export async function detallePropio(request, response) {
  const curso = await obtenerCursoPropio(
    request.usuario.id,
    request.validated.params.id,
  );
  const lecciones = await listarLeccionesPropias(
    request.usuario.id,
    request.validated.params.id,
  );
  response.status(200).json({ curso, lecciones });
}

export async function crear(request, response) {
  const curso = await crearCurso(request.usuario.id, request.validated.body);
  response.status(201).json({ curso });
}

export async function actualizar(request, response) {
  const curso = await actualizarCursoPropio(
    request.usuario.id,
    request.validated.params.id,
    request.validated.body,
  );
  response.status(200).json({ curso });
}

export async function publicar(request, response) {
  const curso = await publicarCursoPropio(
    request.usuario.id,
    request.validated.params.id,
  );
  response.status(200).json({ curso });
}

export async function archivar(request, response) {
  const curso = await archivarCursoPropio(
    request.usuario.id,
    request.validated.params.id,
  );
  response.status(200).json({ curso });
}

export async function eliminar(request, response) {
  await eliminarCursoPropio(
    request.usuario.id,
    request.validated.params.id,
  );
  response.status(204).end();
}
