import Icon from '../../components/Icon.jsx';
import {
  describirDesercion,
  formatearEntero,
  formatearNota,
  formatearPorcentaje,
} from './panelMetrics.js';

const tarjetasResumen = (resumen) => [
  {
    label: 'Total de cursos',
    icon: 'auto_stories',
    tone: 'text-primary',
    value: formatearEntero(resumen.totalCursos),
    hint: 'En cualquier estado',
  },
  {
    label: 'Estudiantes inscritos',
    icon: 'group',
    tone: 'text-secondary',
    value: formatearEntero(resumen.totalInscritos),
    hint: 'En todos tus cursos',
  },
  {
    label: 'Progreso promedio',
    icon: 'trending_up',
    tone: 'text-warning',
    value: formatearPorcentaje(resumen.progresoPromedio),
    hint: 'Avance de tus estudiantes',
  },
  {
    label: 'Nota promedio',
    icon: 'grade',
    tone: 'text-success',
    value: formatearNota(resumen.notaPromedio),
    hint: 'Mejores notas de cuestionarios',
  },
];

export function ResumenMetricas({ resumen, publicados = 0, borradores = 0 }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {tarjetasResumen(resumen).map((tarjeta) => (
        <article
          key={tarjeta.label}
          className="rounded-card border border-outline bg-surface p-5 shadow-card"
        >
          <div className="mb-2 flex items-center justify-between gap-2 text-on-surface-variant">
            <span className="text-label-sm">{tarjeta.label}</span>
            <Icon name={tarjeta.icon} className={`text-[22px] ${tarjeta.tone}`} />
          </div>
          <p className="break-words text-headline-md tabular-nums text-secondary">
            {tarjeta.value}
          </p>
          <span className="text-label-sm text-on-surface-variant">
            {tarjeta.label === 'Total de cursos' && (publicados > 0 || borradores > 0)
              ? `${publicados} publicados · ${borradores} borradores`
              : tarjeta.hint}
          </span>
        </article>
      ))}
    </div>
  );
}

export function MetricasCurso({ metrica, cargando = false, inscritos }) {
  if (cargando && !metrica) {
    return (
      <p role="status" className="my-3 text-label-sm text-on-surface-variant">
        Cargando métricas…
      </p>
    );
  }

  const datos = [
    {
      label: 'Inscritos',
      value: formatearEntero(metrica?.totalInscritos ?? inscritos),
      icon: 'group',
    },
    {
      label: 'Progreso promedio',
      value: formatearPorcentaje(metrica?.progresoPromedio),
      icon: 'trending_up',
    },
    {
      label: 'Nota promedio',
      value: formatearNota(metrica?.notaPromedio),
      icon: 'grade',
    },
    {
      label: 'Mayor deserción',
      value: describirDesercion(metrica?.leccionMayorDesercion),
      icon: 'person_remove',
    },
  ];

  return (
    <div className="my-3 rounded-control border border-outline-light bg-surface-variant/50 p-3">
      <p className="mb-2 text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant">
        Métricas del curso
      </p>
      <dl className="grid grid-cols-2 gap-3">
        {datos.map((dato) => (
          <div key={dato.label} className="min-w-0">
            <dt className="flex items-center gap-1 text-label-sm text-on-surface-variant">
              <Icon name={dato.icon} className="shrink-0 text-[16px]" />
              {dato.label}
            </dt>
            <dd className="mt-0.5 break-words text-label-md font-semibold tabular-nums text-secondary">
              {dato.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
