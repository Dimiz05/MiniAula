import { Link } from 'react-router';
import Alert from '../../components/Alert.jsx';
import Button from '../../components/Button.jsx';
import CourseCard from '../../components/CourseCard.jsx';
import CourseProgress from '../../components/CourseProgress.jsx';
import Icon from '../../components/Icon.jsx';
import StatCard from '../../components/StatCard.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { obtenerCurso } from '../../services/curso.service.js';
import {
  listarMisInscripciones,
  normalizarInscripciones,
  porcentajeAvanceInscripcion,
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
  const completados = inscripciones.filter(
    (inscripcion) => porcentajeAvanceInscripcion(inscripcion) >= 100,
  ).length;
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
        <Button
          as={Link}
          to="/catalog"
          variant="secondary"
          icon="explore"
          iconPosition="start"
          className="shrink-0"
        >
          Explorar catálogo
        </Button>
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
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface text-primary">
            <Icon name="auto_stories" className="text-[24px]" />
          </span>
          <h2 className="mb-1 text-headline-sm text-secondary">
            Todavía no tienes cursos inscritos
          </h2>
          <p className="mb-4 max-w-md text-body-sm text-on-surface-variant">
            Explora el catálogo y elige un curso publicado para comenzar tu ruta
            de aprendizaje.
          </p>
          <Button as={Link} to="/catalog" icon="explore" iconPosition="start">
            Explorar cursos
          </Button>
        </div>
      )}

      {!loading && !error && inscripciones.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatCard
              label="Cursos inscritos"
              icon="auto_stories"
              tone="primary"
              value={inscripciones.length}
              detail="En tu ruta de aprendizaje"
            />

            <StatCard
              label="En progreso"
              icon="play_lesson"
              tone="neutral"
              value={enProgreso}
              detail="Pendientes de completar"
            />

            <StatCard
              className="col-span-2 lg:col-span-1"
              label="Completados"
              icon="verified"
              tone="success"
              value={completados}
              detail="Cursos finalizados"
            />
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
                const avance = porcentajeAvanceInscripcion(inscripcion);
                const completadoCurso = avance >= 100;
                const totalLecciones = Number(inscripcion.totalLecciones) || 0;
                const leccionesCompletadas =
                  Number(inscripcion.leccionesCompletadas) || 0;

                return (
                  <li key={inscripcion.id ?? cursoId} className="h-full">
                    <CourseCard
                      className="h-full"
                      portada={curso?.portada}
                      alt={curso ? `Portada de ${titulo}` : ''}
                      cover={
                        <>
                          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-label-sm font-semibold text-primary shadow-sm">
                            {curso?.categoria ?? 'Curso'}
                          </span>
                          {completadoCurso && (
                            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-success-light px-2.5 py-1 text-label-sm font-semibold text-success shadow-sm">
                              <Icon name="verified" filled className="text-[16px]" />
                              Completado
                            </span>
                          )}
                        </>
                      }
                      title={titulo}
                      description={
                        curso?.descripcion ??
                        (!curso
                          ? 'La información pública de este curso ya no está disponible.'
                          : null)
                      }
                      action={
                        cursoId ? (
                          <Button
                            as={Link}
                            to={`/catalog/${cursoId}`}
                            variant="secondary"
                            icon="arrow_forward"
                            className="w-full"
                          >
                            Ver curso
                          </Button>
                        ) : (
                          <span className="block text-center text-label-sm text-on-surface-variant">
                            Curso no disponible
                          </span>
                        )
                      }
                    >
                      <CourseProgress
                        porcentaje={avance}
                        leccionesCompletadas={leccionesCompletadas}
                        totalLecciones={totalLecciones}
                        titulo={titulo}
                      />

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
                              completadoCurso ? 'text-success' : 'text-primary'
                            }`}
                          >
                            {completadoCurso ? 'Completado' : 'En progreso'}
                          </dd>
                        </div>
                        {fecha && (
                          <div className="col-span-2">
                            <dt className="text-on-surface-variant">Inscrito el:</dt>
                            <dd className="font-semibold text-secondary">{fecha}</dd>
                          </div>
                        )}
                      </dl>
                    </CourseCard>
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
