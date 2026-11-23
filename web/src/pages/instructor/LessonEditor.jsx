import { useEffect, useRef, useState } from 'react';
import Alert from '../../components/Alert.jsx';
import Button from '../../components/Button.jsx';
import FormField from '../../components/FormField.jsx';
import Icon from '../../components/Icon.jsx';
import {
  actualizarLeccion,
  crearLeccion,
  eliminarLeccion,
  reordenarLecciones,
} from '../../services/leccion.service.js';
import { toFieldErrors } from '../../utils/validation.js';
import { moverLeccion, reordenarLista, validarLeccion } from './lessonForm.js';

const emptyForm = { titulo: '', contenido: '', videoUrl: '' };
const controlClass = 'w-full rounded-control border border-outline bg-surface px-3.5 py-2.5 text-body-md text-secondary placeholder:text-on-surface-variant/70 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary aria-invalid:border-error';

function LessonForm({ values, errors, editing, saving, onChange, onSubmit, onCancel }) {
  function field(name) {
    return {
      name,
      value: values[name],
      onChange: (event) => onChange(name, event.target.value),
    };
  }

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="space-y-4 rounded-control border border-outline bg-surface-variant/30 p-4"
    >
      <FormField
        label="Título de la lección"
        maxLength={150}
        required
        error={errors.titulo}
        {...field('titulo')}
      />

      <div>
        <label htmlFor="contenido-leccion" className="mb-1.5 block text-label-md text-secondary">
          Contenido <span className="text-error">*</span>
        </label>
        <textarea
          id="contenido-leccion"
          rows={6}
          className={controlClass}
          {...field('contenido')}
          aria-invalid={Boolean(errors.contenido)}
          aria-describedby={errors.contenido ? 'contenido-leccion-error' : undefined}
        />
        {errors.contenido && (
          <p id="contenido-leccion-error" role="alert" className="mt-1 text-label-sm text-error">
            {errors.contenido}
          </p>
        )}
      </div>

      <FormField
        label="Enlace de video (opcional)"
        type="url"
        maxLength={500}
        hint="Acepta enlaces http o https. Puedes dejarlo vacío."
        error={errors.videoUrl}
        {...field('videoUrl')}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" icon="save" iconPosition="start" loading={saving}>
          {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear lección'}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function LessonRow({
  leccion,
  index,
  total,
  pending,
  onEdit,
  onDelete,
  onMove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) {
  const esCuestionario = leccion.tipo === 'cuestionario';
  const ocupada = pending !== null;
  const resumenContenido = leccion.contenido
    ? `${leccion.contenido.slice(0, 120)}${leccion.contenido.length > 120 ? '…' : ''}`
    : 'Sin contenido';
  const detalle = esCuestionario
    ? `Nota mínima: ${leccion.notaMinima ?? 0}`
    : leccion.videoUrl
      ? `Video: ${leccion.videoUrl}`
      : resumenContenido;

  return (
    <li
      draggable={!ocupada}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`flex flex-col gap-3 rounded-control border border-outline bg-surface p-4 transition-colors sm:flex-row sm:items-center sm:justify-between ${
        esCuestionario ? 'border-warning/40 bg-warning-light/20' : ''
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className="mt-0.5 shrink-0 cursor-grab text-on-surface-variant"
          title="Arrastrar para ordenar"
        >
          <Icon name="drag_indicator" className="text-[22px]" />
        </span>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-variant text-label-sm font-bold text-secondary">
          {index + 1}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="break-words text-label-md font-semibold text-secondary">
              {leccion.titulo}
            </span>
            <span
              className={`rounded px-2 py-0.5 text-label-sm font-medium ${
                esCuestionario
                  ? 'bg-secondary text-on-secondary'
                  : 'bg-primary/10 text-primary'
              }`}
            >
              {esCuestionario ? 'Cuestionario' : 'Contenido'}
            </span>
          </div>
          <span
            className={`mt-1 block break-all text-label-sm text-on-surface-variant ${
              !esCuestionario && leccion.videoUrl ? 'truncate' : ''
            }`}
          >
            {detalle}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => onMove(index, -1)}
          disabled={ocupada || index === 0}
          aria-label={`Subir ${leccion.titulo}`}
          title="Subir"
          className="rounded p-1.5 text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-secondary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Icon name="arrow_upward" className="text-[18px]" />
        </button>
        <button
          type="button"
          onClick={() => onMove(index, 1)}
          disabled={ocupada || index === total - 1}
          aria-label={`Bajar ${leccion.titulo}`}
          title="Bajar"
          className="rounded p-1.5 text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-secondary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Icon name="arrow_downward" className="text-[18px]" />
        </button>
        {!esCuestionario && (
          <>
            <button
              type="button"
              onClick={() => onEdit(leccion)}
              disabled={ocupada}
              aria-label={`Editar ${leccion.titulo}`}
              title="Editar"
              className="rounded p-1.5 text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-secondary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="edit" className="text-[18px]" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(leccion)}
              disabled={ocupada}
              aria-label={`Eliminar ${leccion.titulo}`}
              title="Eliminar"
              className="rounded p-1.5 text-error transition-colors hover:bg-error-light disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="delete" className="text-[18px]" />
            </button>
          </>
        )}
      </div>
    </li>
  );
}

export default function LessonEditor({ cursoId, lecciones = [] }) {
  const [items, setItems] = useState(lecciones);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [values, setValues] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState(null);
  const dragIndex = useRef(null);

  useEffect(() => {
    setItems(lecciones);
  }, [lecciones]);

  function abrirNueva() {
    setEditingId(null);
    setValues(emptyForm);
    setErrors({});
    setNotice(null);
    setFormOpen(true);
  }

  function abrirEdicion(leccion) {
    setEditingId(leccion.id);
    setValues({
      titulo: leccion.titulo,
      contenido: leccion.contenido ?? '',
      videoUrl: leccion.videoUrl ?? '',
    });
    setErrors({});
    setNotice(null);
    setFormOpen(true);
  }

  function cerrarFormulario() {
    if (saving) return;
    setFormOpen(false);
    setEditingId(null);
    setValues(emptyForm);
    setErrors({});
  }

  function cambiarCampo(name, value) {
    setValues((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: undefined }));
    setNotice(null);
  }

  async function guardar(event) {
    event.preventDefault();
    if (saving) return;

    const { datos, errores } = validarLeccion(values);
    setErrors(errores);
    setNotice(null);

    if (Object.keys(errores).length) return;

    setSaving(true);
    try {
      if (editingId) {
        const result = await actualizarLeccion(editingId, datos);
        setItems((previous) => previous.map((leccion) => (
          leccion.id === editingId ? result.leccion : leccion
        )));
        setNotice({ variant: 'success', message: 'Lección actualizada.' });
      } else {
        const result = await crearLeccion(cursoId, datos);
        setItems((previous) => [...previous, result.leccion].sort(
          (a, b) => a.orden - b.orden || a.id - b.id,
        ));
        setNotice({ variant: 'success', message: 'Lección creada.' });
      }

      setFormOpen(false);
      setEditingId(null);
      setValues(emptyForm);
      setErrors({});
    } catch (err) {
      setErrors(toFieldErrors(err.details, ['titulo', 'contenido', 'videoUrl']));
      setNotice({ variant: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function borrar(leccion) {
    if (pending) return;
    if (!window.confirm(`¿Eliminar «${leccion.titulo}»? Esta acción no se puede deshacer.`)) {
      return;
    }

    setPending(`eliminar-${leccion.id}`);
    setNotice(null);
    try {
      await eliminarLeccion(leccion.id);
      setItems((previous) => previous.filter((item) => item.id !== leccion.id));
      setNotice({ variant: 'success', message: 'Lección eliminada.' });
    } catch (err) {
      setNotice({ variant: 'error', message: err.message });
    } finally {
      setPending(null);
    }
  }

  async function guardarOrden(next) {
    const anterior = items;
    setPending('orden');
    setNotice(null);
    setItems(next);

    try {
      const result = await reordenarLecciones(
        cursoId,
        next.map((leccion) => leccion.id),
      );
      setItems(result.lecciones);
      setNotice({ variant: 'success', message: 'Orden de lecciones actualizado.' });
    } catch (err) {
      setItems(anterior);
      setNotice({ variant: 'error', message: err.message });
    } finally {
      setPending(null);
    }
  }

  function mover(index, delta) {
    if (pending) return;
    const next = moverLeccion(items, index, delta);

    if (next !== items) {
      guardarOrden(next);
    }
  }

  function soltar(index) {
    const desde = dragIndex.current;
    dragIndex.current = null;

    if (desde === null || desde === index || pending) return;

    const next = reordenarLista(items, desde, index);

    if (next !== items) {
      guardarOrden(next);
    }
  }

  return (
    <section className="space-y-6 rounded-panel border border-outline bg-surface p-6 shadow-card md:p-8">
      <header className="flex flex-col gap-4 border-b border-outline pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-headline-sm text-secondary">
            2. Estructura del temario y lecciones
          </h2>
          <p className="text-body-sm text-on-surface-variant">
            {items.length} {items.length === 1 ? 'lección' : 'lecciones'}. Reordena con las
            flechas o arrastrando. Los cuestionarios conservan su lugar en la secuencia.
          </p>
        </div>
        <Button icon="post_add" iconPosition="start" onClick={abrirNueva} disabled={saving || pending !== null}>
          Agregar lección de contenido
        </Button>
      </header>

      {notice && <Alert variant={notice.variant}>{notice.message}</Alert>}

      {formOpen && (
        <LessonForm
          values={values}
          errors={errors}
          editing={Boolean(editingId)}
          saving={saving}
          onChange={cambiarCampo}
          onSubmit={guardar}
          onCancel={cerrarFormulario}
        />
      )}

      {items.length === 0 ? (
        <div className="rounded-control border border-dashed border-outline bg-surface-variant/30 p-6 text-center">
          <p className="text-body-md font-semibold text-secondary">Todavía no hay lecciones</p>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Agrega la primera lección de contenido para que el curso pueda publicarse.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((leccion, index) => (
            <LessonRow
              key={leccion.id}
              leccion={leccion}
              index={index}
              total={items.length}
              pending={pending}
              onEdit={abrirEdicion}
              onDelete={borrar}
              onMove={mover}
              onDragStart={(event) => {
                dragIndex.current = index;
                event.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(event) => {
                event.preventDefault();
                soltar(index);
              }}
              onDragEnd={() => {
                dragIndex.current = null;
              }}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
