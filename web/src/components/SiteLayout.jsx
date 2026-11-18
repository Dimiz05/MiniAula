import { NavLink, Outlet } from 'react-router';

function navLinkClass({ isActive }) {
  return `rounded-md px-3 py-2 ${isActive ? 'bg-brand-200 font-semibold' : 'hover:bg-brand-50'}`;
}

export default function SiteLayout() {
  return (
    <>
      <header className="border-b border-brand-200 bg-white">
        <nav aria-label="Main navigation" className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-4">
          <span className="mr-auto font-bold tracking-tight">MiniAula</span>
          <NavLink to="/" end className={navLinkClass}>Home</NavLink>
          <NavLink to="/catalog" className={navLinkClass}>Catalog</NavLink>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-10 sm:py-16">
        <Outlet />
      </main>
    </>
  );
}
