import { getInitials } from '../../utils/initials.js';

export function formatearFechaInscripcion(valor) {
  const fecha = new Date(valor);

  if (!valor || Number.isNaN(fecha.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat('es', { dateStyle: 'medium' }).format(fecha);
}

export default function StudentsList({ estudiantes = [] }) {
  return (
    <ul className="divide-y divide-outline-light">
      {estudiantes.map((estudiante) => {
        const fecha = formatearFechaInscripcion(estudiante.fechaInscripcion);

        return (
          <li
            key={estudiante.id}
            className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-on-primary">
              {getInitials(estudiante.nombre)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-label-lg font-semibold text-secondary">
                {estudiante.nombre ?? 'Estudiante'}
              </p>
              <p className="truncate text-body-sm text-on-surface-variant">
                {estudiante.email ?? 'Sin correo registrado'}
              </p>
              <p className="mt-0.5 text-label-sm text-on-surface-variant">
                {fecha ? `Inscrito: ${fecha}` : 'Fecha de inscripción sin datos'}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
