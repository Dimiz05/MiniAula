import Icon from './Icon.jsx';

const CENTRO = 32;
const RADIO = 26;

export function normalizarProgresoCurso({
  porcentaje,
  leccionesCompletadas,
  totalLecciones,
} = {}) {
  const valor = Number(porcentaje);
  const completadas = Number(leccionesCompletadas);
  const total = Number(totalLecciones);

  if (
    !Number.isFinite(valor)
    || !Number.isFinite(completadas)
    || !Number.isFinite(total)
    || total < 0
  ) {
    return null;
  }

  return {
    porcentaje: Math.min(100, Math.max(0, Math.round(valor))),
    leccionesCompletadas: Math.max(0, Math.floor(completadas)),
    totalLecciones: Math.floor(total),
  };
}

export default function CourseProgressRing({
  porcentaje,
  leccionesCompletadas,
  totalLecciones,
  titulo = 'este curso',
}) {
  const progreso = normalizarProgresoCurso({
    porcentaje,
    leccionesCompletadas,
    totalLecciones,
  });

  if (!progreso) {
    return (
      <div className="mb-4 flex min-h-16 items-center gap-3 rounded-control border border-dashed border-outline bg-surface px-3 py-2">
        <Icon name="info" className="text-[20px] text-on-surface-variant" />
        <p className="text-body-sm text-on-surface-variant">
          Progreso no disponible
        </p>
      </div>
    );
  }

  const {
    porcentaje: valor,
    leccionesCompletadas: completadas,
    totalLecciones: total,
  } = progreso;
  const sinLecciones = total === 0;
  const completado = valor >= 100;
  const textoLecciones = sinLecciones
    ? 'Curso sin lecciones'
    : `${completadas} de ${total} lecciones completadas`;
  const textoAccesible = sinLecciones
    ? 'Curso sin lecciones'
    : `${valor}% completado, ${completadas} de ${total} lecciones completadas`;

  return (
    <div
      role="progressbar"
      aria-label={`Avance de ${titulo}`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={valor}
      aria-valuetext={textoAccesible}
      className="mb-4 flex items-center gap-3"
    >
      <div
        aria-hidden="true"
        className="relative h-16 w-16 shrink-0"
      >
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 64 64"
          className="h-16 w-16"
        >
          <g transform={`rotate(-90 ${CENTRO} ${CENTRO})`}>
            <circle
              cx={CENTRO}
              cy={CENTRO}
              r={RADIO}
              fill="none"
              strokeWidth="6"
              className="stroke-outline"
            />
            <circle
              cx={CENTRO}
              cy={CENTRO}
              r={RADIO}
              fill="none"
              pathLength="100"
              strokeWidth="6"
              strokeLinecap={valor > 0 ? 'round' : 'butt'}
              strokeDasharray="100"
              style={{
                strokeDashoffset: 100 - valor,
                opacity: valor === 0 ? 0 : 1,
              }}
              className={`course-progress-ring-arc transition-[stroke-dashoffset] duration-[240ms] ease-out motion-reduce:transition-none ${
                completado ? 'stroke-success' : 'stroke-primary'
              }`}
            />
          </g>
        </svg>
        <span
          className={`absolute inset-0 flex items-center justify-center text-body-md font-semibold leading-none tabular-nums ${
            completado ? 'text-success' : 'text-primary'
          }`}
        >
          {valor}%
        </span>
      </div>

      <p
        aria-hidden="true"
        className="min-w-0 break-words text-body-sm leading-tight text-secondary"
      >
        {textoLecciones}
      </p>
    </div>
  );
}
