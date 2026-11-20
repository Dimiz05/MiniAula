import { listarCursosPublicados } from '../services/curso.service.js';

export async function listar(request, response) {
  const resultado = await listarCursosPublicados(request.validated.query);
  response.status(200).json(resultado);
}
