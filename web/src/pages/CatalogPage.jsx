import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import Alert from '../components/Alert.jsx';
import Button from '../components/Button.jsx';
import CourseCover from '../components/CourseCover.jsx';
import Icon from '../components/Icon.jsx';
import { listarCursos } from '../services/curso.service.js';
import {
  construirParamsCatalogo,
  paginaDentroDeRango,
} from '../utils/catalogParams.js';
import { getInitials } from '../utils/initials.js';

const LIMITE = 6;

const CATEGORIAS = [
  { value: '', label: 'Todas' },
  { value: 'Programación', label: 'Programación' },
  { value: 'Diseño', label: 'Diseño' },
  { value: 'Idiomas', label: 'Idiomas' },
];

const NIVELES = {
  basico: { label: 'Principiante', dot: 'bg-success' },
  intermedio: { label: 'Intermedio', dot: 'bg-warning' },
  avanzado: { label: 'Avanzado', dot: 'bg-error' },
};

const ICONO_CATEGORIA = {
  Programación: 'code',
  Diseño: 'palette',
  Idiomas: 'translate',
};

function nivelInfo(nivel) {
  return NIVELES[nivel] ?? { label: nivel ?? 'Sin nivel', dot: 'bg-on-surface-variant/50' };
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

function parsePage(value) {
  const parsed = Number.parseInt(value ?? '1', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

const chipActive =
  'inline-flex min-h-10 items-center gap-1.5 rounded-full border border-primary bg-primary px-3.5 py-1.5 text-label-sm font-semibold text-on-primary transition-colors duration-200';
const chipIdle =
  'inline-flex min-h-10 items-center gap-1.5 rounded-full border border-outline bg-surface px-3.5 py-1.5 text-label-sm text-secondary transition-colors duration-200 hover:border-primary/30 hover:bg-primary/[0.06] hover:text-primary';

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('q') ?? '';
  const categoria = searchParams.get('categoria') ?? '';
  const page = parsePage(searchParams.get('page'));

  const [cursos, setCursos] = useState([]);
  const [paginacion, setPaginacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState(search);
  const [retryKey, setRetryKey] = useState(0);
  const searchRef = useRef(null);
  const resultsHeadingRef = useRef(null);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

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
  }, [search, categoria, page, retryKey]);

  const totalPages = paginacion?.totalPaginas ?? 0;
  const total = paginacion?.total ?? cursos.length;
  const limite = paginacion?.limite ?? LIMITE;

  // A shared URL can point past the last page once the results are known.
  useEffect(() => {
    if (!loading && !error && totalPages > 0 && page > totalPages) {
      const params = construirParamsCatalogo({
        q: search,
        categoria,
        page: paginaDentroDeRango(page, totalPages),
      });
      setSearchParams(params, { replace: true });
    }
  }, [loading, error, totalPages, page, search, categoria, setSearchParams]);

  const desde = total === 0 ? 0 : (page - 1) * limite + 1;
  const hasta = Math.min(page * limite, total);
  const hayFiltros = Boolean(search || categoria);
  const categoriaActiva = CATEGORIAS.find((item) => item.value === categoria);

  function actualizarParams(next, { replace = false } = {}) {
    setSearchParams(construirParamsCatalogo(next), { replace });
  }

  function actualizarFiltros({ q = search, categoria: nextCategoria = categoria, page: nextPage = 1 }) {
    actualizarParams({ q, categoria: nextCategoria, page: nextPage });
  }

  function handleSearch(event) {
    event.preventDefault();
    actualizarFiltros({ q: searchInput.trim() });
  }

  function handleCategory(value) {
    const nextCategoria = value === categoria ? '' : value;
    actualizarFiltros({ categoria: nextCategoria });
  }

  function handlePage(nextPage) {
    if (nextPage === page) {
      return;
    }

    // Push a history entry so Back/Forward restore the previous page along
    // with the active search and category filters.
    actualizarParams({ q: search, categoria, page: nextPage });

    if (typeof window === 'undefined') {
      return;
    }

    window.requestAnimationFrame(() => {
      resultsHeadingRef.current?.focus({ preventScroll: true });
      const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      resultsHeadingRef.current?.scrollIntoView({
        behavior: reducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    });
  }

  function limpiarFiltros() {
    actualizarParams({});
    searchRef.current?.focus();
  }

  function quitarBusqueda() {
    actualizarFiltros({ q: '' });
    searchRef.current?.focus();
  }

  function quitarCategoria() {
    actualizarFiltros({ categoria: '' });
  }

  function limpiarCampoBusqueda() {
    setSearchInput('');
    if (search) {
      actualizarFiltros({ q: '' });
    }
    searchRef.current?.focus();
  }

  function reintentar() {
    setRetryKey((value) => value + 1);
  }

  const nivelesCatalogo = Object.entries(NIVELES);

  return (
    <div className="space-y-6 sm:space-y-7">
      <header className="relative isolate overflow-hidden rounded-panel border border-paper-line bg-surface shadow-card">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <span className="absolute -right-20 -top-24 h-60 w-60 rounded-full border border-primary/10" />
          <span className="absolute -right-6 -top-12 h-44 w-44 rounded-full border border-primary/10" />
          <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </div>

        <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-10 lg:p-8">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Catálogo abierto
            </span>
            <h1 className="mt-3 text-headline-lg-mobile text-secondary sm:text-display-lg">
              Catálogo de cursos
            </h1>
            <p className="mt-3 max-w-xl text-body-md leading-6 text-on-surface-variant text-pretty sm:text-body-lg sm:leading-7">
              Cursos cortos creados por instructores. Filtra por categoría,
              revisa el nivel y elige tu próxima ruta de aprendizaje.
            </p>
          </div>

          <div className="rounded-card border border-outline-light bg-background/80 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
              Niveles del catálogo
            </p>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
              {nivelesCatalogo.map(([key, info]) => (
                <li
                  key={key}
                  className="inline-flex items-center gap-1.5 text-body-sm text-on-surface-variant"
                >
                  <span
                    aria-hidden="true"
                    className={`h-1.5 w-1.5 rounded-full ${info.dot}`}
                  />
                  {info.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </header>

      <section
        aria-labelledby="catalog-filters-heading"
        className="rounded-panel border border-outline bg-surface p-4 shadow-card sm:p-5"
      >
        <h2 id="catalog-filters-heading" className="sr-only">
          Buscar y filtrar cursos
        </h2>

        <form role="search" onSubmit={handleSearch} className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="min-w-0 flex-1">
              <label
                htmlFor="catalog-search"
                className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant"
              >
                Buscar por título
              </label>
              <div className="relative mt-2">
                <Icon
                  name="search"
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant"
                />
                <input
                  ref={searchRef}
                  type="search"
                  name="q"
                  id="catalog-search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Ej. React, PostgreSQL, inglés"
                  autoComplete="off"
                  className="h-11 w-full rounded-control border border-outline bg-background pl-11 pr-11 text-body-md text-secondary placeholder:text-on-surface-variant/70 transition-colors duration-200 [&::-ms-clear]:hidden [&::-webkit-search-cancel-button]:appearance-none focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={limpiarCampoBusqueda}
                    aria-label="Limpiar búsqueda"
                    className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-on-surface-variant transition-colors duration-200 hover:bg-surface-variant hover:text-secondary"
                  >
                    <Icon name="close" className="text-[18px]" />
                  </button>
                )}
              </div>
            </div>

            <Button type="submit" icon="search" iconPosition="start" className="shrink-0">
              Buscar
            </Button>
          </div>
        </form>

        <div className="mt-4 border-t border-outline-light pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              id="catalog-categories-label"
              className="text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant"
            >
              Categorías
            </span>
            {hayFiltros && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="inline-flex items-center gap-1 rounded-control px-1.5 py-1 text-label-sm font-semibold text-primary transition-colors duration-200 hover:bg-primary/[0.08]"
              >
                <Icon name="filter_list_off" className="text-[16px]" />
                Limpiar filtros
              </button>
            )}
          </div>

          <div
            role="group"
            aria-labelledby="catalog-categories-label"
            className="mt-2 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"
          >
            {CATEGORIAS.map((item) => {
              const active = item.value === categoria;
              return (
                <button
                  key={item.label}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handleCategory(item.value)}
                  className={`${active ? chipActive : chipIdle} justify-center whitespace-nowrap sm:justify-start`}
                >
                  {active && <Icon name="check" className="text-[14px]" />}
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 border-b border-paper-line pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            ref={resultsHeadingRef}
            tabIndex={-1}
            className="scroll-mt-28 text-headline-sm text-secondary focus:outline-none"
          >
            {hayFiltros ? 'Resultados de tu búsqueda' : 'Cursos disponibles'}
          </h2>
          <p
            role="status"
            aria-live="polite"
            className="mt-1 text-body-sm text-on-surface-variant tabular-nums"
          >
            {loading
              ? 'Cargando cursos…'
              : total === 0
                ? 'Sin cursos para mostrar'
                : `Mostrando ${desde}–${hasta} de ${total} ${total === 1 ? 'curso' : 'cursos'}`}
          </p>
        </div>

        {!loading && hayFiltros && (
          <div className="flex flex-wrap items-center gap-2">
            {search && (
              <button
                type="button"
                onClick={quitarBusqueda}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-primary/25 bg-primary/[0.06] px-3 py-1 text-label-sm text-primary transition-colors duration-200 hover:border-primary/50 hover:bg-primary/10"
              >
                <Icon name="search" className="text-[14px]" />
                <span className="max-w-40 truncate">«{search}»</span>
                <Icon name="close" className="text-[14px]" />
                <span className="sr-only">Quitar filtro de búsqueda</span>
              </button>
            )}
            {categoriaActiva && categoriaActiva.value && (
              <button
                type="button"
                onClick={quitarCategoria}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-primary/25 bg-primary/[0.06] px-3 py-1 text-label-sm text-primary transition-colors duration-200 hover:border-primary/50 hover:bg-primary/10"
              >
                <Icon name="label" className="text-[14px]" />
                {categoriaActiva.label}
                <Icon name="close" className="text-[14px]" />
                <span className="sr-only">Quitar filtro de categoría</span>
              </button>
            )}
          </div>
        )}
      </div>

      {loading && (
        <section
          aria-hidden="true"
          className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-panel border border-outline bg-surface shadow-card"
            >
              <div className="h-40 animate-pulse bg-surface-variant motion-reduce:animate-none sm:h-44" />
              <div className="space-y-3 p-5">
                <div className="h-2.5 w-16 animate-pulse rounded-full bg-surface-variant motion-reduce:animate-none" />
                <div className="h-4 w-4/5 animate-pulse rounded bg-surface-variant motion-reduce:animate-none" />
                <div className="h-3 w-full animate-pulse rounded bg-surface-variant motion-reduce:animate-none" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-surface-variant motion-reduce:animate-none" />
                <div className="mt-6 h-11 animate-pulse rounded-control bg-surface-variant motion-reduce:animate-none" />
              </div>
            </div>
          ))}
        </section>
      )}

      {!loading && error && (
        <section className="space-y-3">
          <Alert variant="error" title="No pudimos cargar el catálogo">
            {error.message || 'Revisa tu conexión e inténtalo de nuevo.'}
          </Alert>
          <Button
            variant="secondary"
            icon="refresh"
            iconPosition="start"
            onClick={reintentar}
          >
            Reintentar
          </Button>
        </section>
      )}

      {!loading && !error && cursos.length === 0 && (
        <section className="relative overflow-hidden rounded-panel border border-outline bg-surface px-6 py-12 text-center shadow-card sm:py-16">
          <span
            aria-hidden="true"
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/[0.08] text-primary"
          >
            <Icon name={hayFiltros ? 'search_off' : 'auto_stories'} className="text-[28px]" />
          </span>
          <h2 className="mt-4 text-headline-md text-secondary text-balance">
            {hayFiltros
              ? 'No encontramos cursos con esos filtros'
              : 'Todavía no hay cursos publicados'}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-body-md leading-6 text-on-surface-variant text-pretty">
            {hayFiltros
              ? search
                ? `No hay resultados para «${search}»${categoria ? ` en ${categoria}` : ''}. Prueba con otro título o cambia de categoría.`
                : `Aún no hay cursos en ${categoria}. Prueba con otra categoría.`
              : 'Los cursos aparecerán aquí en cuanto los instructores los publiquen.'}
          </p>
          {hayFiltros && (
            <Button
              icon="arrow_forward"
              onClick={limpiarFiltros}
              className="mt-6"
            >
              Ver todos los cursos
            </Button>
          )}
        </section>
      )}

      {!loading && !error && cursos.length > 0 && (
        <>
          <section
            aria-label="Listado de cursos"
            className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {cursos.map((curso) => {
              const nivel = nivelInfo(curso.nivel);
              const instructor = curso.instructor?.nombre;

              return (
                <article
                  key={curso.id}
                  className="flex flex-col rounded-card border border-outline bg-surface p-3 shadow-card transition-[border-color,box-shadow] duration-300 ease-out-quint focus-within:border-primary/40 focus-within:shadow-hover"
                >
                  <CourseCover
                    portada={curso.portada}
                    alt={`Portada de ${curso.titulo}`}
                    icon={ICONO_CATEGORIA[curso.categoria] ?? 'auto_stories'}
                    className="h-40 rounded-control sm:h-44"
                    iconClassName="absolute bottom-3 right-4 text-[80px] text-white/20"
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-12 -top-20 h-48 w-48 rounded-full border border-white/10"
                    />
                  </CourseCover>

                  <div className="flex flex-1 flex-col pt-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                        {curso.categoria ?? 'Sin categoría'}
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-1.5 text-label-sm text-on-surface-variant">
                        <span
                          aria-hidden="true"
                          className={`h-1.5 w-1.5 rounded-full ${nivel.dot}`}
                        />
                        {nivel.label}
                      </span>
                    </div>

                    <h3 className="mt-2 text-balance text-headline-sm leading-snug text-secondary">
                      {curso.titulo}
                    </h3>

                    <p className="mt-2 line-clamp-2 text-body-md leading-5 text-on-surface-variant">
                      {curso.descripcion || 'Sin descripción disponible.'}
                    </p>

                    <div className="mt-auto pt-5">
                      <div className="flex items-center gap-2.5 border-t border-outline-light pt-3">
                        <span
                          aria-hidden="true"
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary"
                        >
                          {getInitials(instructor)}
                        </span>
                        <span className="min-w-0 truncate text-label-md font-semibold text-secondary">
                          {instructor ?? 'Por confirmar'}
                        </span>
                        {instructor && (
                          <span className="ml-auto shrink-0 text-[10px] font-medium uppercase tracking-[0.12em] text-ink-muted">
                            Instructor
                          </span>
                        )}
                      </div>

                      <Button
                        as={Link}
                        to={`/catalog/${curso.id}`}
                        aria-label={`Ver curso: ${curso.titulo}`}
                        variant="secondary"
                        icon="arrow_forward"
                        className="mt-3 w-full"
                      >
                        Ver curso
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          {totalPages > 1 && (
            <nav
              aria-label="Paginación de cursos"
              className="flex flex-col gap-3 border-t border-paper-line pt-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="text-body-sm text-on-surface-variant tabular-nums">
                Página{' '}
                <span className="font-semibold text-secondary">{page}</span> de{' '}
                <span className="font-semibold text-secondary">{totalPages}</span>
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon="chevron_left"
                  iconPosition="start"
                  onClick={() => handlePage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                >
                  Anterior
                </Button>

                {pageNumbers(page, totalPages).map((number, index, list) => {
                  const previous = list[index - 1];
                  return (
                    <span key={number} className="flex items-center gap-2">
                      {previous && number - previous > 1 && (
                        <span
                          aria-hidden="true"
                          className="text-label-sm text-on-surface-variant"
                        >
                          …
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handlePage(number)}
                        aria-current={number === page ? 'page' : undefined}
                        aria-label={`Página ${number}`}
                        className={`flex h-10 w-10 items-center justify-center rounded-control text-label-sm tabular-nums transition-colors duration-200 ${
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

                <Button
                  variant="secondary"
                  size="sm"
                  icon="chevron_right"
                  onClick={() => handlePage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
