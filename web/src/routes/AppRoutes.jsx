import { Route, Routes } from 'react-router';
import SiteLayout from '../components/SiteLayout.jsx';
import CatalogPage from '../pages/CatalogPage.jsx';
import CourseDetailPage from '../pages/CourseDetailPage.jsx';
import HomePage from '../pages/HomePage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';
import LoginPage from '../pages/auth/LoginPage.jsx';
import ProfilePage from '../pages/auth/ProfilePage.jsx';
import RegisterPage from '../pages/auth/RegisterPage.jsx';
import CourseEditorPage from '../pages/instructor/CourseEditorPage.jsx';
import MyCoursesPage from '../pages/instructor/MyCoursesPage.jsx';
import { GuestOnly, RequireAuth, RequireInstructor } from './guards.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="catalogo" element={<CatalogPage />} />
        <Route path="catalog/:id" element={<CourseDetailPage />} />
        <Route path="catalogo/:id" element={<CourseDetailPage />} />
        <Route path="cursos" element={<CatalogPage />} />
        <Route path="cursos/:id" element={<CourseDetailPage />} />
        <Route path="curso/:id" element={<CourseDetailPage />} />
        <Route path="course/:id" element={<CourseDetailPage />} />
        <Route element={<RequireAuth />}>
          <Route path="perfil" element={<ProfilePage />} />
          <Route element={<RequireInstructor />}>
            <Route path="instructor/cursos" element={<MyCoursesPage />} />
            <Route path="instructor/cursos/nuevo" element={<CourseEditorPage />} />
            <Route path="instructor/cursos/:id/editar" element={<CourseEditorPage />} />
          </Route>
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
