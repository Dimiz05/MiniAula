import { actualizarPerfil, toPublicUsuario } from '../services/usuario.service.js';

export function getMe(request, response) {
  response.status(200).json({ usuario: toPublicUsuario(request.usuario) });
}

export async function updateMe(request, response) {
  const usuario = await actualizarPerfil(request.usuario, request.validated.body);
  response.status(200).json({ usuario });
}
