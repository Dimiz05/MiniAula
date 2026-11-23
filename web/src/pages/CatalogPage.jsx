import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import Alert from '../components/Alert.jsx';
import CourseCover from '../components/CourseCover.jsx';
import Icon from '../components/Icon.jsx';
import { listarCursos } from '../services/curso.service.js';
import { getInitials } from '../utils/initials.js';

const CATEGORIAS = ['Todas', 'Programación', 'Diseño', 'Idiomas'];
const LIMITE = 12;

const niveles = {
  basico: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
};

function nivelLabel(nivel) {
  return niveles[nivel] ?? nivel ?? 'Sin nivel';
}

function pageNumbers(current, totalPages) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, current - 1, current, current + 1]);
  return [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
}

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
  const total = paginacion?.total ?? cursos.length;
  const limite = paginacion?.limite ?? LIMITE;
  const desde = total === 0 ? 0 : (page - 1) * limite + 1;
  const hasta = Math.min(page * limite, total);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="mb-2 text-headline-lg-mobile text-secondary sm:text-headline-lg">
          Catálogo de cursos
        </h1>
        <p className="max-w-2xl text-body-md text-on-surface-variant">
          Explora cursos cortos diseñados por instructores expertos y potencia
          tus habilidades.
        </p>
      </header>

      <section className="space-y-4 rounded-panel border border-outline bg-surface p-4 shadow-card sm:p-5">
        <form className="flex flex-col gap-3 md:flex-row md:items-center" onSubmit={handleSearch}>
          <label className="relative flex-1">
            <span className="sr-only">Buscar cursos</span>
            <Icon
              name="search"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant"
            />
            <input
              type="search"
              name="q"
              id="catalog-search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Busca por título o tema"
              className="w-full rounded-control border border-outline bg-background py-2.5 pl-11 pr-4 text-body-md text-secondary placeholder:text-on-surface-variant/70 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </label>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-control bg-primary px-4 py-2.5 text-label-md font-semibold text-on-primary shadow-card transition-colors hover:bg-primary-dark"
          >
            <Icon name="search" className="text-[18px]" />
            Buscar
          </button>
        </form>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {CATEGORIAS.map((item) => {
            const active =
              (item === 'Todas' && categoria === '') || categoria === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => handleCategory(item)}
                className={`shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-label-sm transition-colors ${
                  active
                    ? 'bg-primary font-semibold text-on-primary'
                    : 'bg-surface-variant text-secondary hover:bg-outline-light'
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </section>

      {loading && (
        <section className="rounded-panel border border-outline bg-surface p-8 text-center shadow-card">
          <p className="text-body-md text-on-surface-variant">Cargando cursos…</p>
        </section>
      )}

      {!loading && error && (
        <Alert variant="error" title="No pudimos cargar el catálogo">
          {error.message}
        </Alert>
      )}

      {!loading && !error && cursos.length === 0 && (
        <section className="rounded-panel border border-outline bg-surface p-8 text-center shadow-card">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon name="auto_stories" className="text-[28px]" />
          </span>
          <h2 className="mt-4 text-headline-sm text-secondary">
            No encontramos cursos
          </h2>
          <p className="mx-auto mt-2 max-w-md text-body-md text-on-surface-variant">
            Prueba con otra búsqueda o categoría, o vuelve más tarde.
          </p>
        </section>
      )}

      {!loading && !error && cursos.length > 0 && (
        <>
          <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cursos.map((curso) => (
              <article
                key={curso.id}
                className="flex flex-col justify-between overflow-hidden rounded-panel border border-outline bg-surface shadow-card transition-all hover:border-primary/40 hover:shadow-hover"
              >
                <div>
                  <CourseCover
                    portada={curso.portada}
                    alt={`Portada de ${curso.titulo}`}
                    className="h-36"
                  >
                    <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-label-sm font-semibold text-primary shadow-sm">
                      {curso.categoria ?? 'Sin categoría'}
                    </span>
                    <span className="absolute right-3 top-3 rounded-full bg-secondary px-2.5 py-1 text-label-sm text-white">
                      {nivelLabel(curso.nivel)}
                    </span>
                  </CourseCover>

                  <div className="p-5">
                    <h2 className="mb-2 text-balance text-headline-sm leading-snug text-secondary">
                      {curso.titulo}
                    </h2>
                    {curso.descripcion && (
                      <p className="mb-4 line-clamp-2 text-body-md text-on-surface-variant">
                        {curso.descripcion}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-2 border-t border-outline-light pt-2 text-label-sm text-on-surface-variant">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-label-sm font-bold text-primary">
                          {getInitials(curso.instructor?.nombre)}
                        </span>
                        <span className="truncate font-medium text-secondary">
                          {curso.instructor?.nombre ?? 'Sin instructor'}
                        </span>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1">
                        <Icon name="play_lesson" className="text-[16px] text-primary" />
                        Temario secuencial
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <Link
                    to={`/catalog/${curso.id}`}
                    className="flex w-full items-center justify-center gap-2 rounded-control bg-primary px-4 py-2.5 text-label-md text-on-primary transition-opacity hover:opacity-95"
                  >
                    Ver curso
                    <Icon name="arrow_forward" className="text-[18px]" />
                  </Link>
                </div>
              </article>
            ))}
          </section>

          {totalPages > 1 && (
            <nav
              className="flex flex-col gap-3 border-t border-outline pt-5 sm:flex-row sm:items-center sm:justify-between"
              aria-label="Paginación"
            >
              <p className="text-body-sm text-on-surface-variant">
                Mostrando{' '}
                <span className="font-semibold text-secondary">
                  {desde}-{hasta}
                </span>{' '}
                de <span className="font-semibold text-secondary">{total}</span>{' '}
                cursos disponibles
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="inline-flex items-center gap-1 rounded-control border border-outline bg-surface px-3 py-1.5 text-label-sm text-secondary hover:bg-surface-variant disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Icon name="chevron_left" className="text-[16px]" />
                  Anterior
                </button>

                {pageNumbers(page, totalPages).map((number, index, list) => {
                  const previous = list[index - 1];
                  return (
                    <span key={number} className="flex items-center gap-2">
                      {previous && number - previous > 1 && (
                        <span className="text-label-sm text-on-surface-variant">…</span>
                      )}
                      <button
                        type="button"
                        onClick={() => handlePage(number)}
                        aria-current={number === page ? 'page' : undefined}
                        className={`flex h-8 w-8 items-center justify-center rounded-control text-label-sm ${
                          number === page
                            ? 'bg-primary font-semibold text-on-primary'
                            : 'border border-outline bg-surface text-secondary hover:bg-surface-variant'
                        }`}
                      >
                        {number}
                      </button>
                    </span>
                  );
                })}

                <button
                  type="button"
                  onClick={() => handlePage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="inline-flex items-center gap-1 rounded-control border border-outline bg-surface px-3 py-1.5 text-label-sm text-secondary hover:bg-surface-variant disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Siguiente
                  <Icon name="chevron_right" className="text-[16px]" />
                </button>
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
