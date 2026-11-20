import { Link } from 'react-router';
import Icon from '../components/Icon.jsx';

export default function NotFoundPage() {
  return (
    <section className="rounded-card border border-outline bg-surface p-8 text-center shadow-card sm:p-12">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-variant text-on-surface-variant">
        <Icon name="explore_off" className="text-[28px]" />
      </span>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
        Error 404
      </p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-secondary">
        Página no encontrada
      </h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-on-surface-variant">
        La dirección que abriste no existe o cambió de lugar. Vuelve al inicio
        para continuar.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shadow-card transition-colors hover:bg-primary-dark"
      >
        <Icon name="home" className="text-[18px]" />
        Ir al inicio
      </Link>
    </section>
  );
}
