import {
  inscribirEstudiante,
  listarInscripcionesEstudiante,
  obtenerTemarioEstudiante,
} from '../services/inscripcion.service.js';

export async function inscribir(request, response) {
  const inscripcion = await inscribirEstudiante(
    request.usuario.id,
    request.validated.params.id,
  );
  response.status(201).json({ inscripcion });
}

export async function listarMias(request, response) {
  const inscripciones = await listarInscripcionesEstudiante(request.usuario.id);
  response.status(200).json({ inscripciones });
}

export async function obtenerTemario(request, response) {
  const resultado = await obtenerTemarioEstudiante(
    request.usuario.id,
    request.validated.params.id,
  );
  response.status(200).json(resultado);
}

// Alias del contrato del proyecto: mismo avance y temario que /temario.
export async function obtenerProgreso(request, response) {
  const resultado = await obtenerTemarioEstudiante(
    request.usuario.id,
    request.validated.params.id,
  );
  response.status(200).json(resultado);
}
