import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import Alert from '../components/Alert.jsx';
import Button from '../components/Button.jsx';
import CourseCover from '../components/CourseCover.jsx';
import Icon from '../components/Icon.jsx';
import LessonOutline from '../components/LessonOutline.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { obtenerCurso } from '../services/curso.service.js';
import {
  esInscripcionDuplicada,
  estaInscritoEn,
  inscribirCurso,
  listarMisInscripciones,
} from '../services/inscripcion.service.js';
import { obtenerTemarioEstudiante } from '../services/leccion.service.js';
import { getInitials } from '../utils/initials.js';
import { rutaLeccion, siguienteLeccion } from '../utils/lessonState.js';

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
  const [inscrito, setInscrito] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [notice, setNotice] = useState(null);
  const [conEstados, setConEstados] = useState(false);
  const [avance, setAvance] = useState(null);
  const [cargandoTemario, setCargandoTemario] = useState(false);
  const conEstadosRef = useRef(false);

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
        // The student outline endpoint may have already replaced the public
        // preview with API states; a late public response must not erase them.
        if (!conEstadosRef.current) {
          setTemario(Array.isArray(data?.temario) ? data.temario : []);
        }
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

  useEffect(() => {
    if (usuario?.rol !== 'estudiante' || !id) {
      return undefined;
    }

    let active = true;
    setInscrito(false);
    setConEstados(false);
    conEstadosRef.current = false;
    setAvance(null);

    // The enrollment is confirmed by the server. If the listing endpoint is
    // unavailable, the detail page still offers the enrollment action.
    listarMisInscripciones()
      .then((data) => {
        if (active) {
          setInscrito(estaInscritoEn(data?.inscripciones, id));
        }
      })
      .catch(() => {
        // A missing listing endpoint must not hide the course detail.
      });

    return () => {
      active = false;
    };
  }, [id, usuario?.rol]);

  useEffect(() => {
    if (!inscrito || usuario?.rol !== 'estudiante' || !id) {
      return undefined;
    }

    let active = true;

    setCargandoTemario(true);

    // The outline states come from the server. The public preview is replaced
    // only when the API confirms the enrollment and returns each lesson state.
    obtenerTemarioEstudiante(id)
      .then((data) => {
        if (!active) {
          return;
        }

        if (data?.curso) {
          setCurso(data.curso);
        }
        if (Array.isArray(data?.temario)) {
          conEstadosRef.current = true;
          setTemario(data.temario);
          setConEstados(true);
        }
        setAvance({
          porcentajeAvance: Number(data?.porcentajeAvance) || 0,
          leccionesCompletadas: Number(data?.leccionesCompletadas) || 0,
          totalLecciones: Number(data?.totalLecciones) || 0,
        });
      })
      .catch(() => {
        if (active) {
          conEstadosRef.current = false;
          setConEstados(false);
          setAvance(null);
        }
      })
      .finally(() => {
        if (active) {
          setCargandoTemario(false);
        }
      });

    return () => {
      active = false;
    };
  }, [id, inscrito, usuario?.rol]);

  async function handleInscribir() {
    if (enrolling || inscrito) {
      return;
    }

    setEnrolling(true);
    setNotice(null);

    try {
      await inscribirCurso(id);
      setInscrito(true);
      setNotice({
        variant: 'success',
        title: 'Inscripción confirmada',
        message: 'Ya formas parte de este curso. Puedes verlo en «Mis cursos».',
      });
    } catch (err) {
      if (esInscripcionDuplicada(err)) {
        setInscrito(true);
        setNotice({
          variant: 'info',
          title: 'Ya estás inscrito',
          message: err.message,
        });
      } else {
        setNotice({
          variant: 'error',
          title: 'No pudimos completar la inscripción',
          message: err.message,
        });
      }
    } finally {
      setEnrolling(false);
    }
  }

  const puedeInscribirse = isAuthenticated && usuario?.rol === 'estudiante';
  const siguiente = conEstados ? siguienteLeccion(temario) : null;

  function renderInscripcionCta() {
    if (inscrito) {
      return (
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success-light px-3 py-1.5 text-label-sm font-semibold text-success">
            <Icon name="check_circle" filled className="text-[18px]" />
            Ya estás inscrito
          </span>
          {siguiente && (
            <Link to={rutaLeccion(id, siguiente.id)} className="inline-flex">
              <Button icon="play_arrow">Continuar curso</Button>
            </Link>
          )}
          <Link to="/mis-cursos" className="inline-flex">
            <Button variant="secondary" icon="arrow_forward">
              Ir a mis cursos
            </Button>
          </Link>
        </div>
      );
    }

    if (puedeInscribirse) {
      return (
        <Button
          icon="how_to_reg"
          loading={enrolling}
          onClick={handleInscribir}
        >
          Inscribirme al curso
        </Button>
      );
    }

    if (isAuthenticated) {
      return (
        <span className="inline-flex items-center gap-1.5 text-label-sm text-on-surface-variant">
          <Icon name="info" className="text-[18px]" />
          Solo los estudiantes pueden inscribirse.
        </span>
      );
    }

    return (
      <Link to="/login" className="inline-flex">
        <Button icon="login" iconPosition="start">
          Inicia sesión para inscribirte
        </Button>
      </Link>
    );
  }

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

      {notice && (
        <Alert variant={notice.variant} title={notice.title}>
          <p>{notice.message}</p>
          {notice.variant === 'success' && (
            <Link
              to="/mis-cursos"
              className="mt-2 inline-flex items-center gap-1 text-label-md font-semibold underline"
            >
              Ver mis cursos
              <Icon name="arrow_forward" className="text-[16px]" />
            </Link>
          )}
        </Alert>
      )}

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
                    {inscrito ? 'Acceso secuencial activo' : 'Acceso al inscribirte'}
                  </span>
                </div>

                {renderInscripcionCta()}
              </div>
            </div>

            <CourseCover
              portada={curso.portada}
              alt={`Portada de ${curso.titulo}`}
              icon="menu_book"
              className="min-h-[240px] border-t border-outline p-6 lg:col-span-5 lg:border-l lg:border-t-0"
              iconClassName="absolute right-6 top-6 text-[96px] text-white/15"
            >
              <div className="flex h-full flex-col justify-end">
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-body-sm text-white">
                  <Icon name="lock_open" className="text-[18px]" />
                  Vista previa pública
                </span>
              </div>
            </CourseCover>
          </section>

          {inscrito ? (
            <section className="flex items-start gap-3 rounded-panel border border-primary/20 bg-primary/5 p-4">
              <Icon name="verified_user" className="mt-0.5 text-[24px] text-primary" />
              <div>
                <h2 className="text-label-md font-bold text-secondary">
                  Tu avance lo valida el servidor
                </h2>
                <p className="text-body-sm text-on-surface-variant">
                  Los estados completada, disponible y bloqueada provienen de la
                  API. Las lecciones bloqueadas no permiten abrir su contenido,
                  incluso si escribes la dirección directamente.
                </p>
              </div>
            </section>
          ) : (
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
          )}

          <section className="rounded-panel border border-outline bg-surface p-6 shadow-card md:p-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-headline-sm text-secondary">Temario del curso</h2>
                <p className="text-body-sm text-on-surface-variant">
                  {conEstados
                    ? `${avance?.leccionesCompletadas ?? 0} de ${temario.length} completadas`
                    : cargandoTemario
                      ? 'Cargando tu avance…'
                      : `${temario.length} ${temario.length === 1 ? 'lección secuencial' : 'lecciones secuenciales'} para este curso.`}
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
              <LessonOutline
                lecciones={temario}
                cursoId={id}
                conEstados={conEstados}
              />
            )}

            <div className="mt-8 border-t border-outline pt-6 text-center">
              <div className="inline-flex justify-center">
                {renderInscripcionCta()}
              </div>
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
