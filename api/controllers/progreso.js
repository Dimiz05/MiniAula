import { marcarLeccionContenidoCompletada } from '../services/progreso.service.js';

export async function completar(request, response) {
  const progreso = await marcarLeccionContenidoCompletada(
    request.usuario.id,
    request.validated.params.id,
  );
  response.status(200).json({ progreso });
}
