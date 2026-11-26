import Alert from '../../components/Alert.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import StudentsList from './StudentsList.jsx';
import {
  anchoBarra,
  describirMayorDesercion,
  etiquetasIntento,
  tarjetasAnaliticas,
} from './analytics.js';
import { formatearNota, formatearPorcentaje } from './panelMetrics.js';

const coloresDistribucion = [
  'bg-secondary',
  'bg-secondary',
  'bg-primary',
  'bg-success',
];

export function ResumenAnaliticas({ curso }) {
  return (
    <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Resumen del curso">
      {tarjetasAnaliticas(curso).map((tarjeta) => (
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
            {tarjeta.hint}
          </span>
        </article>
      ))}
    </section>
  );
}

export function EmbudoRetencion({ curso, embudo = [] }) {
  const aviso = describirMayorDesercion(curso.leccionMayorDesercion);

  return (
    <section className="space-y-6 rounded-panel border border-outline bg-surface p-6 shadow-card md:p-8">
      <div className="flex flex-col justify-between gap-3 border-b border-outline pb-4 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-headline-sm text-secondary">
            Embudo de retención y avance por lección
          </h2>
          <p className="text-body-sm text-on-surface-variant">
            Estudiantes que alcanzan y completan cada lección secuencial del curso.
          </p>
        </div>
        {aviso && (
          <div className="inline-flex items-start gap-2 rounded-control border border-error/30 bg-error-light px-3 py-1.5 text-label-sm font-semibold text-secondary">
            <Icon name="warning" className="mt-0.5 text-[18px] text-error" />
            <span>Mayor deserción detectada: {aviso}</span>
          </div>
        )}
      </div>

      {embudo.length === 0 ? (
        <p className="rounded-control border border-dashed border-outline p-5 text-center text-body-md text-on-surface-variant">
          Agrega lecciones al curso para ver su embudo de retención.
        </p>
      ) : (
        <ol className="space-y-4">
          {embudo.map((leccion, indice) => {
            const destacada = Number(curso.leccionMayorDesercion?.leccionId)
              === Number(leccion.id)
              && Number(leccion.estudiantesDetenidos) > 0;
            const esUltima = indice === embudo.length - 1;
            const color = destacada
              ? 'bg-error'
              : esUltima
                ? 'bg-success'
                : 'bg-primary';
            const tipo = leccion.tipo === 'cuestionario' ? 'Cuestionario' : 'Contenido';

            return (
              <li
                key={leccion.id}
                className={destacada
                  ? 'rounded-control border border-error/40 bg-error-light/40 p-3'
                  : ''}
              >
                <div className="mb-1 flex flex-col justify-between gap-1 text-label-sm sm:flex-row sm:items-center">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-secondary">
                      {leccion.orden}. {leccion.titulo}
                    </span>
                    <span className="text-on-surface-variant">({tipo})</span>
                    {destacada && (
                      <span className="rounded-full bg-error px-2 py-0.5 text-[10px] font-bold text-on-error">
                        Mayor detención
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 font-bold tabular-nums text-secondary">
                    {leccion.estudiantesAprobados} estudiantes (
                    {formatearPorcentaje(leccion.porcentajeAprobados)})
                  </span>
                </div>
                <div
                  className="h-4 w-full overflow-hidden rounded-full bg-surface-variant"
                  role="progressbar"
                  aria-label={`${leccion.titulo}: ${formatearPorcentaje(leccion.porcentajeAprobados)} de estudiantes aprobados`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={leccion.porcentajeAprobados ?? 0}
                >
                  <div
                    className={`flex h-4 items-center justify-end rounded-full pr-2 text-[10px] font-bold text-white ${color}`}
                    style={{ width: anchoBarra(leccion.porcentajeAprobados) }}
                  >
                    {leccion.estudiantesAprobados > 0 && leccion.estudiantesAprobados}
                  </div>
                </div>
                {destacada && (
                  <p className="mt-2 text-label-sm text-on-surface-variant">
                    <strong>Recomendación pedagógica:</strong>{' '}
                    {leccion.estudiantesDetenidos === 1
                      ? '1 estudiante no avanzó'
                      : `${leccion.estudiantesDetenidos} estudiantes no avanzaron`}{' '}
                    desde esta lección. Refuerza el contenido con un ejemplo práctico
                    o material de apoyo descargable.
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

export function DistribucionProgreso({ distribucion = [] }) {
  return (
    <section className="space-y-4 rounded-panel border border-outline bg-surface p-6 shadow-card">
      <div>
        <h3 className="text-headline-sm text-secondary">
          Distribución de progreso de estudiantes
        </h3>
        <p className="text-body-sm text-on-surface-variant">
          Porcentaje de avance sobre el total de inscritos.
        </p>
      </div>

      <div className="space-y-3 pt-2">
        {distribucion.map((tramo, indice) => (
          <div key={tramo.rango}>
            <div className="mb-1 flex justify-between gap-2 text-label-sm">
              <span className="text-secondary">
                {tramo.rango} ({tramo.etiqueta})
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-secondary">
                {tramo.estudiantes} estudiantes ({formatearPorcentaje(tramo.porcentaje)})
              </span>
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-surface-variant"
              role="progressbar"
              aria-label={`${tramo.rango}: ${formatearPorcentaje(tramo.porcentaje)}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={tramo.porcentaje ?? 0}
            >
              <div
                className={`h-2 rounded-full ${coloresDistribucion[indice] ?? 'bg-secondary'}`}
                style={{ width: anchoBarra(tramo.porcentaje) }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function EstudiantesInscritos({
  estudiantes = [],
  loading = false,
  error = null,
  onRetry,
}) {
  return (
    <section className="rounded-panel border border-outline bg-surface p-6 shadow-card">
      <div className="flex flex-col justify-between gap-2 border-b border-outline pb-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-headline-sm text-secondary">Estudiantes inscritos</h2>
          <p className="text-body-sm text-on-surface-variant">
            Nombres de quienes están inscritos en este curso.
          </p>
        </div>
        {!loading && !error && (
          <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-success-light px-3 py-1 text-label-sm font-semibold text-success">
            <Icon name="group" className="text-[16px]" />
            {estudiantes.length === 1
              ? '1 estudiante'
              : `${estudiantes.length} estudiantes`}
          </span>
        )}
      </div>

      {loading && (
        <p role="status" className="pt-4 text-body-md text-on-surface-variant">
          Cargando estudiantes…
        </p>
      )}

      {error && (
        <Alert variant="error" title="No se pudieron cargar los estudiantes">
          <p>{error.message}</p>
          {onRetry && (
            <Button variant="secondary" className="mt-2" onClick={onRetry}>
              Reintentar
            </Button>
          )}
        </Alert>
      )}

      {!loading && !error && estudiantes.length === 0 && (
        <p className="pt-4 text-body-md text-on-surface-variant">
          Aún no hay estudiantes inscritos. Comparte el curso publicado para que
          aparezcan aquí.
        </p>
      )}

      {!loading && !error && estudiantes.length > 0 && (
        <div className="max-h-96 overflow-y-auto pt-4 pr-1">
          <StudentsList estudiantes={estudiantes} />
        </div>
      )}
    </section>
  );
}

export function DesempenoCuestionario({ cuestionario }) {
  return (
    <section className="space-y-4 rounded-panel border border-outline bg-surface p-6 shadow-card">
      <div>
        <h3 className="text-headline-sm text-secondary">Desempeño en cuestionario</h3>
        <p className="text-body-sm text-on-surface-variant">
          Distribución de intentos (máximo 3) y mejor nota obtenida.
        </p>
      </div>

      {!cuestionario ? (
        <p className="rounded-control border border-dashed border-outline p-5 text-center text-body-md text-on-surface-variant">
          Este curso todavía no tiene cuestionarios.
        </p>
      ) : (
        <>
          <p className="text-label-sm text-on-surface-variant">
            Lección {cuestionario.orden}: {cuestionario.titulo}
            {cuestionario.notaMinima !== null
              ? ` · Nota mínima ${cuestionario.notaMinima} pts`
              : ''}
          </p>
          <div className="space-y-3">
            {cuestionario.intentos.map((tramo) => (
              <div
                key={tramo.intento}
                className="flex items-center justify-between gap-3 rounded-control border border-outline bg-surface-variant/40 p-3"
              >
                <div>
                  <p className="text-label-md font-semibold text-secondary">
                    {etiquetasIntento[tramo.intento]}
                  </p>
                  <span className="text-label-sm text-on-surface-variant">
                    Promedio: {formatearNota(tramo.notaPromedio)}
                  </span>
                </div>
                <span className={`shrink-0 text-headline-sm font-bold tabular-nums ${
                  tramo.intento === 1 ? 'text-primary' : 'text-secondary'
                }`}>
                  {tramo.estudiantes} estudiantes
                </span>
              </div>
            ))}
          </div>
          <p className="text-label-sm text-on-surface-variant">
            {cuestionario.totalAprobados === 1
              ? '1 estudiante aprobó el cuestionario.'
              : `${cuestionario.totalAprobados} estudiantes aprobaron el cuestionario.`}
          </p>
        </>
      )}
    </section>
  );
}
