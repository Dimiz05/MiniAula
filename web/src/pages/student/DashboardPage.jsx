import { Link, useLocation } from 'react-router';
import Alert from '../../components/Alert.jsx';
import Button from '../../components/Button.jsx';
import CourseCard from '../../components/CourseCard.jsx';
import Icon from '../../components/Icon.jsx';
import StatCard from '../../components/StatCard.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { listarCursos } from '../../services/curso.service.js';
import {
  listarMisInscripciones,
  normalizarInscripciones,
} from '../../services/inscripcion.service.js';
import { calcularResumenAprendizaje } from './dashboardStats.js';

const niveles = {
  basico: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
};

export default function DashboardPage() {
  const { usuario } = useAuth();
  const location = useLocation();
  const { data, loading, error, refetch } = useFetch(() =>
    listarCursos({ page: 1, limit: 3 }),
  );
  const {
    data: inscripcionesData,
    loading: loadingResumen,
    error: errorResumen,
    refetch: refetchResumen,
  } = useFetch(listarMisInscripciones);

  const firstName = usuario?.nombre?.trim().split(/\s+/)[0] ?? '';
  const recomendados = Array.isArray(data?.cursos) ? data.cursos : [];
  const totalCursos = data?.paginacion?.total ?? 0;
  const resumen = calcularResumenAprendizaje(
    normalizarInscripciones(inscripcionesData),
  );
  const resumenDisponible = !loadingResumen && !errorResumen;

  const stats = [
    {
      label: 'Cursos inscritos',
      icon: 'auto_stories',
      tone: 'primary',
      value: resumenDisponible ? resumen.inscritos : '—',
      detail: loadingResumen
        ? 'Cargando tu ruta…'
        : errorResumen
          ? 'No disponible'
          : resumen.inscritos === 0
            ? 'Explora el catálogo para inscribirte'
            : resumen.activos === 0
              ? 'Todos tus cursos completados'
              : `${resumen.activos} ${resumen.activos === 1 ? 'activo' : 'activos'} actualmente`,
    },
    {
      label: 'Cursos completados',
      icon: 'verified',
      tone: 'success',
      value: resumenDisponible ? resumen.completados : '—',
      detail: loadingResumen
        ? 'Cargando tu ruta…'
        : errorResumen
          ? 'No disponible'
          : resumen.completados === 0
            ? 'Aún sin certificados'
            : resumen.completados === 1
              ? 'Certificado disponible'
              : 'Certificados disponibles',
    },
    {
      label: 'Lecciones completadas',
      icon: 'task_alt',
      tone: 'neutral',
      value: resumenDisponible ? resumen.leccionesCompletadas : '—',
      detail: loadingResumen
        ? 'Cargando tu ruta…'
        : errorResumen
          ? 'No disponible'
          : resumen.totalLecciones > 0
            ? `De ${resumen.totalLecciones} lecciones totales`
            : 'Empieza tu primera lección',
    },
  ];

  return (
    <div className="space-y-8">
      {location.state?.welcome && (
        <Alert variant="success" title="Tu cuenta está lista">
          Ya puedes explorar el catálogo e inscribirte a tu primer curso.
        </Alert>
      )}

      <section className="flex flex-col items-start justify-between gap-6 rounded-panel border border-primary/20 bg-primary/[0.05] p-6 md:flex-row md:items-center md:p-8">
        <div>
          <span className="mb-3 inline-block rounded-full border border-primary/20 bg-surface px-3 py-1 text-label-sm font-semibold text-primary">
            Tu espacio de aprendizaje
          </span>
          <h1 className="mb-1 text-headline-lg-mobile text-secondary sm:text-headline-lg">
            ¡Hola, {firstName}!
          </h1>
          <p className="text-body-md text-on-surface-variant">
            Continúa aprendiendo y alcanza tus objetivos de certificación académica.
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
          Explorar nuevos cursos
        </Button>
      </section>

      <section>
        <h2 className="mb-4 text-headline-sm text-secondary">Resumen de aprendizaje</h2>

        {!loadingResumen && errorResumen && (
          <Alert
            variant="error"
            title="No pudimos cargar tu resumen"
            className="mb-4"
          >
            <p>{errorResumen.message}</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2"
              onClick={refetchResumen}
            >
              Reintentar
            </Button>
          </Alert>
        )}

        <div
          className="grid grid-cols-2 gap-4 lg:grid-cols-4"
          aria-busy={loadingResumen}
        >
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}

          <StatCard
            label="Cursos disponibles"
            icon="school"
            tone="neutral"
            value={loading || error ? '—' : totalCursos}
            detail={error ? 'No disponible' : 'En el catálogo ahora'}
          />
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-headline-sm text-secondary">Continúa aprendiendo</h2>
            <p className="text-body-sm text-on-surface-variant">
              Reanuda tus lecciones en el punto exacto donde las dejaste.
            </p>
          </div>
          <Link
            to={resumen.inscritos > 0 ? '/mis-cursos' : '/catalog'}
            className="inline-flex items-center gap-1 text-label-md text-primary hover:underline"
          >
            {resumen.inscritos > 0 ? 'Ver todos mis cursos' : 'Ver catálogo de cursos'}
            <Icon name="chevron_right" className="text-[16px]" />
          </Link>
        </div>

        {loadingResumen ? (
          <p className="rounded-panel border border-outline bg-surface p-6 text-center text-body-md text-on-surface-variant shadow-card">
            Cargando tus cursos…
          </p>
        ) : errorResumen ? (
          <div className="rounded-panel border border-dashed border-outline bg-surface p-6 text-center">
            <p className="text-body-md text-on-surface-variant">
              No pudimos cargar tus cursos en progreso.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={refetchResumen}
            >
              Reintentar
            </Button>
          </div>
        ) : resumen.inscritos > 0 ? (
          <div className="flex flex-col items-start justify-between gap-4 rounded-panel border border-primary/20 bg-primary/[0.04] p-6 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface text-primary">
                <Icon name="play_lesson" className="text-[24px]" />
              </span>
              <div>
                <h3 className="mb-1 text-headline-sm text-secondary">
                  {resumen.activos > 0
                    ? resumen.activos === 1
                      ? 'Tienes 1 curso en progreso'
                      : `Tienes ${resumen.activos} cursos en progreso`
                    : 'Completaste todos tus cursos'}
                </h3>
                <p className="max-w-md text-body-sm text-on-surface-variant">
                  {resumen.activos > 0
                    ? 'Retoma tus lecciones en Mis cursos y continúa donde las dejaste.'
                    : 'Explora el catálogo y elige un nuevo curso para seguir aprendiendo.'}
                </p>
              </div>
            </div>
            <Button
              as={Link}
              to={resumen.activos > 0 ? '/mis-cursos' : '/catalog'}
              icon={resumen.activos > 0 ? 'play_arrow' : 'explore'}
              iconPosition="start"
              className="shrink-0"
            >
              {resumen.activos > 0 ? 'Continuar aprendiendo' : 'Explorar cursos'}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-panel border border-dashed border-outline bg-surface-variant/40 p-8 text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface text-primary">
              <Icon name="play_lesson" className="text-[24px]" />
            </span>
            <h3 className="mb-1 text-headline-sm text-secondary">
              Todavía no tienes cursos en progreso
            </h3>
            <p className="mb-4 max-w-md text-body-sm text-on-surface-variant">
              Explora el catálogo y elige tu primer curso para comenzar tu ruta de
              aprendizaje.
            </p>
            <Button as={Link} to="/catalog" icon="explore" iconPosition="start">
              Explorar cursos
            </Button>
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-headline-sm text-secondary">Cursos recomendados para ti</h2>
          <Link to="/catalog" className="text-label-md text-primary hover:underline">
            Ver catálogo completo
          </Link>
        </div>

        {loading && (
          <p className="rounded-panel border border-outline bg-surface p-6 text-center text-body-md text-on-surface-variant shadow-card">
            Cargando cursos…
          </p>
        )}

        {!loading && error && (
          <Alert variant="error" title="No pudimos cargar las recomendaciones">
            <p>{error.message}</p>
            <Button variant="secondary" size="sm" className="mt-2" onClick={refetch}>
              Reintentar
            </Button>
          </Alert>
        )}

        {!loading && !error && recomendados.length === 0 && (
          <p className="rounded-panel border border-dashed border-outline bg-surface p-6 text-center text-body-md text-on-surface-variant">
            Todavía no hay cursos publicados. Vuelve pronto.
          </p>
        )}

        {!loading && !error && recomendados.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {recomendados.map((curso) => (
              <CourseCard
                key={curso.id}
                portada={curso.portada}
                alt={`Portada de ${curso.titulo}`}
                cover={
                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2 py-0.5 text-label-sm font-semibold text-primary shadow-sm">
                    {curso.categoria ?? 'Sin categoría'}
                  </span>
                }
                title={curso.titulo}
                description={curso.descripcion}
                meta={
                  <>
                    <span className="truncate">
                      {curso.instructor?.nombre ?? 'Sin instructor'}
                    </span>
                    <span className="shrink-0 rounded bg-surface-variant px-2 py-0.5 text-secondary">
                      {niveles[curso.nivel] ?? curso.nivel ?? 'Sin nivel'}
                    </span>
                  </>
                }
                action={
                  <Button
                    as={Link}
                    to={`/catalog/${curso.id}`}
                    variant="secondary"
                    icon="arrow_forward"
                    className="w-full"
                  >
                    Ver detalle
                  </Button>
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
