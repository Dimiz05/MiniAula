import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import Button from './Button.jsx';
import Icon from './Icon.jsx';
import Logo from './Logo.jsx';
import { useAuth } from '../hooks/useAuth.jsx';

function navClass({ isActive }) {
  return `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-primary/5 text-primary'
      : 'text-on-surface-variant hover:bg-surface-variant hover:text-secondary'
  }`;
}

function getInitials(nombre) {
  const words = nombre.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? words[words.length - 1]?.[0] ?? '' : '';
  return `${first}${last}`.toUpperCase() || 'MA';
}

export default function SiteLayout() {
  const { isAuthenticated, usuario, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary focus:shadow-hover"
      >
        Saltar al contenido
      </a>

      <header className="sticky top-0 z-30 border-b border-outline bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
          <Logo />

          <nav
            aria-label="Navegación principal"
            className="order-3 flex w-full items-center gap-1 sm:order-none sm:ml-4 sm:w-auto"
          >
            <NavLink to="/" end className={navClass}>
              Inicio
            </NavLink>
            <NavLink to="/catalog" className={navClass}>
              Catálogo
            </NavLink>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {isAuthenticated && usuario ? (
              <>
                <Link
                  to="/perfil"
                  aria-label={`Mi perfil de ${usuario.nombre}`}
                  className="flex items-center gap-2 rounded-lg border border-outline bg-surface p-1 pr-2 transition-colors hover:bg-surface-variant"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-xs font-bold text-on-primary">
                    {getInitials(usuario.nombre)}
                  </span>
                  <span className="hidden max-w-36 truncate text-xs font-semibold text-secondary sm:inline">
                    {usuario.nombre}
                  </span>
                </Link>

                <Button
                  variant="ghost"
                  icon="logout"
                  iconPosition="start"
                  aria-label="Cerrar sesión"
                  title="Cerrar sesión"
                  className="px-2.5 py-2 sm:px-3"
                  onClick={handleLogout}
                >
                  <span className="hidden sm:inline">Cerrar sesión</span>
                </Button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-secondary"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/registro"
                  className="inline-flex items-center gap-1.5 rounded-[10px] bg-primary px-3 py-2 text-sm font-semibold text-on-primary shadow-card transition-colors hover:bg-primary-dark"
                >
                  <Icon name="person_add" className="text-[18px]" />
                  <span className="hidden sm:inline">Crear cuenta</span>
                  <span className="sm:hidden">Crear</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main
        id="main-content"
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10"
      >
        <Outlet />
      </main>

      <footer className="border-t border-outline bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-on-surface-variant sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>© 2026 MiniAula LMS</span>
          <span>Plataforma de aprendizaje · Proyecto académico</span>
        </div>
      </footer>
    </div>
  );
}
