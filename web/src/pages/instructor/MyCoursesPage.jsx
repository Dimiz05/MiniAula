import { useState } from 'react';
import { Link } from 'react-router';
import Alert from '../../components/Alert.jsx';
import Button from '../../components/Button.jsx';
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

export default function MyCoursesPage() {
  const { data, loading, error, refetch } = useFetch(listarCursosPropios);
  const [pending, setPending] = useState(null);
  const [notice, setNotice] = useState(null);

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
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary">Mis cursos</h1>
          <p className="mt-2 text-sm text-on-surface-variant">Administra los cursos que has creado.</p>
        </div>
        <Link to="nuevo" className="rounded-[10px] bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shadow-card hover:bg-primary-dark">
          Crear curso
        </Link>
      </header>

      {notice && <Alert variant={notice.variant}>{notice.message}</Alert>}
      {loading && <p role="status" className="text-on-surface-variant">Cargando tus cursos…</p>}
      {error && (
        <Alert variant="error" title="No se pudieron cargar tus cursos">
          <p>{error.message}</p>
          <Button variant="secondary" className="mt-2" onClick={refetch}>Reintentar</Button>
        </Alert>
      )}
      {!loading && data?.cursos.length === 0 && (
        <Alert title="Todavía no tienes cursos">Usa «Crear curso» para guardar tu primer borrador.</Alert>
      )}
      {!loading && data?.cursos.length > 0 && (
        <ul className="grid gap-4 md:grid-cols-2">
          {data.cursos.map((curso) => {
            const actions = accionesCurso(curso);
            const disabled = pending !== null;
            const busy = (action) => pending?.id === curso.id && pending.action === action;
            return (
              <li key={curso.id} className="flex min-w-0 flex-col gap-4 rounded-xl border border-outline bg-surface p-5 shadow-card">
                <div>
                  <span className="inline-block rounded-full bg-surface-variant px-3 py-1 text-xs font-semibold text-secondary">
                    {estados[curso.estado]}
                  </span>
                  <h2 className="mt-2 break-words text-xl font-bold text-secondary">{curso.titulo}</h2>
                  <p className="mt-1 line-clamp-2 break-words text-sm text-on-surface-variant">{curso.descripcion}</p>
                </div>
                <p className="break-words text-sm text-on-surface-variant">
                  {curso.categoria} · {niveles[curso.nivel]} · Lecciones: {curso.totalLecciones} · Inscritos: {curso.totalInscritos}
                </p>
                <div className="mt-auto flex flex-wrap items-center gap-2">
                  <Link to={`${curso.id}/editar`} className="rounded-[10px] border border-outline px-4 py-2.5 text-sm font-semibold text-secondary hover:bg-surface-variant">
                    Editar
                  </Link>
                  {curso.estado === 'borrador' && (
                    <Button disabled={disabled || !actions.publicar} loading={busy('publicar')} onClick={() => run('publicar', curso)}>
                      Publicar
                    </Button>
                  )}
                  {actions.archivar && (
                    <Button variant="secondary" disabled={disabled} loading={busy('archivar')} onClick={() => run('archivar', curso)}>
                      Archivar
                    </Button>
                  )}
                  {actions.eliminar && (
                    <Button variant="danger" disabled={disabled} loading={busy('eliminar')} onClick={() => run('eliminar', curso)}>
                      Eliminar
                    </Button>
                  )}
                </div>
                {curso.estado === 'borrador' && !actions.publicar && (
                  <p className="text-xs text-on-surface-variant">El curso necesita al menos una lección para publicarse.</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
