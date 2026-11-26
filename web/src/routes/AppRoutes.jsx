import { Route, Routes } from 'react-router';
import SiteLayout from '../components/SiteLayout.jsx';
import CatalogPage from '../pages/CatalogPage.jsx';
import CourseDetailPage from '../pages/CourseDetailPage.jsx';
import HomePage from '../pages/HomePage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';
import LoginPage from '../pages/auth/LoginPage.jsx';
import ProfilePage from '../pages/auth/ProfilePage.jsx';
import RegisterPage from '../pages/auth/RegisterPage.jsx';
import AnalyticsPage from '../pages/instructor/AnalyticsPage.jsx';
import CourseEditorPage from '../pages/instructor/CourseEditorPage.jsx';
import MyCoursesPage from '../pages/instructor/MyCoursesPage.jsx';
import DashboardPage from '../pages/student/DashboardPage.jsx';
import LessonPage from '../pages/student/LessonPage.jsx';
import StudentMyCoursesPage from '../pages/student/MyCoursesPage.jsx';
import { GuestOnly, RequireAuth, RequireInstructor, RequireStudent } from './guards.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="catalog/:id" element={<CourseDetailPage />} />
        <Route element={<RequireAuth />}>
          <Route path="perfil" element={<ProfilePage />} />
          <Route element={<RequireStudent />}>
            <Route path="panel" element={<DashboardPage />} />
            <Route path="mis-cursos" element={<StudentMyCoursesPage />} />
            <Route
              path="cursos/:cursoId/lecciones/:leccionId"
              element={<LessonPage />}
            />
          </Route>
          <Route element={<RequireInstructor />}>
            <Route path="instructor/cursos" element={<MyCoursesPage />} />
            <Route path="instructor/cursos/nuevo" element={<CourseEditorPage />} />
            <Route path="instructor/cursos/:id/editar" element={<CourseEditorPage />} />
            <Route path="instructor/analiticas" element={<AnalyticsPage />} />
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
