import { Link } from 'react-router';
import Icon from '../components/Icon.jsx';

export default function CatalogPage() {
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

      <section className="rounded-card border border-outline bg-surface p-8 text-center shadow-card sm:p-12">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/5 text-primary">
          <Icon name="auto_stories" className="text-[28px]" />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-secondary">
          Estamos preparando los cursos publicados
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-on-surface-variant">
          Muy pronto podrás explorar el catálogo completo, ver el temario y
          inscribirte desde aquí.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-[10px] border border-outline bg-surface px-4 py-2.5 text-sm font-semibold text-secondary transition-colors hover:bg-surface-variant"
        >
          <Icon name="arrow_back" className="text-[18px]" />
          Volver al inicio
        </Link>
      </section>
    </div>
  );
}
