import {
  eliminarPortadaPropia,
  guardarPortadaPropia,
} from '../services/portada.service.js';

export async function subir(request, response) {
  const curso = await guardarPortadaPropia(
    request.usuario.id,
    request.validated.params.id,
    request.body,
  );
  response.status(200).json({ curso });
}

export async function eliminar(request, response) {
  const curso = await eliminarPortadaPropia(
    request.usuario.id,
    request.validated.params.id,
  );
  response.status(200).json({ curso });
}
