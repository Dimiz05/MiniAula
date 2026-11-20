import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import Alert from '../../components/Alert.jsx';
import Button from '../../components/Button.jsx';
import FormField from '../../components/FormField.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { actualizarCurso, crearCurso, obtenerCursoPropio } from '../../services/curso.service.js';
import { toFieldErrors } from '../../utils/validation.js';
import { estados, niveles, validarCurso } from './courseForm.js';

const emptyCourse = { titulo: '', descripcion: '', categoria: '', nivel: 'basico', estado: 'borrador' };
const controlClass = 'w-full rounded-[10px] border border-outline bg-surface px-3.5 py-2.5 text-sm text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary aria-invalid:border-error';

function CourseForm({ curso, editing }) {
  const navigate = useNavigate();
  const [values, setValues] = useState(curso);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);

  function field(name) {
    return {
      name,
      value: values[name],
      required: true,
      onChange: (event) => {
        const value = event.target.value;
        setValues((previous) => ({ ...previous, [name]: value }));
        setErrors((previous) => ({ ...previous, [name]: undefined }));
        setNotice(null);
      },
    };
  }

  async function save(event) {
    event.preventDefault();
    if (saving) return;
    const { datos, errores } = validarCurso(values);
    setErrors(errores);
    setNotice(null);
    if (Object.keys(errores).length) return;

    setSaving(true);
    try {
      const result = editing ? await actualizarCurso(curso.id, datos) : await crearCurso(datos);
      if (!editing) {
        navigate(`/instructor/cursos/${result.curso.id}/editar`, { replace: true });
        return;
      }
      setValues(result.curso);
      setNotice({ variant: 'success', message: 'Cambios guardados.' });
    } catch (err) {
      setErrors(toFieldErrors(err.details, Object.keys(datos)));
      setNotice({ variant: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form noValidate onSubmit={save} className="space-y-5 rounded-xl border border-outline bg-surface p-4 shadow-card sm:p-6">
      <p className="text-sm font-semibold text-secondary">Estado: {estados[values.estado]}</p>
      {notice && <Alert variant={notice.variant}>{notice.message}</Alert>}
      <fieldset disabled={saving} className="min-w-0 space-y-4">
        <FormField label="Título" maxLength={150} error={errors.titulo} {...field('titulo')} />
        <div>
          <label htmlFor="descripcion" className="mb-1.5 block text-xs font-semibold text-secondary">Descripción</label>
          <textarea id="descripcion" rows={5} className={controlClass} {...field('descripcion')}
            aria-invalid={Boolean(errors.descripcion)}
            aria-describedby={errors.descripcion ? 'descripcion-error' : undefined}
          />
          {errors.descripcion && <p id="descripcion-error" role="alert" className="mt-1 text-xs text-error">{errors.descripcion}</p>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Categoría" maxLength={60} error={errors.categoria} {...field('categoria')} />
          <div>
            <label htmlFor="nivel" className="mb-1.5 block text-xs font-semibold text-secondary">Nivel</label>
            <select id="nivel" className={controlClass} {...field('nivel')}
              aria-invalid={Boolean(errors.nivel)}
              aria-describedby={errors.nivel ? 'nivel-error' : undefined}
            >
              {Object.entries(niveles).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            {errors.nivel && <p id="nivel-error" role="alert" className="mt-1 text-xs text-error">{errors.nivel}</p>}
          </div>
        </div>
      </fieldset>
      <Button type="submit" loading={saving}>
        {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear borrador'}
      </Button>
    </form>
  );
}

function ExistingCourse({ id }) {
  const { data, loading, error, refetch } = useFetch(() => obtenerCursoPropio(id), [id]);

  if (loading) return <p role="status" className="text-on-surface-variant">Cargando curso…</p>;
  if (error) {
    return (
      <Alert variant="error" title="No se pudo abrir el editor">
        <p>{error.message}</p>
        {![403, 404, 422].includes(error.status) && (
          <Button variant="secondary" className="mt-2" onClick={refetch}>Reintentar</Button>
        )}
      </Alert>
    );
  }

  return <CourseForm curso={data.curso} editing />;
}

export default function CourseEditorPage() {
  const { id } = useParams();

  return (
    <section className="mx-auto max-w-2xl space-y-5">
      <Link to="/instructor/cursos" className="text-sm font-semibold text-primary hover:underline">
        ← Volver a mis cursos
      </Link>
      <h1 className="text-3xl font-bold text-secondary">{id ? 'Editar curso' : 'Nuevo curso'}</h1>
      {id ? <ExistingCourse key={id} id={id} /> : <CourseForm curso={emptyCourse} />}
    </section>
  );
}
