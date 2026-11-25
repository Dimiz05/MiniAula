import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import Alert from '../../components/Alert.jsx';
import Button from '../../components/Button.jsx';
import CourseProgress from '../../components/CourseProgress.jsx';
import Icon from '../../components/Icon.jsx';
import LessonOutline from '../../components/LessonOutline.jsx';
import QuizAttempt from '../../components/QuizAttempt.jsx';
import {
  obtenerLeccion,
  obtenerTemarioEstudiante,
} from '../../services/leccion.service.js';
import {
  clasificarErrorLeccion,
  ESTADOS_LECCION,
  normalizarEstadoLeccion,
} from '../../utils/lessonState.js';

function tipoLabel(leccion) {
  return leccion.tipo === 'cuestionario'
    ? `Cuestionario · nota mínima ${leccion.notaMinima ?? 0}`
    : 'Lección de contenido';
}

export default function LessonPage() {
  const { cursoId, leccionId } = useParams();
  const [leccion, setLeccion] = useState(null);
  const [temarioData, setTemarioData] = useState(null);
  const [outlineError, setOutlineError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reintento, setReintento] = useState(0);

  const cargar = useCallback(() => {
    setReintento((valor) => valor + 1);
  }, []);

  const actualizarTemario = useCallback(() => {
    obtenerTemarioEstudiante(cursoId)
      .then((data) => {
        setTemarioData(data ?? null);
        setOutlineError(null);
      })
      .catch((error) => {
        setOutlineError(error);
      });
  }, [cursoId]);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(null);
    setOutlineError(null);
    setLeccion(null);
    setTemarioData(null);

    Promise.allSettled([
      obtenerLeccion(leccionId),
      obtenerTemarioEstudiante(cursoId),
    ]).then(([respuestaLecion, respuestaTemario]) => {
      if (!active) {
        return;
      }

      if (respuestaLecion.status === 'fulfilled') {
        setLeccion(respuestaLecion.value?.leccion ?? null);
      } else {
        setError(respuestaLecion.reason);
      }

      if (respuestaTemario.status === 'fulfilled') {
        setTemarioData(respuestaTemario.value ?? null);
      } else {
        setOutlineError(respuestaTemario.reason);
      }

      if (
        respuestaLecion.status === 'fulfilled'
        && !respuestaLecion.value?.leccion
      ) {
        setError(new Error('La respuesta del servidor no incluyó la lección.'));
      }
    }).finally(() => {
      if (active) {
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [cursoId, leccionId, reintento]);

  const temario = Array.isArray(temarioData?.temario) ? temarioData.temario : [];
  const cursoTitulo = temarioData?.curso?.titulo;
  const errorLeccion = error ? clasificarErrorLeccion(error) : null;
  const volverAlCurso = `/catalog/${encodeURIComponent(cursoId)}`;
  const estadoActual = leccion
    ? normalizarEstadoLeccion(
      temario.find((item) => String(item.id) === String(leccion.id))?.estado
      ?? ESTADOS_LECCION.DISPONIBLE,
    )
    : null;

  return (
    <div className="space-y-6">
      <Link
        to={volverAlCurso}
        className="inline-flex items-center gap-1.5 text-label-md text-secondary transition-colors hover:text-primary"
      >
        <Icon name="arrow_back" className="text-[20px]" />
        {cursoTitulo ? `Volver a ${cursoTitulo}` : 'Volver al curso'}
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <section className="space-y-6">
          {loading && (
            <div
              role="status"
              className="rounded-panel border border-outline bg-surface p-8 text-center shadow-card"
            >
              <p className="text-body-md text-on-surface-variant">
                Cargando la lección…
              </p>
            </div>
          )}

          {!loading && errorLeccion && (
            <Alert
              variant={
                errorLeccion.tipo === 'bloqueada'
                  ? 'warning'
                  : errorLeccion.tipo === 'error'
                    ? 'error'
                    : 'info'
              }
              title={errorLeccion.titulo}
            >
              <p>{errorLeccion.mensaje}</p>
              <p className="mt-2 text-label-sm">
                El contenido solo se muestra cuando el servidor confirma que la
                lección está desbloqueada para tu inscripción.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link to={volverAlCurso} className="inline-flex">
                  <Button variant="secondary" icon="arrow_back">
                    Volver al curso
                  </Button>
                </Link>
                {errorLeccion.tipo === 'error' && (
                  <Button onClick={cargar} icon="refresh">
                    Reintentar
                  </Button>
                )}
              </div>
            </Alert>
          )}

          {!loading && !errorLeccion && leccion && (
            <>
              <header className="rounded-panel border border-outline bg-surface p-6 shadow-card md:p-8">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-label-sm font-semibold uppercase tracking-[0.14em] text-primary">
                      Lección {leccion.orden}
                    </p>
                    <h1 className="mt-1 text-balance text-headline-lg-mobile leading-snug text-secondary sm:text-headline-lg">
                      {leccion.titulo}
                    </h1>
                    <p className="mt-2 flex items-center gap-1.5 text-body-sm text-on-surface-variant">
                      <Icon
                        name={leccion.tipo === 'cuestionario' ? 'quiz' : 'article'}
                        className="text-[18px]"
                      />
                      {tipoLabel(leccion)}
                    </p>
                  </div>

                  {estadoActual && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success-light px-3 py-1 text-label-sm font-semibold text-success">
                      <Icon
                        name={
                          estadoActual === ESTADOS_LECCION.COMPLETADA
                            ? 'check_circle'
                            : 'lock_open'
                        }
                        className="text-[16px]"
                      />
                      {estadoActual === ESTADOS_LECCION.COMPLETADA
                        ? 'Completada'
                        : 'Disponible'}
                    </span>
                  )}
                </div>
              </header>

              {leccion.tipo === 'cuestionario' ? (
                <QuizAttempt
                  leccion={leccion}
                  cursoId={cursoId}
                  temario={temario}
                  onIntentoRegistrado={actualizarTemario}
                />
              ) : leccion.contenido ? (
                <article className="rounded-panel border border-outline bg-surface p-6 shadow-card md:p-8">
                  <div className="whitespace-pre-line text-body-lg leading-8 text-on-surface">
                    {leccion.contenido}
                  </div>
                </article>
              ) : (
                <Alert variant="warning" title="Contenido no disponible">
                  El servidor no devolvió el contenido de esta lección.
                </Alert>
              )}

              {leccion.videoUrl && (
                <section className="rounded-panel border border-outline bg-surface p-6 shadow-card">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon name="play_circle" className="text-[24px]" />
                      </span>
                      <div>
                        <h2 className="text-headline-sm text-secondary">
                          Video de la lección
                        </h2>
                        <p className="text-body-sm text-on-surface-variant">
                          Recurso complementario del contenido.
                        </p>
                      </div>
                    </div>
                    <a
                      href={leccion.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-control border border-outline bg-surface px-4 py-2 text-label-md text-secondary transition-colors hover:bg-surface-variant"
                    >
                      <Icon name="open_in_new" className="text-[18px]" />
                      Abrir video
                    </a>
                  </div>
                </section>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <Link to={volverAlCurso} className="inline-flex">
                  <Button variant="secondary" icon="arrow_back">
                    Volver al curso
                  </Button>
                </Link>
                <p className="text-label-sm text-on-surface-variant">
                  El avance se valida en el servidor.
                </p>
              </div>
            </>
          )}
        </section>

        <aside className="space-y-4">
          {temarioData && (
            <div className="rounded-panel border border-outline bg-surface p-4 shadow-card">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-headline-sm text-secondary">Temario</h2>
                  <p className="text-label-sm text-on-surface-variant">
                    {temarioData.leccionesCompletadas ?? 0} de{' '}
                    {temarioData.totalLecciones ?? temario.length} completadas
                  </p>
                </div>
                <Icon name="list_alt" className="text-[22px] text-primary" />
              </div>

              <CourseProgress
                porcentaje={Number(temarioData.porcentajeAvance) || 0}
                leccionesCompletadas={Number(temarioData.leccionesCompletadas) || 0}
                totalLecciones={Number(temarioData.totalLecciones) || 0}
                titulo={cursoTitulo ?? 'este curso'}
              />

              <LessonOutline
                lecciones={temario}
                cursoId={cursoId}
                leccionActualId={leccionId}
                conEstados
              />
            </div>
          )}

          {!loading
            && !temarioData
            && outlineError
            && errorLeccion?.tipo !== 'no-inscrito'
            && errorLeccion?.tipo !== 'no-encontrada' && (
            <Alert variant="info" title="Temario no disponible">
              <p>{outlineError.message}</p>
            </Alert>
          )}
        </aside>
      </div>
    </div>
  );
}
