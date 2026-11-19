import { Route, Routes } from 'react-router';
import SiteLayout from '../components/SiteLayout.jsx';
import CatalogPage from '../pages/CatalogPage.jsx';
import HomePage from '../pages/HomePage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';
import LoginPage from '../pages/auth/LoginPage.jsx';
import ProfilePage from '../pages/auth/ProfilePage.jsx';
import RegisterPage from '../pages/auth/RegisterPage.jsx';
import { GuestOnly, RequireAuth } from './guards.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route element={<RequireAuth />}>
          <Route path="perfil" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route element={<GuestOnly />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="registro" element={<RegisterPage />} />
      </Route>
    </Routes>
  );
}
