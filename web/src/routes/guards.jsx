import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../hooks/useAuth.jsx';

export function RequireAuth() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <Outlet />;
}

export function RequireInstructor() {
  const { usuario } = useAuth();
  return usuario?.rol === 'instructor' ? <Outlet /> : <Navigate to="/perfil" replace />;
}

export function RequireStudent() {
  const { usuario } = useAuth();

  if (usuario?.rol === 'estudiante') {
    return <Outlet />;
  }

  return (
    <Navigate
      to={usuario?.rol === 'instructor' ? '/instructor/cursos' : '/perfil'}
      replace
    />
  );
}

export function GuestOnly() {
  const { isAuthenticated, usuario } = useAuth();

  if (isAuthenticated) {
    const destination = usuario?.rol === 'instructor' ? '/instructor/cursos' : '/panel';
    return <Navigate to={destination} replace />;
  }

  return <Outlet />;
}
