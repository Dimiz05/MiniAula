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

export function GuestOnly() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/perfil" replace />;
  }

  return <Outlet />;
}
