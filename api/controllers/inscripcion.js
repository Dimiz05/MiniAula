import { inscribirEstudiante } from '../services/inscripcion.service.js';

export async function inscribir(request, response) {
  const inscripcion = await inscribirEstudiante(
    request.usuario.id,
    request.validated.params.id,
  );
  response.status(201).json({ inscripcion });
}
