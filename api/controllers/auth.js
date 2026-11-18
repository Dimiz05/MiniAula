import { iniciarSesion, registrarUsuario } from '../services/auth.service.js';

export async function register(request, response) {
  const resultado = await registrarUsuario(request.validated.body);
  response.status(201).json(resultado);
}

export async function login(request, response) {
  const resultado = await iniciarSesion(request.validated.body);
  response.status(200).json(resultado);
}
