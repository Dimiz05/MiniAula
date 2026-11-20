import { listarCursosPublicados, obtenerCursoPublicado } from '../services/curso.service.js';
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
