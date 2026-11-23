import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import Alert from '../../components/Alert.jsx';
import Button from '../../components/Button.jsx';
import FormField from '../../components/FormField.jsx';
import Icon from '../../components/Icon.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { actualizarCurso, crearCurso, obtenerCursoPropio } from '../../services/curso.service.js';
import { toFieldErrors } from '../../utils/validation.js';
import { estados, niveles, validarCurso } from './courseForm.js';
import LessonEditor from './LessonEditor.jsx';

const emptyCourse = { titulo: '', descripcion: '', categoria: '', nivel: 'basico', estado: 'borrador' };
const controlClass = 'w-full rounded-control border border-outline bg-surface px-3.5 py-2.5 text-body-md text-secondary placeholder:text-on-surface-variant/70 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary aria-invalid:border-error';

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
    <form
      noValidate
      onSubmit={save}
      className="space-y-6 rounded-panel border border-outline bg-surface p-6 shadow-card md:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-outline pb-4">
        <div>
          <h2 className="text-headline-sm text-secondary">1. Información general del curso</h2>
          <p className="text-body-sm text-on-surface-variant">
            Configura los datos que los estudiantes verán en el catálogo público.
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-label-sm font-semibold ${
            values.estado === 'publicado'
              ? 'bg-success-light text-success'
              : values.estado === 'archivado'
                ? 'bg-surface-variant text-on-surface-variant'
                : 'bg-warning-light text-secondary'
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              values.estado === 'publicado'
                ? 'bg-success'
                : values.estado === 'archivado'
                  ? 'bg-on-surface-variant'
                  : 'bg-warning'
            }`}
          />
          {estados[values.estado] ?? values.estado}
        </span>
      </div>

      {notice && <Alert variant={notice.variant}>{notice.message}</Alert>}

      <fieldset disabled={saving} className="min-w-0 space-y-4">
        <FormField label="Título del curso" maxLength={150} error={errors.titulo} {...field('titulo')} />

        <div>
          <label htmlFor="descripcion" className="mb-1.5 block text-label-md text-secondary">
            Descripción detallada
          </label>
          <textarea
            id="descripcion"
            rows={5}
            className={controlClass}
            {...field('descripcion')}
            aria-invalid={Boolean(errors.descripcion)}
            aria-describedby={errors.descripcion ? 'descripcion-error' : undefined}
          />
          {errors.descripcion && (
            <p id="descripcion-error" role="alert" className="mt-1 text-label-sm text-error">
              {errors.descripcion}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Categoría" maxLength={60} error={errors.categoria} {...field('categoria')} />
          <div>
            <label htmlFor="nivel" className="mb-1.5 block text-label-md text-secondary">
              Nivel de dificultad
            </label>
            <select
              id="nivel"
              className={controlClass}
              {...field('nivel')}
              aria-invalid={Boolean(errors.nivel)}
              aria-describedby={errors.nivel ? 'nivel-error' : undefined}
            >
              {Object.entries(niveles).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {errors.nivel && (
              <p id="nivel-error" role="alert" className="mt-1 text-label-sm text-error">
                {errors.nivel}
              </p>
            )}
          </div>
        </div>
      </fieldset>

      <div className="border-t border-outline pt-5">
        <Button type="submit" icon="save" iconPosition="start" loading={saving}>
          {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear borrador'}
        </Button>
      </div>
    </form>
  );
}

function ExistingCourse({ id }) {
  const { data, loading, error, refetch } = useFetch(() => obtenerCursoPropio(id), [id]);

  if (loading) return <p role="status" className="text-body-md text-on-surface-variant">Cargando curso…</p>;
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

  return (
    <div className="space-y-8">
      <CourseForm curso={data.curso} editing />
      <LessonEditor cursoId={id} lecciones={data.lecciones ?? []} />
    </div>
  );
}

export default function CourseEditorPage() {
  const { id } = useParams();

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/instructor/cursos"
          aria-label="Volver a mis cursos"
          className="rounded-control p-1.5 text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-secondary"
        >
          <Icon name="arrow_back" className="text-[20px]" />
        </Link>
        <h1 className="text-headline-sm text-secondary">
          {id ? 'Editar curso' : 'Nuevo curso'}
        </h1>
      </div>

      {id ? <ExistingCourse key={id} id={id} /> : <CourseForm curso={emptyCourse} />}
    </section>
  );
}
