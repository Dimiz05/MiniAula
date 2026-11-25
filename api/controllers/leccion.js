import {
  actualizarCuestionarioPropia,
  actualizarLeccionPropia,
  crearLeccionPropia,
  eliminarLeccionPropia,
  obtenerCuestionarioEstudiante,
  obtenerLeccionEstudiante,
  reordenarLeccionesPropias,
} from '../services/leccion.service.js';

export async function obtener(request, response) {
  const leccion = await obtenerLeccionEstudiante(
    request.usuario.id,
    request.validated.params.id,
  );
  response.status(200).json({ leccion });
}

export async function obtenerCuestionario(request, response) {
  const cuestionario = await obtenerCuestionarioEstudiante(
    request.usuario.id,
    request.validated.params.id,
  );
  response.status(200).json(cuestionario);
}

export async function crear(request, response) {
  const leccion = await crearLeccionPropia(
    request.usuario.id,
    request.validated.params.id,
    request.validated.body,
  );
  response.status(201).json({ leccion });
}

export async function actualizar(request, response) {
  const leccion = await actualizarLeccionPropia(
    request.usuario.id,
    request.validated.params.id,
    request.validated.body,
  );
  response.status(200).json({ leccion });
}

export async function actualizarCuestionario(request, response) {
  const leccion = await actualizarCuestionarioPropia(
    request.usuario.id,
    request.validated.params.id,
    request.validated.body,
  );
  response.status(200).json({ leccion });
}

export async function eliminar(request, response) {
  await eliminarLeccionPropia(
    request.usuario.id,
    request.validated.params.id,
  );
  response.status(204).end();
}

export async function reordenar(request, response) {
  const lecciones = await reordenarLeccionesPropias(
    request.usuario.id,
    request.validated.params.id,
    request.validated.body.orden,
  );
  response.status(200).json({ lecciones });
}
