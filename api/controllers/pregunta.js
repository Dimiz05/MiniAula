import {
  actualizarPreguntaPropia,
  crearPreguntaPropia,
  eliminarPreguntaPropia,
} from '../services/pregunta.service.js';

export async function crear(request, response) {
  const pregunta = await crearPreguntaPropia(
    request.usuario.id,
    request.validated.params.id,
    request.validated.body,
  );
  response.status(201).json({ pregunta });
}

export async function actualizar(request, response) {
  const pregunta = await actualizarPreguntaPropia(
    request.usuario.id,
    request.validated.params.id,
    request.validated.body,
  );
  response.status(200).json({ pregunta });
}

export async function eliminar(request, response) {
  await eliminarPreguntaPropia(
    request.usuario.id,
    request.validated.params.id,
  );
  response.status(204).end();
}
