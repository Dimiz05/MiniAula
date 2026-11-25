import { registrarIntento } from '../services/intento.service.js';

export async function registrar(request, response) {
  const intento = await registrarIntento(
    request.usuario.id,
    request.validated.params.id,
    request.validated.body.respuestas,
  );

  response.status(200).json({ intento });
}
