import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import Button from './Button.jsx';
import Icon from './Icon.jsx';
import Logo from './Logo.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { getInitials } from '../utils/initials.js';

function navClass({ isActive }) {
  return `shrink-0 whitespace-nowrap border-b pb-1 text-[11px] font-normal uppercase tracking-[0.12em] transition-colors duration-200 lg:text-[12px] ${
    isActive
      ? 'border-primary text-primary'
      : 'border-transparent text-ink-muted hover:border-primary/40 hover:text-primary'
  }`;
}

export default function SiteLayout() {
  const { isAuthenticated, usuario, logout } = useAuth();
  const navigate = useNavigate();
  const isInstructor = isAuthenticated && usuario?.rol === 'instructor';

  const links = [];

  if (!isInstructor) {
    links.push({
      to: isAuthenticated ? '/panel' : '/',
      label: 'Inicio',
      end: true,
    });
  }

  if (isAuthenticated && !isInstructor) {
    links.push({ to: '/mis-cursos', label: 'Mis cursos' });
  }

  if (!isInstructor) {
    links.push({ to: '/catalog', label: 'Explorar cursos' });
  }

  if (isInstructor) {
    links.push({ to: '/instructor/cursos', label: 'Panel principal', end: true });
    links.push({ to: '/instructor/cursos/nuevo', label: 'Crear curso' });
    links.push({ to: '/instructor/analiticas', label: 'Analíticas' });
  }

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

      <header className="sticky top-0 z-30 border-b border-paper-line bg-paper shadow-nav">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative flex h-16 items-center justify-between gap-3 lg:h-20">
            <div className="flex min-w-0 items-center gap-4 lg:gap-8">
              {isInstructor ? (
                <Link
                  to="/instructor/cursos"
                  aria-label="MiniAula para instructores"
                  className="flex shrink-0 items-center gap-2.5"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-control bg-primary text-on-primary">
                    <Icon name="co_present" className="text-[22px]" />
                  </span>
                  <span className="leading-tight">
                    <span className="block text-[18px] leading-6 font-mono tracking-tight text-secondary">
                      MiniAula
                    </span>
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                      Instructor
                    </span>
                  </span>
                </Link>
              ) : (
                <Logo
                  size="sm"
                  to={isAuthenticated && !isInstructor ? '/panel' : '/'}
                />
              )}

              {isInstructor && (
                <nav
                  aria-label="Navegación principal"
                  className="hidden items-center gap-6 lg:flex"
                >
                  {links.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.end}
                      className={navClass}
                    >
                      {link.label}
                    </NavLink>
                  ))}
                </nav>
              )}
            </div>

            {!isInstructor && (
              <nav
                aria-label="Navegación principal"
                className="absolute inset-y-0 left-1/2 hidden -translate-x-1/2 items-center gap-8 lg:flex"
              >
                {links.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    className={navClass}
                  >
                    {link.label}
                  </NavLink>
                ))}
              </nav>
            )}

            <div className="flex shrink-0 items-center gap-3 sm:gap-5">
              {isAuthenticated && usuario ? (
                <>
                  <Link
                    to="/perfil"
                    aria-label={`Mi perfil de ${usuario.nombre}`}
                    className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-primary/5"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-on-primary">
                      {getInitials(usuario.nombre)}
                    </span>
                    <span className="hidden text-left leading-tight lg:block">
                      <span className="block max-w-40 truncate text-[11px] font-semibold text-secondary">
                        {usuario.nombre}
                      </span>
                      <span className="block text-[11px] uppercase tracking-[0.14em] text-ink-muted">
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
                    className="inline-flex items-center py-2 text-[11px] font-normal uppercase tracking-[0.16em] text-ink-muted transition-colors duration-200 hover:text-primary sm:text-[12px]"
                  >
                    <span className="hidden sm:inline">Iniciar sesión</span>
                    <span className="sm:hidden">Entrar</span>
                  </Link>
                  <Button
                    as={Link}
                    to="/registro"
                    shape="pill"
                    icon="arrow_outward"
                  >
                    Crear cuenta
                  </Button>
                </>
              )}
            </div>
          </div>

          <nav
            aria-label="Navegación principal móvil"
            className="flex items-center gap-4 overflow-x-auto pb-3 sm:gap-6 lg:hidden"
          >
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={navClass}
              >
                {link.label}
              </NavLink>
            ))}
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
