import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import Alert from '../components/Alert.jsx';
import Icon from '../components/Icon.jsx';
import { listarCursos } from '../services/curso.service.js';

const CATEGORIAS = ['Todas', 'Programación', 'Diseño', 'Idiomas'];
const LIMITE = 12;

export default function CatalogPage() {
  const [cursos, setCursos] = useState([]);
  const [paginacion, setPaginacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(null);

    listarCursos({
      q: search || undefined,
      categoria: categoria || undefined,
      page,
      limit: LIMITE,
    })
      .then((data) => {
        if (!active) {
          return;
        }
        setCursos(Array.isArray(data?.cursos) ? data.cursos : []);
        setPaginacion(data?.paginacion ?? null);
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
  }, [search, categoria, page]);

  function handleSearch(event) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function handleCategory(nextCategory) {
    setPage(1);
    setCategoria(nextCategory === 'Todas' ? '' : nextCategory);
  }

  function handlePage(nextPage) {
    setPage(nextPage);
  }

  const totalPages = paginacion?.totalPaginas ?? 0;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
          Explora
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-secondary sm:text-4xl">
          Catálogo de cursos
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
          Encuentra cursos estructurados por categoría y nivel, con lecciones
          guiadas y evaluaciones prácticas.
        </p>
      </header>

      <section className="rounded-card border border-outline bg-surface p-4 shadow-card sm:p-6">
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={handleSearch}
        >
          <label className="relative flex-1">
            <span className="sr-only">Buscar cursos</span>
            <Icon
              name="search"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant"
            />
            <input
              type="search"
              name="q"
              id="catalog-search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Buscar por título"
              className="w-full rounded-[10px] border border-outline bg-surface py-2.5 pl-10 pr-3 text-sm text-secondary placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </label>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shadow-card transition-colors hover:bg-primary-dark"
          >
            <Icon name="search" className="text-[18px]" />
            Buscar
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {CATEGORIAS.map((item) => {
            const active =
              (item === 'Todas' && categoria === '') || categoria === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => handleCategory(item)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? 'border-primary bg-primary text-on-primary'
                    : 'border-outline bg-surface text-on-surface-variant hover:bg-surface-variant hover:text-secondary'
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </section>

      {loading && (
        <section className="rounded-card border border-outline bg-surface p-8 text-center shadow-card">
          <p className="text-sm text-on-surface-variant">Cargando cursos…</p>
        </section>
      )}

      {!loading && error && (
        <Alert variant="error" title="No pudimos cargar el catálogo">
          {error.message}
        </Alert>
      )}

      {!loading && !error && cursos.length === 0 && (
        <section className="rounded-card border border-outline bg-surface p-8 text-center shadow-card">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/5 text-primary">
            <Icon name="auto_stories" className="text-[28px]" />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-secondary">
            No encontramos cursos
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-on-surface-variant">
            Prueba con otra búsqueda o categoría, o vuelve más tarde.
          </p>
        </section>
      )}

      {!loading && !error && cursos.length > 0 && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cursos.map((curso) => (
              <article
                key={curso.id}
                className="flex flex-col rounded-card border border-outline bg-surface p-5 shadow-card transition-shadow hover:shadow-hover"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-primary/5 text-primary">
                    <Icon name="auto_stories" className="text-[22px]" />
                  </span>
                  <span className="rounded-full bg-background px-2.5 py-1 text-[11px] font-semibold text-on-surface-variant">
                    {curso.categoria ?? 'Sin categoría'}
                  </span>
                </div>

                <h2 className="mt-4 text-base font-semibold text-secondary">
                  {curso.titulo}
                </h2>
                {curso.descripcion && (
                  <p className="mt-1.5 line-clamp-3 text-sm leading-6 text-on-surface-variant">
                    {curso.descripcion}
                  </p>
                )}

                <dl className="mt-4 space-y-1 text-xs text-on-surface-variant">
                  <div className="flex items-center justify-between gap-2">
                    <dt>Instructor</dt>
                    <dd className="font-medium text-secondary">
                      {curso.instructor?.nombre ?? 'Sin instructor'}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt>Nivel</dt>
                    <dd className="font-medium text-secondary">
                      {curso.nivel === 'basico'
                        ? 'Básico'
                        : curso.nivel === 'intermedio'
                          ? 'Intermedio'
                          : curso.nivel === 'avanzado'
                            ? 'Avanzado'
                            : curso.nivel ?? 'Sin nivel'}
                    </dd>
                  </div>
                </dl>

                <Link
                  to={`/catalog/${curso.id}`}
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shadow-card transition-colors hover:bg-primary-dark"
                >
                  Ver curso
                  <Icon name="arrow_forward" className="text-[18px]" />
                </Link>
              </article>
            ))}
          </section>

          {totalPages > 1 && (
            <nav
              className="flex items-center justify-center gap-2"
              aria-label="Paginación"
            >
              <button
                type="button"
                onClick={() => handlePage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-outline bg-surface px-3 py-2 text-sm font-medium text-secondary disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-sm text-on-surface-variant">
                Página {page} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => handlePage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-outline bg-surface px-3 py-2 text-sm font-medium text-secondary disabled:cursor-not-allowed disabled:opacity-50"
              >
                Siguiente
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}