import { Link } from 'react-router';
import Alert from '../../components/Alert.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { obtenerCurso } from '../../services/curso.service.js';
import {
  listarMisInscripciones,
  normalizarInscripciones,
} from '../../services/inscripcion.service.js';

const niveles = {
  basico: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
};

function formatearFecha(valor) {
  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat('es', { dateStyle: 'medium' }).format(fecha);
}

async function cargarMisInscripciones() {
  const data = await listarMisInscripciones();
  const inscripciones = normalizarInscripciones(data);

  const resultados = await Promise.allSettled(
    inscripciones.map(async (inscripcion) => {
      if (inscripcion.curso?.titulo) {
        return inscripcion;
      }

      const cursoId = inscripcion.cursoId ?? inscripcion.curso?.id;

      if (!cursoId) {
        return inscripcion;
      }

      try {
        const detalle = await obtenerCurso(cursoId);
        return { ...inscripcion, curso: detalle?.curso ?? null };
      } catch {
        // A course that is no longer public must not hide the enrollment.
        return { ...inscripcion, curso: null };
      }
    }),
  );

  return {
    inscripciones: resultados
      .filter((resultado) => resultado.status === 'fulfilled')
      .map((resultado) => resultado.value),
  };
}

export default function MyCoursesPage() {
  const { data, loading, error, refetch } = useFetch(cargarMisInscripciones);
  const inscripciones = data?.inscripciones ?? [];
  const completados = inscripciones.filter((inscripcion) => inscripcion.completado).length;
  const enProgreso = inscripciones.length - completados;

  return (
    <section className="space-y-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="mb-1 text-headline-lg-mobile text-secondary sm:text-headline-lg">
            Mis cursos
          </h1>
          <p className="text-body-md text-on-surface-variant">
            Revisa tus cursos inscritos, su estado y retoma tu aprendizaje.
          </p>
        </div>
        <Link
          to="/catalog"
          className="inline-flex shrink-0 items-center gap-2 rounded-control border border-outline bg-surface px-4 py-2 text-label-md text-secondary transition-colors hover:bg-surface-variant"
        >
          <Icon name="explore" className="text-[20px]" />
          Explorar catálogo
        </Link>
      </header>

      {loading && (
        <p role="status" className="text-body-md text-on-surface-variant">
          Cargando tus cursos…
        </p>
      )}

      {!loading && error && (
        <Alert variant="error" title="No pudimos cargar tus cursos">
          <p>{error.message}</p>
          <Button variant="secondary" className="mt-2" onClick={refetch}>
            Reintentar
          </Button>
        </Alert>
      )}

      {!loading && !error && inscripciones.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-panel border border-dashed border-outline bg-surface-variant/40 p-8 text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface text-primary shadow-card">
            <Icon name="auto_stories" className="text-[24px]" />
          </span>
          <h2 className="mb-1 text-headline-sm text-secondary">
            Todavía no tienes cursos inscritos
          </h2>
          <p className="mb-4 max-w-md text-body-sm text-on-surface-variant">
            Explora el catálogo y elige un curso publicado para comenzar tu ruta
            de aprendizaje.
          </p>
          <Link
            to="/catalog"
            className="inline-flex items-center gap-2 rounded-control bg-primary px-4 py-2 text-label-md font-semibold text-on-primary shadow-card transition-opacity hover:opacity-95"
          >
            <Icon name="explore" className="text-[18px]" />
            Explorar cursos
          </Link>
        </div>
      )}

      {!loading && !error && inscripciones.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <article className="rounded-card border border-outline bg-surface p-5 shadow-card">
              <div className="mb-2 flex items-center justify-between text-on-surface-variant">
                <span className="text-label-sm">Cursos inscritos</span>
                <Icon name="auto_stories" className="text-[22px] text-primary" />
              </div>
              <p className="text-headline-md tabular-nums text-secondary">
                {inscripciones.length}
              </p>
              <span className="text-label-sm text-on-surface-variant">
                En tu ruta de aprendizaje
              </span>
            </article>

            <article className="rounded-card border border-outline bg-surface p-5 shadow-card">
              <div className="mb-2 flex items-center justify-between text-on-surface-variant">
                <span className="text-label-sm">En progreso</span>
                <Icon name="play_lesson" className="text-[22px] text-warning" />
              </div>
              <p className="text-headline-md tabular-nums text-secondary">
                {enProgreso}
              </p>
              <span className="text-label-sm text-on-surface-variant">
                Pendientes de completar
              </span>
            </article>

            <article className="col-span-2 rounded-card border border-outline bg-surface p-5 shadow-card lg:col-span-1">
              <div className="mb-2 flex items-center justify-between text-on-surface-variant">
                <span className="text-label-sm">Completados</span>
                <Icon name="verified" className="text-[22px] text-success" />
              </div>
              <p className="text-headline-md tabular-nums text-secondary">
                {completados}
              </p>
              <span className="text-label-sm text-on-surface-variant">
                Cursos finalizados
              </span>
            </article>
          </div>

          <div>
            <div className="mb-4">
              <h2 className="text-headline-sm text-secondary">Tus cursos</h2>
              <p className="text-body-sm text-on-surface-variant">
                Cada inscripción conserva su fecha y su estado actual.
              </p>
            </div>

            <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {inscripciones.map((inscripcion) => {
                const cursoId = inscripcion.cursoId ?? inscripcion.curso?.id;
                const curso = inscripcion.curso;
                const fecha = formatearFecha(inscripcion.fechaInscripcion);
                const titulo = curso?.titulo ?? `Curso #${cursoId}`;

                return (
                  <li
                    key={inscripcion.id ?? cursoId}
                    className="flex flex-col justify-between overflow-hidden rounded-panel border border-outline bg-surface shadow-card transition-shadow hover:shadow-hover"
                  >
                    <div>
                      <div className="relative h-28 overflow-hidden bg-gradient-to-br from-primary to-secondary">
                        <Icon
                          name="auto_stories"
                          className="absolute right-4 top-4 text-[52px] text-white/15"
                        />
                        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-label-sm font-semibold text-primary shadow-sm">
                          {curso?.categoria ?? 'Curso'}
                        </span>
                        {inscripcion.completado && (
                          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-success-light px-2.5 py-1 text-label-sm font-semibold text-success shadow-sm">
                            <Icon name="verified" filled className="text-[16px]" />
                            Completado
                          </span>
                        )}
                      </div>

                      <div className="p-5">
                        <h3 className="mb-2 break-words text-balance text-headline-sm leading-snug text-secondary">
                          {titulo}
                        </h3>

                        {curso?.descripcion && (
                          <p className="mb-3 line-clamp-2 break-words text-body-sm text-on-surface-variant">
                            {curso.descripcion}
                          </p>
                        )}

                        {!curso && (
                          <p className="mb-3 text-body-sm text-on-surface-variant">
                            La información pública de este curso ya no está
                            disponible.
                          </p>
                        )}

                        <dl className="my-3 grid grid-cols-2 gap-2 border-y border-outline-light py-2 text-label-sm">
                          <div>
                            <dt className="text-on-surface-variant">Nivel:</dt>
                            <dd className="font-semibold text-secondary">
                              {niveles[curso?.nivel] ?? curso?.nivel ?? 'Sin nivel'}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-on-surface-variant">Estado:</dt>
                            <dd
                              className={`font-semibold ${
                                inscripcion.completado ? 'text-success' : 'text-primary'
                              }`}
                            >
                              {inscripcion.completado ? 'Completado' : 'En progreso'}
                            </dd>
                          </div>
                          {fecha && (
                            <div className="col-span-2">
                              <dt className="text-on-surface-variant">Inscrito el:</dt>
                              <dd className="font-semibold text-secondary">{fecha}</dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    </div>

                    <div className="p-5 pt-0">
                      {cursoId ? (
                        <Link
                          to={`/catalog/${cursoId}`}
                          className="flex w-full items-center justify-center gap-1.5 rounded-control border border-outline bg-surface px-3 py-2 text-label-md text-secondary transition-colors hover:bg-surface-variant"
                        >
                          <Icon name="arrow_forward" className="text-[18px]" />
                          Ver curso
                        </Link>
                      ) : (
                        <span className="block text-center text-label-sm text-on-surface-variant">
                          Curso no disponible
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}
