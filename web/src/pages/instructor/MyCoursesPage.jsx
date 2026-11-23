import { useState } from 'react';
import { Link } from 'react-router';
import Alert from '../../components/Alert.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { archivarCurso, eliminarCurso, listarCursosPropios, publicarCurso } from '../../services/curso.service.js';
import { accionesCurso, estados, niveles } from './courseForm.js';

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
  const [pending, setPending] = useState(null);
  const [notice, setNotice] = useState(null);
  const [filtro, setFiltro] = useState('todos');

  const cursos = data?.cursos ?? [];
  const publicados = cursos.filter((curso) => curso.estado === 'publicado').length;
  const borradores = cursos.filter((curso) => curso.estado === 'borrador').length;
  const archivados = cursos.filter((curso) => curso.estado === 'archivado').length;
  const inscritos = cursos.reduce((total, curso) => total + (curso.totalInscritos ?? 0), 0);
  const visibles = filtro === 'todos' ? cursos : cursos.filter((curso) => curso.estado === filtro);

  function contar(valor) {
    if (valor === 'todos') return cursos.length;
    return cursos.filter((curso) => curso.estado === valor).length;
  }

  async function run(action, curso) {
    const operation = operations[action];
    if (pending || (operation.confirm && !window.confirm(operation.confirm(curso.titulo)))) return;

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
        <Link
          to="nuevo"
          className="inline-flex shrink-0 items-center gap-2 rounded-control bg-primary px-5 py-2.5 text-label-md font-semibold text-on-primary shadow-card transition-opacity hover:opacity-95"
        >
          <Icon name="add_box" className="text-[20px]" />
          Crear curso
        </Link>
      </header>

      {notice && <Alert variant={notice.variant}>{notice.message}</Alert>}
      {loading && <p role="status" className="text-body-md text-on-surface-variant">Cargando tus cursos…</p>}
      {error && (
        <Alert variant="error" title="No se pudieron cargar tus cursos">
          <p>{error.message}</p>
          <Button variant="secondary" className="mt-2" onClick={refetch}>Reintentar</Button>
        </Alert>
      )}

      {!loading && !error && cursos.length > 0 && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <article className="rounded-card border border-outline bg-surface p-5 shadow-card">
            <div className="mb-2 flex items-center justify-between text-on-surface-variant">
              <span className="text-label-sm">Total de cursos</span>
              <Icon name="auto_stories" className="text-[22px] text-primary" />
            </div>
            <p className="text-headline-md tabular-nums text-secondary">{cursos.length}</p>
            <span className="text-label-sm text-success">
              {publicados} publicados · {borradores} borradores
            </span>
          </article>

          <article className="rounded-card border border-outline bg-surface p-5 shadow-card">
            <div className="mb-2 flex items-center justify-between text-on-surface-variant">
              <span className="text-label-sm">Estudiantes inscritos</span>
              <Icon name="group" className="text-[22px] text-secondary" />
            </div>
            <p className="text-headline-md tabular-nums text-secondary">{inscritos}</p>
            <span className="text-label-sm font-medium text-primary">En todos tus cursos</span>
          </article>

          <article className="rounded-card border border-outline bg-surface p-5 shadow-card">
            <div className="mb-2 flex items-center justify-between text-on-surface-variant">
              <span className="text-label-sm">Cursos archivados</span>
              <Icon name="inventory_2" className="text-[22px] text-on-surface-variant" />
            </div>
            <p className="text-headline-md tabular-nums text-secondary">{archivados}</p>
            <span className="text-label-sm text-on-surface-variant">Fuera del catálogo</span>
          </article>

          <article className="rounded-card border border-outline bg-surface p-5 shadow-card">
            <div className="mb-2 flex items-center justify-between text-on-surface-variant">
              <span className="text-label-sm">Borradores</span>
              <Icon name="edit_note" className="text-[22px] text-warning" />
            </div>
            <p className="text-headline-md tabular-nums text-secondary">{borradores}</p>
            <span className="text-label-sm text-on-surface-variant">En preparación</span>
          </article>
        </div>
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
            <p className="rounded-panel border border-dashed border-outline bg-surface p-6 text-center text-body-md text-on-surface-variant">
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
                    className={`flex flex-col justify-between overflow-hidden rounded-panel border border-outline bg-surface shadow-card transition-shadow hover:shadow-hover ${
                      curso.estado === 'archivado' ? 'opacity-85' : ''
                    }`}
                  >
                    <div>
                      <div className={`relative h-32 overflow-hidden bg-gradient-to-br ${style.band}`}>
                        <Icon
                          name={curso.estado === 'archivado' ? 'inventory_2' : 'auto_stories'}
                          className="absolute right-4 top-4 text-[56px] text-white/15"
                        />
                        <span className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-label-sm font-semibold shadow-sm ${style.badge}`}>
                          <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                          {estados[curso.estado] ?? curso.estado}
                        </span>
                      </div>

                      <div className="p-5">
                        <h3 className="mb-2 break-words text-balance text-headline-sm leading-snug text-secondary">
                          {curso.titulo}
                        </h3>
                        <p className="mb-3 line-clamp-2 break-words text-body-sm text-on-surface-variant">
                          {curso.descripcion}
                        </p>

                        <dl className="my-3 grid grid-cols-2 gap-2 border-y border-outline-light py-2 text-label-sm">
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
                          <div>
                            <dt className="text-on-surface-variant">Inscritos:</dt>
                            <dd className="font-semibold tabular-nums text-secondary">{curso.totalInscritos}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 p-5 pt-0">
                      <Link
                        to={`${curso.id}/editar`}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-control border border-outline bg-surface px-3 py-2 text-label-md text-secondary hover:bg-surface-variant"
                      >
                        <Icon name="edit" className="text-[18px]" />
                        Editar
                      </Link>
                      {curso.estado === 'borrador' && (
                        <Button
                          disabled={disabled || !actions.publicar}
                          loading={busy('publicar')}
                          className="flex-1 px-3 py-2 text-label-md"
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
                          className="px-3 py-2 text-label-md"
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
                          className="px-3 py-2 text-label-md"
                          onClick={() => run('eliminar', curso)}
                        >
                          Eliminar
                        </Button>
                      )}
                    </div>

                    {curso.estado === 'borrador' && !actions.publicar && (
                      <p className="px-5 pb-5 text-label-sm text-on-surface-variant">
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
    </section>
  );
}
