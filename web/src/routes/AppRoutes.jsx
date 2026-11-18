import { Link, Route, Routes } from 'react-router';
import SiteLayout from '../components/SiteLayout.jsx';

const heading = 'text-3xl font-bold tracking-tight sm:text-5xl';
const action = 'inline-block rounded-lg bg-brand-700 px-4 py-2 font-semibold text-white hover:bg-brand-950';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={
          <section className="space-y-5 rounded-2xl border border-brand-200 bg-white p-6 sm:p-10">
            <h1 className={heading}>Learn one lesson at a time</h1>
            <p>MiniAula is a place for short courses, guided lessons, and quizzes.</p>
            <Link to="/catalog" className={action}>Browse catalog</Link>
          </section>
        } />
        <Route path="catalog" element={
          <section className="space-y-4">
            <h1 className={heading}>Course catalog</h1>
            <p className="rounded-xl border border-brand-200 bg-white p-5">Courses will appear here once the catalog is available.</p>
          </section>
        } />
        <Route path="*" element={
          <section className="space-y-4">
            <h1 className={heading}>Page not found</h1>
            <Link to="/" className={action}>Back to home</Link>
          </section>
        } />
      </Route>
    </Routes>
  );
}
