import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import Alert from '../components/Alert.jsx';
import Button from '../components/Button.jsx';
import Icon from '../components/Icon.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { obtenerCurso } from '../services/curso.service.js';

function nivelLabel(nivel) {
  const labels = {
    basico: 'Básico',
    intermedio: 'Intermedio',
    avanzado: 'Avanzado',
  };
  return labels[nivel] ?? nivel ?? 'Sin nivel';
}

export default function CourseDetailPage() {
  const { id } = useParams();
  const { isAuthenticated, usuario } = useAuth();
  const [curso, setCurso] = useState(null);
  const [temario, setTemario] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(null);

    obtenerCurso(id)
      .then((data) => {
        if (!active) {
          return;
        }
        setCurso(data?.curso ?? null);
        setTemario(Array.isArray(data?.temario) ? data.temario : []);
      })
      .catch((err) => {
        if (active) {
          setError(err);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            Detalle del curso
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-secondary sm:text-4xl">
            Detalle del curso
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
            Revisa el temario, el instructor y los requisitos antes de inscribirte.
          </p>
        </div>
        <Link
          to="/catalog"
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          <Icon name="arrow_back" className="text-[18px]" />
          Volver al catálogo
        </Link>
      </header>

      {loading && (
        <section className="rounded-card border border-outline bg-surface p-8 text-center shadow-card">
          <p className="text-sm text-on-surface-variant">Cargando el curso…</p>
        </section>
      )}

      {!loading && error && (
        <Alert variant="error" title="No pudimos cargar el curso">
          {error.message}
        </Alert>
      )}

      {!loading && !error && curso && (
        <section className="rounded-card border border-outline bg-surface p-6 shadow-card sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-2xl font-bold tracking-tight text-secondary">
                {curso.titulo}
              </h2>
              {curso.descripcion && (
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                  {curso.descripcion}
                </p>
              )}
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/5 px-3 py-1 text-[11px] font-semibold text-primary">
              {curso.categoria ?? 'Sin categoría'}
            </span>
          </div>

          <dl className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[10px] bg-background p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                Instructor
              </dt>
              <dd className="mt-1 text-sm font-semibold text-secondary">
                {curso.instructor?.nombre ?? 'Sin instructor'}
              </dd>
            </div>
            <div className="rounded-[10px] bg-background p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                Nivel
              </dt>
              <dd className="mt-1 text-sm font-semibold text-secondary">
                {nivelLabel(curso.nivel)}
              </dd>
            </div>
            <div className="rounded-[10px] bg-background p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                Lecciones
              </dt>
              <dd className="mt-1 text-sm font-semibold text-secondary">
                {temario.length}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {isAuthenticated && usuario?.rol === 'estudiante' ? (
              <Button icon="school" iconPosition="start">
                Inscribirse en el curso
              </Button>
            ) : (
              <Link to="/login" className="inline-flex">
                <Button icon="login" iconPosition="start">
                  Inicia sesión para inscribirte
                </Button>
              </Link>
            )}
          </div>
        </section>
      )}

      {!error && (
        <section className="rounded-card border border-outline bg-surface p-6 shadow-card sm:p-8">
          <div className="flex items-start gap-3 border-b border-outline-light pb-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-primary/5 text-primary">
              <Icon name="list_alt" className="text-[22px]" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-secondary">Temario</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                El contenido de cada lección se desbloquea al completar la anterior.
              </p>
            </div>
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-on-surface-variant">
              Cargando el temario…
            </p>
          ) : temario.length === 0 ? (
            <p className="mt-6 text-sm text-on-surface-variant">
              Este curso todavía no tiene lecciones publicadas.
            </p>
          ) : (
            <ol className="mt-6 space-y-3">
              {temario.map((leccion, index) => (
                <li
                  key={leccion.id}
                  className="flex items-start gap-3 rounded-[10px] border border-outline-light bg-background/60 p-4"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-secondary">
                      {leccion.titulo}
                    </p>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      {leccion.tipo === 'cuestionario'
                        ? `Cuestionario · nota mínima ${leccion.notaMinima ?? 0}`
                        : 'Lección de contenido'}
                    </p>
                  </div>
                  <Icon
                    name={leccion.tipo === 'cuestionario' ? 'quiz' : 'article'}
                    className="text-[20px] text-on-surface-variant"
                  />
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {!loading && !error && !curso && (
        <section className="rounded-card border border-outline bg-surface p-8 text-center shadow-card">
          <p className="text-sm text-on-surface-variant">
            El curso no existe o no está publicado.
          </p>
        </section>
      )}
    </div>
  );
}