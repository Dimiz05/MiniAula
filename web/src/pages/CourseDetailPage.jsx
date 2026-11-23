import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import Alert from '../components/Alert.jsx';
import Button from '../components/Button.jsx';
import Icon from '../components/Icon.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { obtenerCurso } from '../services/curso.service.js';
import { getInitials } from '../utils/initials.js';

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

  const cuestionarios = temario.filter((leccion) => leccion.tipo === 'cuestionario').length;

  return (
    <div className="space-y-8">
      <Link
        to="/catalog"
        className="inline-flex items-center gap-1.5 text-label-md text-secondary transition-colors hover:text-primary"
      >
        <Icon name="arrow_back" className="text-[20px]" />
        Volver al catálogo
      </Link>

      {loading && (
        <section className="rounded-panel border border-outline bg-surface p-8 text-center shadow-card">
          <p className="text-body-md text-on-surface-variant">Cargando el curso…</p>
        </section>
      )}

      {!loading && error && (
        <Alert variant="error" title="No pudimos cargar el curso">
          {error.message}
        </Alert>
      )}

      {!loading && !error && curso && (
        <>
          <section className="grid grid-cols-1 overflow-hidden rounded-panel border border-outline bg-surface shadow-card lg:grid-cols-12">
            <div className="flex flex-col justify-between p-6 md:p-8 lg:col-span-7">
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-label-sm font-semibold text-primary">
                    {curso.categoria ?? 'Sin categoría'}
                  </span>
                  <span className="rounded-full bg-surface-variant px-3 py-1 text-label-sm text-secondary">
                    Nivel {nivelLabel(curso.nivel)}
                  </span>
                  <span className="rounded-full bg-success-light px-3 py-1 text-label-sm font-semibold text-secondary">
                    Curso publicado
                  </span>
                </div>

                <h1 className="mb-3 text-balance text-headline-lg-mobile leading-snug text-secondary sm:text-headline-lg">
                  {curso.titulo}
                </h1>

                {curso.descripcion && (
                  <p className="mb-6 text-body-lg text-on-surface-variant">
                    {curso.descripcion}
                  </p>
                )}

                <div className="flex items-center gap-4 border-y border-outline-light py-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-label-lg font-bold text-primary">
                    {getInitials(curso.instructor?.nombre)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-label-md font-bold text-secondary">
                      {curso.instructor?.nombre ?? 'Sin instructor'}
                    </p>
                    <p className="text-body-sm text-on-surface-variant">
                      Instructor del curso
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-6">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-label-sm text-secondary">
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="play_lesson" className="text-[20px] text-primary" />
                    {temario.length} {temario.length === 1 ? 'lección' : 'lecciones'}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="quiz" className="text-[20px] text-primary" />
                    {cuestionarios} {cuestionarios === 1 ? 'cuestionario' : 'cuestionarios'}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="lock_open" className="text-[20px] text-primary" />
                    Acceso al inscribirte
                  </span>
                </div>

                {isAuthenticated && usuario?.rol === 'estudiante' ? (
                  <Button icon="how_to_reg">Inscribirme al curso</Button>
                ) : (
                  <Link to="/login" className="inline-flex">
                    <Button icon="login" iconPosition="start">
                      Inicia sesión para inscribirte
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            <div className="relative min-h-[240px] border-t border-outline bg-gradient-to-br from-primary to-secondary p-6 lg:col-span-5 lg:border-l lg:border-t-0">
              <Icon
                name="menu_book"
                className="absolute right-6 top-6 text-[96px] text-white/15"
              />
              <div className="flex h-full flex-col justify-end">
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-body-sm text-white">
                  <Icon name="lock_open" className="text-[18px]" />
                  Vista previa pública
                </span>
              </div>
            </div>
          </section>

          <section className="flex items-start gap-3 rounded-panel border border-warning/40 bg-warning-light p-4">
            <Icon name="info" className="mt-0.5 text-[24px] text-secondary" />
            <div>
              <h2 className="text-label-md font-bold text-secondary">
                Vista previa del temario
              </h2>
              <p className="text-body-sm text-secondary">
                Estás visualizando el temario estructurado del curso. Los
                contenidos interactivos y las evaluaciones se desbloquean en
                estricto orden secuencial cuando confirmes tu inscripción.
              </p>
            </div>
          </section>

          <section className="rounded-panel border border-outline bg-surface p-6 shadow-card md:p-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-headline-sm text-secondary">Temario del curso</h2>
                <p className="text-body-sm text-on-surface-variant">
                  {temario.length} {temario.length === 1 ? 'lección secuencial' : 'lecciones secuenciales'} para este curso.
                </p>
              </div>
              <span className="text-label-sm font-semibold text-primary">
                100% en línea · A tu ritmo
              </span>
            </div>

            {loading ? (
              <p className="text-body-md text-on-surface-variant">
                Cargando el temario…
              </p>
            ) : temario.length === 0 ? (
              <p className="text-body-md text-on-surface-variant">
                Este curso todavía no tiene lecciones publicadas.
              </p>
            ) : (
              <ol className="space-y-3">
                {temario.map((leccion, index) => {
                  const esCuestionario = leccion.tipo === 'cuestionario';

                  return (
                    <li
                      key={leccion.id}
                      className={`flex flex-wrap items-center justify-between gap-3 rounded-control border p-4 ${
                        index === 0
                          ? 'border-outline bg-surface-variant/40'
                          : 'border-outline bg-surface'
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-label-sm font-bold ${
                            esCuestionario
                              ? 'bg-warning-light text-secondary'
                              : index === 0
                                ? 'bg-primary/10 text-primary'
                                : 'bg-surface-variant text-secondary'
                          }`}
                        >
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <h3 className="text-label-md font-semibold text-secondary">
                            {leccion.titulo}
                          </h3>
                          <span className="mt-0.5 flex items-center gap-1 text-label-sm text-on-surface-variant">
                            <Icon
                              name={esCuestionario ? 'quiz' : 'article'}
                              className="text-[16px]"
                            />
                            {esCuestionario
                              ? `Cuestionario · nota mínima ${leccion.notaMinima ?? 0}`
                              : 'Lección de contenido'}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 text-label-sm ${
                          index === 0
                            ? 'font-semibold text-secondary'
                            : 'text-on-surface-variant'
                        }`}
                      >
                        <Icon
                          name={index === 0 ? 'lock_open' : 'lock'}
                          className={`text-[18px] ${index === 0 ? 'text-primary' : ''}`}
                        />
                        {index === 0
                          ? 'Disponible al inscribirte'
                          : esCuestionario
                            ? 'Requiere completar las lecciones'
                            : 'Bloqueado secuencialmente'}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}

            <div className="mt-8 border-t border-outline pt-6 text-center">
              {isAuthenticated && usuario?.rol === 'estudiante' ? (
                <Button icon="arrow_forward">Inscribirme al curso ahora</Button>
              ) : (
                <Link to="/login" className="inline-flex">
                  <Button icon="arrow_forward">Inicia sesión para inscribirte</Button>
                </Link>
              )}
            </div>
          </section>
        </>
      )}

      {!loading && !error && !curso && (
        <section className="rounded-panel border border-outline bg-surface p-8 text-center shadow-card">
          <p className="text-body-md text-on-surface-variant">
            El curso no existe o no está publicado.
          </p>
        </section>
      )}
    </div>
  );
}
