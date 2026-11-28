import { useState } from 'react';
import { Link } from 'react-router';
import Alert from '../../components/Alert.jsx';
import Button from '../../components/Button.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import CourseCover from '../../components/CourseCover.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import {
  archivarCurso,
  eliminarCurso,
  listarCursosPropios,
  obtenerMetricasPanel,
  publicarCurso,
} from '../../services/curso.service.js';
import { accionesCurso, estados, niveles } from './courseForm.js';
import { ResumenMetricas } from './InstructorMetrics.jsx';

const operations = {
  publicar: { request: publicarCurso, success: 'Curso publicado.' },
  archivar: {
    request: archivarCurso,
    confirm: (titulo) => `¿Archivar «${titulo}»? Dejará de aparecer en el catálogo.`,
    success: 'Curso archivado.',
  },
  eliminar: {
    request: eliminarCurso,
    confirm: (titulo) => `¿Eliminar «${titulo}»? Esta acción no se puede deshacer.`,
    success: 'Curso eliminado.',
  },
};

const estadoStyles = {
  publicado: {
    band: 'from-primary to-secondary',
    badge: 'bg-success-light text-success',
    dot: 'bg-success',
  },
  borrador: {
    band: 'from-warning to-secondary',
    badge: 'bg-warning-light text-secondary',
    dot: 'bg-warning',
  },
  archivado: {
    band: 'from-on-surface-variant to-secondary',
    badge: 'bg-surface-variant text-on-surface-variant',
    dot: 'bg-on-surface-variant',
  },
};

const filtros = [
  { value: 'todos', label: 'Todos' },
  { value: 'publicado', label: 'Publicados' },
  { value: 'borrador', label: 'Borradores' },
  { value: 'archivado', label: 'Archivados' },
];

