import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import Alert from '../../components/Alert.jsx';
import Button from '../../components/Button.jsx';
import FormField from '../../components/FormField.jsx';
import FormActions from '../../components/FormActions.jsx';
import Icon from '../../components/Icon.jsx';
import { controlClass } from '../../components/formControl.js';
import { useFetch } from '../../hooks/useFetch.js';
import {
  actualizarCurso,
  crearCurso,
  eliminarPortada,
  obtenerCursoPropio,
  publicarCurso,
  subirPortada,
} from '../../services/curso.service.js';
import { toFieldErrors } from '../../utils/validation.js';
import {
  estados,
  niveles,
  validarArchivoPortada,
  validarCurso,
} from './courseForm.js';
import CoverField from './CoverField.jsx';
import LessonEditor from './LessonEditor.jsx';

const emptyCourse = { titulo: '', descripcion: '', portada: '', categoria: '', nivel: 'basico', estado: 'borrador' };

function CourseForm({ curso, editing, totalLecciones = 0, initialNotice = null }) {
  const navigate = useNavigate();
  const [values, setValues] = useState(curso);
  const [previewPortada, setPreviewPortada] = useState(curso.portada ?? '');
  const [archivoPortada, setArchivoPortada] = useState(null);
  const [nombrePortada, setNombrePortada] = useState('');
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(initialNotice);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const previewTemporal = useRef(null);
  const busy = saving || uploading;
  const puedePublicar = editing && values.estado === 'borrador' && totalLecciones > 0;
  const statusMessage =
    saving || uploading
      ? 'Guardando…'
      : notice?.variant === 'error'
        ? 'No se pudo guardar'
        : notice?.variant === 'success'
          ? notice.message
          : dirty
            ? 'Cambios sin guardar'
            : 'Todo guardado';
  const statusTone = notice?.variant === 'error' ? 'error' : 'muted';

  useEffect(() => {
    if (!dirty) return undefined;

    function warnUnsaved(event) {
      event.preventDefault();
      event.returnValue = '';
    }

    window.addEventListener('beforeunload', warnUnsaved);
    return () => window.removeEventListener('beforeunload', warnUnsaved);
  }, [dirty]);

  useEffect(() => () => {
    if (previewTemporal.current) {
      URL.revokeObjectURL(previewTemporal.current);
    }
  }, []);

  function limpiarPreviewTemporal() {
    if (previewTemporal.current) {
      URL.revokeObjectURL(previewTemporal.current);
      previewTemporal.current = null;
    }
  }

  function field(name) {
    return {
      name,
      value: values[name] ?? '',
      required: true,
      onChange: (event) => {
        const value = event.target.value;
        setValues((previous) => ({ ...previous, [name]: value }));
        setErrors((previous) => ({ ...previous, [name]: undefined }));
        setNotice(null);
        setDirty(true);
      },
    };
  }

  // Both the file picker and a drop go through this single path so format,
  // size, preview and upload behave exactly the same.
  async function procesarPortada(archivo) {
    if (!archivo || busy) return;

    const error = validarArchivoPortada(archivo);
    if (error) {
      setErrors((previous) => ({ ...previous, portada: error }));
      setNotice(null);
      return;
    }

    limpiarPreviewTemporal();
    const temporal = URL.createObjectURL(archivo);
    previewTemporal.current = temporal;
    setPreviewPortada(temporal);
    setArchivoPortada(archivo);
    setNombrePortada(archivo.name);
    setErrors((previous) => ({ ...previous, portada: undefined }));
    setNotice(null);
    if (!editing) setDirty(true);

    if (!editing) return;

    setUploading(true);
    try {
      const result = await subirPortada(curso.id, archivo);
      setValues((previous) => ({ ...previous, portada: result.curso.portada }));
      setPreviewPortada(result.curso.portada);
      setArchivoPortada(null);
      setNombrePortada('');
      limpiarPreviewTemporal();
      setNotice({ variant: 'success', message: 'Portada actualizada.' });
    } catch (err) {
      limpiarPreviewTemporal();
      setPreviewPortada(values.portada ?? '');
      setArchivoPortada(null);
      setNombrePortada('');
      setErrors((previous) => ({ ...previous, portada: err.message }));
      setNotice({ variant: 'error', message: err.message });
    } finally {
      setUploading(false);
    }
  }

  // A rejected drop keeps the current preview and only reports the problem.
  function rechazarPortada(mensaje) {
    if (busy) return;

    setErrors((previous) => ({ ...previous, portada: mensaje }));
    setNotice(null);
  }

  async function quitarPortada() {
    if (busy) return;

    setNotice(null);

    if (archivoPortada) {
      limpiarPreviewTemporal();
      setArchivoPortada(null);
      setNombrePortada('');
      setPreviewPortada(values.portada ?? '');
      setErrors((previous) => ({ ...previous, portada: undefined }));
      return;
    }

    if (!editing || !values.portada) {
      setPreviewPortada('');
      return;
    }

    setUploading(true);
    try {
      const result = await eliminarPortada(curso.id);
      setValues((previous) => ({ ...previous, portada: result.curso.portada }));
      setPreviewPortada('');
      setNotice({ variant: 'success', message: 'Portada eliminada.' });
    } catch (err) {
      setNotice({ variant: 'error', message: err.message });
    } finally {
      setUploading(false);
    }
  }

  async function save(event) {
    event.preventDefault();
    if (busy) return;
    const { datos, errores } = validarCurso(values);
    setErrors(errores);
    setNotice(null);
    if (Object.keys(errores).length) return;

    setSaving(true);
    try {
      if (editing) {
        const result = await actualizarCurso(curso.id, datos);
        setValues(result.curso);
        setPreviewPortada(result.curso.portada ?? '');
        setNotice({ variant: 'success', message: 'Cambios guardados.' });
        setDirty(false);
        return;
      }

      let creado = (await crearCurso(datos)).curso;

      if (archivoPortada) {
        try {
          creado = (await subirPortada(creado.id, archivoPortada)).curso;
        } catch (err) {
          navigate(`/instructor/cursos/${creado.id}/editar`, {
            replace: true,
            state: {
              notice: {
                variant: 'error',
                message: `El curso se creó, pero la portada no se pudo subir: ${err.message}`,
              },
            },
          });
          return;
        }
      }

      navigate(`/instructor/cursos/${creado.id}/editar`, { replace: true });
    } catch (err) {
      setErrors(toFieldErrors(err.details, ['titulo', 'descripcion', 'categoria', 'nivel']));
      setNotice({ variant: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function publicar() {
    if (busy || !values.id) return;

    setSaving(true);
    setNotice(null);
    try {
      const result = await publicarCurso(values.id);
      setValues((previous) => ({ ...previous, estado: result.curso.estado }));
      setNotice({ variant: 'success', message: 'Curso publicado.' });
      setDirty(false);
    } catch (err) {
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

      <fieldset disabled={busy} className="min-w-0 space-y-4">
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

        <CoverField
          previewPortada={previewPortada}
          alt={`Vista previa de la portada${values.titulo ? ` de ${values.titulo}` : ''}`}
          nombrePortada={nombrePortada}
          error={errors.portada}
          busy={busy}
          uploading={uploading}
          onFile={procesarPortada}
          onRemove={quitarPortada}
          onError={rechazarPortada}
        />
      </fieldset>

      {notice?.variant === 'error' && <Alert variant="error">{notice.message}</Alert>}

      <FormActions sticky={dirty} status={statusMessage} tone={statusTone}>
        {puedePublicar && (
          <Button
            variant="secondary"
            icon="publish"
            iconPosition="start"
            onClick={publicar}
            disabled={busy}
          >
            Publicar curso
          </Button>
        )}
        <Button type="submit" icon="save" iconPosition="start" loading={saving || uploading}>
          {saving || uploading
            ? 'Guardando…'
            : editing
              ? 'Guardar cambios'
              : 'Crear borrador'}
        </Button>
      </FormActions>
    </form>
  );
}

function ExistingCourse({ id }) {
  const location = useLocation();
  const { data, loading, error, refetch } = useFetch(() => obtenerCursoPropio(id), [id]);
  const initialNotice = location.state?.notice ?? null;
  const [lessonCount, setLessonCount] = useState(null);

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
      <CourseForm
        curso={data.curso}
        editing
        totalLecciones={lessonCount ?? data.lecciones?.length ?? 0}
        initialNotice={initialNotice}
      />
      <LessonEditor
        cursoId={id}
        lecciones={data.lecciones ?? []}
        onCountChange={setLessonCount}
      />
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
        <h1 className="text-headline-lg-mobile text-secondary sm:text-headline-lg">
          {id ? 'Editar curso' : 'Nuevo curso'}
        </h1>
      </div>

      {id ? <ExistingCourse key={id} id={id} /> : <CourseForm curso={emptyCourse} />}
    </section>
  );
}
