import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import Button from './Button.jsx';
import Icon from './Icon.jsx';
import Logo from './Logo.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { getInitials } from '../utils/initials.js';

function navClass({ isActive }) {
  return `inline-flex shrink-0 items-center gap-2 rounded-control px-3 py-2 text-label-md transition-colors ${
    isActive
      ? 'bg-primary/10 font-semibold text-primary'
      : 'text-on-surface-variant hover:bg-surface-variant hover:text-secondary'
  }`;
}

export default function SiteLayout() {
  const { isAuthenticated, usuario, logout } = useAuth();
  const navigate = useNavigate();
  const isInstructor = isAuthenticated && usuario?.rol === 'instructor';

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-surface focus:px-4 focus:py-2 focus:text-label-lg focus:text-primary focus:shadow-hover"
      >
        Saltar al contenido
      </a>

      <header className="sticky top-0 z-30 border-b border-outline bg-surface shadow-xs">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-8">
              {isInstructor ? (
                <Link
                  to="/instructor/cursos"
                  aria-label="MiniAula para instructores"
                  className="flex shrink-0 items-center gap-2.5"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-on-secondary shadow-xs">
                    <Icon name="co_present" className="text-[22px]" />
                  </span>
                  <span className="leading-tight">
                    <span className="block text-headline-sm tracking-tight text-secondary">
                      MiniAula
                    </span>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-primary">
                      Instructor
                    </span>
                  </span>
                </Link>
              ) : (
                <Logo size="sm" />
              )}

              <nav
                aria-label="Navegación principal"
                className="order-3 hidden w-full items-center gap-1 overflow-x-auto md:order-none md:flex md:w-auto"
              >
                <NavLink to="/" end className={navClass}>
                  <Icon name="home" className="text-[20px]" />
                  Inicio
                </NavLink>
                <NavLink to="/catalog" className={navClass}>
                  <Icon name="search" className="text-[20px]" />
                  Explorar cursos
                </NavLink>
                {isInstructor && (
                  <NavLink to="/instructor/cursos" end className={navClass}>
                    <Icon name="dashboard" className="text-[20px]" />
                    Panel principal
                  </NavLink>
                )}
                {isInstructor && (
                  <NavLink to="/instructor/cursos/nuevo" className={navClass}>
                    <Icon name="add_circle" className="text-[20px]" />
                    Crear curso
                  </NavLink>
                )}
              </nav>
            </div>

            <div className="flex shrink-0 items-center gap-2 md:gap-3">
              {isAuthenticated && usuario ? (
                <>
                  <Link
                    to="/perfil"
                    aria-label={`Mi perfil de ${usuario.nombre}`}
                    className="flex items-center gap-2 rounded-control p-1 pr-2 transition-colors hover:bg-surface-variant"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-label-sm font-bold text-on-primary">
                      {getInitials(usuario.nombre)}
                    </span>
                    <span className="hidden text-left leading-tight lg:block">
                      <span className="block max-w-40 truncate text-label-sm font-semibold text-secondary">
                        {usuario.nombre}
                      </span>
                      <span className="block text-[11px] text-on-surface-variant">
                        {usuario.rol === 'instructor' ? 'Instructor' : 'Estudiante'}
                      </span>
                    </span>
                  </Link>

                  <Button
                    variant="ghost"
                    icon="logout"
                    iconPosition="start"
                    aria-label="Cerrar sesión"
                    title="Cerrar sesión"
                    className="px-2 py-2"
                    onClick={handleLogout}
                  >
                    <span className="sr-only lg:not-sr-only">Cerrar sesión</span>
                  </Button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="rounded-control px-3 py-2 text-label-md text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-secondary"
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    to="/registro"
                    className="inline-flex items-center gap-1.5 rounded-control bg-primary px-3.5 py-2 text-label-md font-semibold text-on-primary shadow-card transition-colors hover:bg-primary-dark"
                  >
                    <Icon name="person_add" className="text-[18px]" />
                    <span className="hidden sm:inline">Crear cuenta</span>
                    <span className="sm:hidden">Crear</span>
                  </Link>
                </>
              )}
            </div>
          </div>

          <nav
            aria-label="Navegación principal móvil"
            className="flex items-center gap-1 overflow-x-auto pb-2 md:hidden"
          >
            <NavLink to="/" end className={navClass}>
              <Icon name="home" className="text-[18px]" />
              Inicio
            </NavLink>
            <NavLink to="/catalog" className={navClass}>
              <Icon name="search" className="text-[18px]" />
              Explorar cursos
            </NavLink>
            {isInstructor && (
              <NavLink to="/instructor/cursos" end className={navClass}>
                <Icon name="dashboard" className="text-[18px]" />
                Panel principal
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      <main
        id="main-content"
        className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
      >
        <Outlet />
      </main>

      <footer className="border-t border-outline bg-surface">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-5 text-label-sm text-on-surface-variant sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>© 2026 MiniAula LMS</span>
          <span>Plataforma de aprendizaje · Proyecto académico</span>
        </div>
      </footer>
    </div>
  );
}