export default function MyCoursesPage() {
  const { data, loading, error, refetch } = useFetch(listarCursosPropios);
  const metricas = useFetch(obtenerMetricasPanel);
  const [pending, setPending] = useState(null);
  const [notice, setNotice] = useState(null);
  const [filtro, setFiltro] = useState('todos');
  const [confirmacion, setConfirmacion] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const cursos = data?.cursos ?? [];
  const publicados = cursos.filter((curso) => curso.estado === 'publicado').length;
  const borradores = cursos.filter((curso) => curso.estado === 'borrador').length;
  const visibles = filtro === 'todos' ? cursos : cursos.filter((curso) => curso.estado === filtro);

  function contar(valor) {
    if (valor === 'todos') return cursos.length;
    return cursos.filter((curso) => curso.estado === valor).length;
  }

  function run(action, curso) {
    const operation = operations[action];
    if (pending) return;
    if (operation.confirm) {
      setConfirmacion({ action, curso });
      return;
    }
    ejecutar(action, curso);
  }

  async function ejecutar(action, curso) {
    const operation = operations[action];

    setPending({ action, id: curso.id });
    setNotice(null);
    try {
      await operation.request(curso.id);
      setNotice({ variant: 'success', message: operation.success });
    } catch (err) {
      setNotice({ variant: 'error', message: err.message });
    } finally {
      await refetch();
      setPending(null);
    }
  }

  async function confirmar() {
    if (!confirmacion || confirmBusy) return;

    const { action, curso } = confirmacion;
    setConfirmBusy(true);
    await ejecutar(action, curso);
    setConfirmBusy(false);
    setConfirmacion(null);
  }

  return (
    <section className="space-y-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="mb-1 text-headline-lg-mobile text-secondary sm:text-headline-lg">
            Bienvenido a tu espacio de enseñanza
          </h1>
          <p className="text-body-md text-on-surface-variant">
            Supervisa el desempeño de tus estudiantes, gestiona tus temarios y
            publica nuevos contenidos.
          </p>
        </div>
        <Button
          as={Link}
          to="nuevo"
          icon="add_box"
          iconPosition="start"
          className="shrink-0"
        >
          Crear curso
        </Button>
      </header>

      {notice && <Alert variant={notice.variant}>{notice.message}</Alert>}
      {metricas.loading && (
        <p role="status" className="text-body-md text-on-surface-variant">
          Cargando métricas del panel…
        </p>
      )}
      {metricas.error && (
        <Alert variant="error" title="No se pudieron cargar las métricas">
          <p>{metricas.error.message}</p>
          <Button variant="secondary" className="mt-2" onClick={metricas.refetch}>
            Reintentar
          </Button>
        </Alert>
      )}
      {!metricas.loading && !metricas.error && (metricas.data?.cursos?.length ?? 0) > 0 && (
        <ResumenMetricas
          resumen={metricas.data.resumen}
          publicados={publicados}
          borradores={borradores}
        />
      )}
      {!loading && !error && !metricas.loading && !metricas.error && cursos.length > 0
        && (metricas.data?.cursos?.length ?? 0) === 0 && (
          <Alert title="Sin métricas disponibles">
            Aún no hay datos de rendimiento para tus cursos.
          </Alert>
        )}

      {loading && <p role="status" className="text-body-md text-on-surface-variant">Cargando tus cursos…</p>}
      {error && (
        <Alert variant="error" title="No se pudieron cargar tus cursos">
          <p>{error.message}</p>
          <Button variant="secondary" className="mt-2" onClick={refetch}>Reintentar</Button>
        </Alert>
      )}

      {!loading && !error && cursos.length === 0 && (
        <Alert title="Todavía no tienes cursos">Usa «Crear curso» para guardar tu primer borrador.</Alert>
      )}

      {!loading && !error && cursos.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-headline-sm text-secondary">Mis cursos administrados</h2>
              <p className="text-body-sm text-on-surface-variant">
                Gestiona los estados de tus cursos y revisa su información pública.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por estado">
              {filtros.map((item) => {
                const active = filtro === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setFiltro(item.value)}
                    aria-pressed={active}
                    className={`rounded-full px-3 py-1.5 text-label-sm transition-colors ${
                      active
                        ? 'bg-primary font-semibold text-on-primary'
                        : 'border border-outline bg-surface text-secondary hover:bg-surface-variant'
                    }`}
                  >
                    {item.label} ({contar(item.value)})
                  </button>
                );
              })}
            </div>
          </div>

          {visibles.length === 0 ? (
            <p className="rounded-panel border border-dashed border-outline bg-surface p-6 text-center text-body-md text-on-surface-variant shadow-card">
              No tienes cursos en este estado.
            </p>
          ) : (
            <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {visibles.map((curso) => {
                const actions = accionesCurso(curso);
                const disabled = pending !== null;
                const busy = (action) => pending?.id === curso.id && pending.action === action;
                const style = estadoStyles[curso.estado] ?? estadoStyles.borrador;

                return (
                  <li
                    key={curso.id}
                    className={`flex flex-col justify-between overflow-hidden rounded-card border border-outline bg-surface shadow-card transition-shadow hover:shadow-hover ${
                      curso.estado === 'archivado' ? 'opacity-85' : ''
                    }`}
                  >
                    <div>
                      <CourseCover
                        portada={curso.portada}
                        alt={`Portada de ${curso.titulo}`}
                        icon={curso.estado === 'archivado' ? 'inventory_2' : 'auto_stories'}
                        className="h-32"
                        iconClassName="absolute right-4 top-4 text-[56px] text-white/15"
                        gradientClassName={`bg-gradient-to-br ${style.band}`}
                      >
                        <span className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-label-sm font-semibold shadow-sm ${style.badge}`}>
                          <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                          {estados[curso.estado] ?? curso.estado}
                        </span>
                      </CourseCover>

                      <div className="p-4">
                        <h3 className="mb-2 break-words text-balance text-headline-sm leading-snug text-secondary">
                          {curso.titulo}
                        </h3>
                        <p className="mb-3 line-clamp-2 break-words text-body-sm text-on-surface-variant">
                          {curso.descripcion}
                        </p>

                        <dl className="my-3 grid grid-cols-2 gap-2 border-y border-outline-light py-2 text-label-sm sm:grid-cols-3">
                          <div>
                            <dt className="text-on-surface-variant">Categoría:</dt>
                            <dd className="font-semibold text-secondary">{curso.categoria}</dd>
                          </div>
                          <div>
                            <dt className="text-on-surface-variant">Nivel:</dt>
                            <dd className="font-semibold text-secondary">{niveles[curso.nivel]}</dd>
                          </div>
                          <div>
                            <dt className="text-on-surface-variant">Lecciones:</dt>
                            <dd className="font-semibold tabular-nums text-secondary">{curso.totalLecciones}</dd>
                          </div>
                        </dl>

                        <Button
                          as={Link}
                          to={`/instructor/analiticas?curso=${curso.id}`}
                          icon="insights"
                          iconPosition="start"
                          className="mt-4 w-full"
                        >
                          Ver métricas del curso
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 p-4 pt-0">
                      <Button
                        as={Link}
                        to={`${curso.id}/editar`}
                        variant="secondary"
                        icon="edit"
                        className="flex-1"
                      >
                        Editar
                      </Button>
                      {curso.estado === 'borrador' && (
                        <Button
                          disabled={disabled || !actions.publicar}
                          loading={busy('publicar')}
                          className="flex-1"
                          onClick={() => run('publicar', curso)}
                        >
                          Publicar
                        </Button>
                      )}
                      {actions.archivar && (
                        <Button
                          variant="secondary"
                          disabled={disabled}
                          loading={busy('archivar')}
                          className="flex-1"
                          onClick={() => run('archivar', curso)}
                        >
                          Archivar
                        </Button>
                      )}
                      {actions.eliminar && (
                        <Button
                          variant="danger"
                          disabled={disabled}
                          loading={busy('eliminar')}
                          className="flex-1"
                          onClick={() => run('eliminar', curso)}
                        >
                          Eliminar
                        </Button>
                      )}
                    </div>

                    {curso.estado === 'borrador' && !actions.publicar && (
                      <p className="px-4 pb-4 text-label-sm text-on-surface-variant">
                        El curso necesita al menos una lección para publicarse.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmacion)}
        title={confirmacion ? operations[confirmacion.action].confirm(confirmacion.curso.titulo) : ''}
        description={
          confirmacion?.action === 'eliminar'
            ? 'También se eliminarán sus lecciones, preguntas y el progreso asociado.'
            : undefined
        }
        confirmLabel={confirmacion?.action === 'archivar' ? 'Archivar curso' : 'Eliminar curso'}
        busy={confirmBusy}
        onCancel={() => {
          if (!confirmBusy) setConfirmacion(null);
        }}
        onConfirm={confirmar}
      />
    </section>
  );
}
