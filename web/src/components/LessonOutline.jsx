import { Link } from 'react-router';
import Icon from './Icon.jsx';
import {
  ESTADOS_LECCION,
  normalizarEstadoLeccion,
  puedeAbrirLeccion,
  rutaLeccion,
} from '../utils/lessonState.js';

const estadosUi = {
  [ESTADOS_LECCION.COMPLETADA]: {
    label: 'Completada',
    icon: 'check_circle',
    texto: 'text-success',
    badge: 'bg-success-light text-success',
    numero: 'bg-success text-white',
  },
  [ESTADOS_LECCION.DISPONIBLE]: {
    label: 'Disponible',
    icon: 'lock_open',
    texto: 'text-primary',
    badge: 'bg-primary/10 text-primary',
    numero: 'bg-primary text-on-primary',
  },
  [ESTADOS_LECCION.BLOQUEADA]: {
    label: 'Bloqueada',
    icon: 'lock',
    texto: 'text-on-surface-variant',
    badge: 'bg-surface-variant text-on-surface-variant',
    numero: 'bg-surface-variant text-on-surface-variant',
  },
};

function tipoLabel(leccion) {
  return leccion.tipo === 'cuestionario'
    ? `Cuestionario · nota mínima ${leccion.notaMinima ?? 0}`
    : 'Lección de contenido';
}

export default function LessonOutline({
  lecciones = [],
  cursoId,
  leccionActualId = null,
  conEstados = false,
  className = '',
}) {
  return (
    <ol aria-label="Temario del curso" className={`space-y-2 ${className}`}>
      {lecciones.map((leccion, index) => {
        const numero = leccion.orden ?? index + 1;
        const esActual = leccionActualId !== null
          && String(leccion.id) === String(leccionActualId);
        const estado = conEstados
          ? normalizarEstadoLeccion(leccion.estado)
          : null;
        const ui = estado ? estadosUi[estado] : null;
        const abrible = conEstados && puedeAbrirLeccion(leccion);
        const descripcion = tipoLabel(leccion);

        const interior = (
          <>
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-label-sm font-bold ${
                ui ? ui.numero : index === 0 ? 'bg-primary/10 text-primary' : 'bg-surface-variant text-secondary'
              }`}
            >
              {numero}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-label-md font-semibold text-secondary">
                {leccion.titulo}
              </span>
              <span className="mt-0.5 flex items-center gap-1 text-label-sm text-on-surface-variant">
                <Icon
                  name={leccion.tipo === 'cuestionario' ? 'quiz' : 'article'}
                  className="text-[16px]"
                />
                {descripcion}
              </span>
            </span>

            <span
              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-label-sm font-semibold ${
                ui
                  ? ui.badge
                  : index === 0
                    ? 'bg-primary/10 text-primary'
                    : 'bg-surface-variant text-on-surface-variant'
              }`}
            >
              <Icon
                name={ui ? ui.icon : index === 0 ? 'lock_open' : 'lock'}
                className="text-[16px]"
              />
              {ui
                ? ui.label
                : index === 0
                  ? 'Disponible al inscribirte'
                  : 'Se desbloquea al avanzar'}
            </span>
          </>
        );

        const clases = `flex flex-wrap items-center justify-between gap-3 rounded-control border p-4 transition-colors ${
          esActual
            ? 'border-primary bg-primary/5'
            : 'border-outline bg-surface'
        }`;

        return (
          <li key={leccion.id}>
            {abrible ? (
              <Link
                to={rutaLeccion(cursoId, leccion.id)}
                aria-current={esActual ? 'page' : undefined}
                className={`${clases} hover:border-primary/60 hover:bg-surface-variant/50`}
              >
                {interior}
              </Link>
            ) : (
              <div
                aria-disabled={conEstados ? 'true' : undefined}
                className={clases}
              >
                {interior}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
