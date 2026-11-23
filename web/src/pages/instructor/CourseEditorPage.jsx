import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import Alert from '../../components/Alert.jsx';
import Button from '../../components/Button.jsx';
import CourseCover from '../../components/CourseCover.jsx';
import FormField from '../../components/FormField.jsx';
import Icon from '../../components/Icon.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import {
  actualizarCurso,
  crearCurso,
  eliminarPortada,
  obtenerCursoPropio,
  subirPortada,
} from '../../services/curso.service.js';
import { toFieldErrors } from '../../utils/validation.js';
import {
  PORTADA_TIPOS,
  estados,
  niveles,
  validarArchivoPortada,
  validarCurso,
} from './courseForm.js';
import LessonEditor from './LessonEditor.jsx';

const emptyCourse = { titulo: '', descripcion: '', portada: '', categoria: '', nivel: 'basico', estado: 'borrador' };
const controlClass = 'w-full rounded-control border border-outline bg-surface px-3.5 py-2.5 text-body-md text-secondary placeholder:text-on-surface-variant/70 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary aria-invalid:border-error';

function CourseForm({ curso, editing, initialNotice = null }) {
  const navigate = useNavigate();
  const [values, setValues] = useState(curso);
  const [previewPortada, setPreviewPortada] = useState(curso.portada ?? '');
  const [archivoPortada, setArchivoPortada] = useState(null);
  const [nombrePortada, setNombrePortada] = useState('');
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(initialNotice);
  const [saving, setSaving] = useState(false);
  const inputPortada = useRef(null);
  const previewTemporal = useRef(null);
  const busy = saving || uploading;

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
      },
    };
  }

  async function seleccionarPortada(event) {
    const archivo = event.target.files?.[0];
    event.target.value = '';

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

        <div>
          <p className="mb-1.5 text-label-md text-secondary">Imagen de portada</p>
          <input
            ref={inputPortada}
            type="file"
            accept={PORTADA_TIPOS.join(',')}
            onChange={seleccionarPortada}
            disabled={busy}
            className="sr-only"
            aria-label="Elegir imagen de portada"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              icon="upload"
              iconPosition="start"
              onClick={() => inputPortada.current?.click()}
              disabled={busy}
            >
              {uploading ? 'Subiendo…' : previewPortada ? 'Cambiar imagen' : 'Elegir imagen'}
            </Button>
            {previewPortada && (
              <Button
                variant="danger"
                icon="delete"
                onClick={quitarPortada}
                disabled={busy}
              >
                Quitar portada
              </Button>
            )}
          </div>
          <p className="mt-1.5 text-label-sm text-on-surface-variant">
            PNG, JPG o WebP · máximo 5 MB.
            {nombrePortada && ` Archivo: ${nombrePortada}.`}
          </p>
          {errors.portada && (
            <p role="alert" className="mt-1.5 text-label-sm font-medium text-error">
              {errors.portada}
            </p>
          )}
          <CourseCover
            portada={previewPortada}
            alt={`Vista previa de la portada${values.titulo ? ` de ${values.titulo}` : ''}`}
            className="mt-3 aspect-video w-full rounded-control border border-outline"
          />
        </div>
      </fieldset>

      <div className="border-t border-outline pt-5">
        <Button type="submit" icon="save" iconPosition="start" loading={saving || uploading}>
          {saving || uploading
            ? 'Guardando…'
            : editing
              ? 'Guardar cambios'
              : 'Crear borrador'}
        </Button>
      </div>
    </form>
  );
}

function ExistingCourse({ id }) {
  const location = useLocation();
  const { data, loading, error, refetch } = useFetch(() => obtenerCursoPropio(id), [id]);
  const initialNotice = location.state?.notice ?? null;

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
      <CourseForm curso={data.curso} editing initialNotice={initialNotice} />
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
