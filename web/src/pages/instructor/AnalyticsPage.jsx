import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import Alert from '../../components/Alert.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import {
  listarCursosPropios,
  obtenerAnaliticasCurso,
} from '../../services/curso.service.js';
import { listarEstudiantesCurso } from '../../services/inscripcion.service.js';
import {
  DesempenoCuestionario,
  DistribucionProgreso,
  EmbudoRetencion,
  EstudiantesInscritos,
  ResumenAnaliticas,
} from './AnalyticsOverview.jsx';
import { estados } from './courseForm.js';

const estadoStyles = {
  publicado: 'bg-success-light text-success',
  borrador: 'bg-warning-light text-secondary',
  archivado: 'bg-surface-variant text-on-surface-variant',
};

export default function AnalyticsPage() {
  const cursosFetch = useFetch(listarCursosPropios);
  const cursos = cursosFetch.data?.cursos ?? [];
  const [searchParams, setSearchParams] = useSearchParams();
  const [cursoId, setCursoId] = useState(
    () => searchParams.get('curso') ?? '',
  );

  useEffect(() => {
    if (cursos.length === 0) {
      return;
    }

    const existe = cursos.some((curso) => String(curso.id) === cursoId);

    if (!cursoId || !existe) {
      setCursoId(String(cursos[0].id));
    }
  }, [cursos, cursoId]);

  const analiticasFetch = useFetch(
    () => (cursoId ? obtenerAnaliticasCurso(cursoId) : Promise.resolve(null)),
    [cursoId],
  );
  const estudiantesFetch = useFetch(
    () => (cursoId ? listarEstudiantesCurso(cursoId) : Promise.resolve(null)),
    [cursoId],
  );
  const analiticas = analiticasFetch.data?.analiticas ?? null;
  const curso = analiticas?.curso ?? null;
  const estudiantes = estudiantesFetch.data?.estudiantes ?? [];
  const seleccionado = cursos.find((item) => String(item.id) === cursoId) ?? null;
  const titulo = curso?.titulo ?? seleccionado?.titulo ?? 'Analíticas del curso';
  const estado = curso?.estado ?? seleccionado?.estado ?? null;

  function seleccionarCurso(id) {
    const valor = String(id);

    setCursoId(valor);
    setSearchParams({ curso: valor }, { replace: true });
  }

  return (
    <section className="space-y-8">
      <header className="space-y-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <Link
              to="/instructor/cursos"
              aria-label="Volver al panel principal"
              className="rounded-control p-1.5 text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-secondary"
            >
              <Icon name="arrow_back" className="text-[20px]" />
            </Link>
            <div>
              <span className="text-label-sm text-on-surface-variant">
                Analíticas detalladas del curso
              </span>
              <h1 className="break-words text-headline-lg-mobile text-secondary sm:text-headline-lg">
                {titulo}
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {estado && (
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-label-sm font-semibold ${
                estadoStyles[estado] ?? estadoStyles.borrador
              }`}
              >
                <span className="h-2 w-2 rounded-full bg-current" />
                {estados[estado] ?? estado}
              </span>
            )}
          </div>
        </div>

        {cursos.length > 0 && (
          <div className="flex flex-col gap-3 rounded-panel border border-outline bg-surface p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-primary/10 text-primary">
                <Icon name="auto_stories" className="text-[20px]" />
              </span>
              <div>
                <p className="text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant">
                  Curso analizado
                </p>
                <p className="text-body-sm text-on-surface-variant">
                  Elige el curso cuyas métricas quieres revisar.
                </p>
              </div>
            </div>
            <div className="relative w-full sm:w-80">
              <label htmlFor="curso-analiticas" className="sr-only">
                Curso analizado
              </label>
              <select
                id="curso-analiticas"
                value={cursoId}
                onChange={(event) => seleccionarCurso(event.target.value)}
                className="w-full appearance-none rounded-control border border-outline bg-surface py-2.5 pl-3.5 pr-10 text-body-md text-secondary shadow-sm transition-colors hover:border-primary/40"
              >
                {cursos.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.titulo}
                  </option>
                ))}
              </select>
              <Icon
                name="expand_more"
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant"
              />
            </div>
          </div>
        )}
      </header>

      {cursosFetch.loading && (
        <p role="status" className="text-body-md text-on-surface-variant">
          Cargando tus cursos…
        </p>
      )}

      {cursosFetch.error && (
        <Alert variant="error" title="No se pudieron cargar tus cursos">
          <p>{cursosFetch.error.message}</p>
          <Button variant="secondary" className="mt-2" onClick={cursosFetch.refetch}>
            Reintentar
          </Button>
        </Alert>
      )}

      {!cursosFetch.loading && !cursosFetch.error && cursos.length === 0 && (
        <Alert title="Todavía no tienes cursos">
          <p>
            Crea tu primer curso para empezar a registrar estudiantes y ver sus
            analíticas.
          </p>
          <Link
            to="/instructor/cursos/nuevo"
            className="mt-3 inline-flex items-center gap-2 rounded-control bg-primary px-4 py-2 text-label-md font-semibold text-on-primary"
          >
            <Icon name="add_box" className="text-[18px]" />
            Crear curso
          </Link>
        </Alert>
      )}

      {cursos.length > 0 && analiticasFetch.loading && (
        <p role="status" className="text-body-md text-on-surface-variant">
          Cargando analíticas del curso…
        </p>
      )}

      {cursos.length > 0 && analiticasFetch.error && (
        <Alert variant="error" title="No se pudieron cargar las analíticas">
          <p>{analiticasFetch.error.message}</p>
          <Button
            variant="secondary"
            className="mt-2"
            onClick={analiticasFetch.refetch}
          >
            Reintentar
          </Button>
        </Alert>
      )}

      {!analiticasFetch.loading && !analiticasFetch.error && analiticas && (
        <>
          <ResumenAnaliticas curso={analiticas.curso} />
          <EmbudoRetencion curso={analiticas.curso} embudo={analiticas.embudo} />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <DistribucionProgreso distribucion={analiticas.distribucionProgreso} />
            <DesempenoCuestionario cuestionario={analiticas.cuestionario} />
          </div>

          <EstudiantesInscritos
            estudiantes={estudiantes}
            loading={estudiantesFetch.loading}
            error={estudiantesFetch.error}
            onRetry={estudiantesFetch.refetch}
          />
        </>
      )}
    </section>
  );
}
