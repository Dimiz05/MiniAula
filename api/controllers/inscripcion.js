import {
  inscribirEstudiante,
  listarInscripcionesEstudiante,
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
