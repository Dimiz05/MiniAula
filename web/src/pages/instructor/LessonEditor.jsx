import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Alert from '../../components/Alert.jsx';
import Button from '../../components/Button.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import FormActions from '../../components/FormActions.jsx';
import FormField from '../../components/FormField.jsx';
import Icon from '../../components/Icon.jsx';
import RowActions from '../../components/RowActions.jsx';
import { controlClass } from '../../components/formControl.js';
import {
  actualizarLeccion,
  crearLeccion,
  eliminarLeccion,
  reordenarLecciones,
} from '../../services/leccion.service.js';
import { toFieldErrors } from '../../utils/validation.js';
import { moverLeccion, reordenarLista, validarLeccion } from './lessonForm.js';
import {
  NOTA_MINIMA_POR_DEFECTO,
  quitarOpcion,
  toQuizErrors,
  validarPregunta,
  validarQuiz,
} from './quizForm.js';
import QuestionEditor, { QuestionFields } from './QuestionEditor.jsx';

const emptyForm = { titulo: '', contenido: '', videoUrl: '' };
const emptyQuizForm = {
  titulo: '',
  notaMinima: String(NOTA_MINIMA_POR_DEFECTO),
  enunciado: '',
  opciones: ['', ''],
  indiceCorrecto: -1,
};

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

      <FormActions flush status={saving ? 'Guardando…' : null}>
        <Button type="submit" icon="save" iconPosition="start" loading={saving}>
          {saving ? 'Guardando…' : editing ? 'Guardar lección' : 'Crear lección'}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
      </FormActions>
    </form>
  );
}

function QuizForm({
  values,
  errors,
  saving,
  onChange,
  onChangeOpcion,
  onAddOpcion,
  onRemoveOpcion,
  onSubmit,
  onCancel,
}) {
  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="space-y-4 rounded-control border border-outline bg-surface-variant/30 p-4"
    >
      <div>
        <p className="text-label-md font-semibold text-secondary">Nuevo cuestionario</p>
        <p className="mt-1 text-label-sm text-on-surface-variant">
          Un cuestionario se crea con al menos una pregunta. Podrás agregar más después con
          «Editar preguntas».
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Título del cuestionario"
          maxLength={150}
          required
          error={errors.titulo}
          value={values.titulo}
          onChange={(event) => onChange('titulo', event.target.value)}
        />

        <FormField
          label="Nota mínima de aprobación"
          type="number"
          min={1}
          max={100}
          step={1}
          required
          hint="Valor entero entre 1 y 100."
          error={errors.notaMinima}
          value={values.notaMinima}
          onChange={(event) => onChange('notaMinima', event.target.value)}
        />
      </div>

      <div className="space-y-4 rounded-control border border-outline bg-surface p-4">
        <div>
          <p className="text-label-md font-semibold text-secondary">Primera pregunta</p>
          <p className="mt-1 text-label-sm text-on-surface-variant">
            Marca la opción correcta. La calificación se resuelve en el servidor.
          </p>
        </div>

        <QuestionFields
          values={values}
          errors={errors}
          onChange={onChange}
          onChangeOpcion={onChangeOpcion}
          onAddOpcion={onAddOpcion}
          onRemoveOpcion={onRemoveOpcion}
        />
      </div>

      <FormActions flush status={saving ? 'Guardando…' : null}>
        <Button type="submit" icon="save" iconPosition="start" loading={saving}>
          {saving ? 'Guardando…' : 'Crear cuestionario'}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
      </FormActions>
    </form>
  );
}

function LessonRow({
  leccion,
  index,
  total,
  pending,
  dragging = false,
  dragOver = false,
  onEdit,
  onEditQuestions,
  onDelete,
  onMove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) {
  const esCuestionario = leccion.tipo === 'cuestionario';
  const ocupada = pending !== null;
  const totalPreguntas = Array.isArray(leccion.preguntas) ? leccion.preguntas.length : 0;
  const resumenContenido = leccion.contenido
    ? `${leccion.contenido.slice(0, 120)}${leccion.contenido.length > 120 ? '…' : ''}`
    : 'Sin contenido';
  const detalle = esCuestionario
    ? `${totalPreguntas} ${totalPreguntas === 1 ? 'pregunta configurada' : 'preguntas configuradas'} · Nota mínima: ${leccion.notaMinima ?? 0}`
    : leccion.videoUrl
      ? `Video: ${leccion.videoUrl}`
      : resumenContenido;

  return (
    <li
      data-lesson-id={leccion.id}
      draggable={!ocupada}
      title={ocupada ? undefined : 'Arrastra el bloque para reordenarlo'}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`flex flex-col gap-3 rounded-control border border-outline bg-surface p-4 transition-[border-color,box-shadow,opacity] duration-200 sm:flex-row sm:items-center sm:justify-between ${
        esCuestionario ? 'bg-surface-variant/40' : ''
      } ${dragging ? 'cursor-grabbing opacity-60 shadow-hover' : 'cursor-grab'} ${
        dragOver && !dragging ? 'border-primary ring-2 ring-primary/25' : ''
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 hidden h-11 w-8 shrink-0 items-center justify-center text-on-surface-variant sm:flex [@media(pointer:coarse)]:hidden"
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

      <RowActions
        label={`Más acciones de ${leccion.titulo}`}
        disabled={ocupada}
        primary={
          esCuestionario ? (
            <Button
              variant="secondary"
              icon="tune"
              onClick={() => onEditQuestions(leccion)}
              disabled={ocupada}
              aria-label={`Editar preguntas de ${leccion.titulo}`}
            >
              Editar preguntas
            </Button>
          ) : (
            <Button
              variant="secondary"
              icon="edit"
              onClick={() => onEdit(leccion)}
              disabled={ocupada}
              aria-label={`Editar ${leccion.titulo}`}
            >
              Editar
            </Button>
          )
        }
        items={[
          {
            label: 'Subir',
            icon: 'arrow_upward',
            disabled: ocupada || index === 0,
            onClick: () => onMove(index, -1),
          },
          {
            label: 'Bajar',
            icon: 'arrow_downward',
            disabled: ocupada || index === total - 1,
            onClick: () => onMove(index, 1),
          },
          ...(!esCuestionario
            ? [
                {
                  label: 'Eliminar',
                  icon: 'delete',
                  danger: true,
                  disabled: ocupada,
                  onClick: () => onDelete(leccion),
                },
              ]
            : []),
        ]}
      />
    </li>
  );
}

export default function LessonEditor({ cursoId, lecciones = [], onCountChange }) {
  const [items, setItems] = useState(lecciones);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [values, setValues] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);
  const [quizFormOpen, setQuizFormOpen] = useState(false);
  const [quizValues, setQuizValues] = useState(emptyQuizForm);
  const [quizErrors, setQuizErrors] = useState({});
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [pending, setPending] = useState(null);
  const [quizId, setQuizId] = useState(null);
  const [leccionAEliminar, setLeccionAEliminar] = useState(null);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const dragIndex = useRef(null);
  const listRef = useRef(null);
  const posicionesAnteriores = useRef(new Map());

  useEffect(() => {
    setItems(lecciones);
  }, [lecciones]);

  function capturarPosiciones() {
    const lista = listRef.current;
    if (!lista) return new Map();

    return new Map(
      [...lista.querySelectorAll('[data-lesson-id]')].map((nodo) => [
        nodo.dataset.lessonId,
        nodo.offsetTop,
      ]),
    );
  }

  // FLIP animation: when the order changes, each row starts at its old
  // position and slides to the new one. Both drag-and-drop and the
  // "Subir/Bajar" actions share this path.
  useLayoutEffect(() => {
    const anteriores = posicionesAnteriores.current;
    posicionesAnteriores.current = new Map();

    if (anteriores.size === 0) return;
    if (
      typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const lista = listRef.current;
    if (!lista) return;

    lista.querySelectorAll('[data-lesson-id]').forEach((nodo) => {
      const antes = anteriores.get(nodo.dataset.lessonId);
      if (antes === undefined || typeof nodo.animate !== 'function') return;

      const desplazamiento = antes - nodo.offsetTop;
      if (Math.abs(desplazamiento) < 1) return;

      nodo.animate(
        [
          { transform: `translateY(${desplazamiento}px)` },
          { transform: 'translateY(0)' },
        ],
        { duration: 280, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
      );
    });
  }, [items]);

  useEffect(() => {
    onCountChange?.(items.length);
  }, [items.length, onCountChange]);

  const leccionCuestionario = items.find(
    (item) => item.id === quizId && item.tipo === 'cuestionario',
  ) ?? null;

  function actualizarCuestionarioEnLista(leccionActualizada) {
    setItems((previous) => previous.map((item) => (
      item.id === leccionActualizada.id ? { ...item, ...leccionActualizada } : item
    )));
  }

  function abrirNueva() {
    setEditingId(null);
    setValues(emptyForm);
    setErrors({});
    setQuizFormOpen(false);
    setNotice(null);
    setFormOpen(true);
  }

  function abrirNuevoCuestionario() {
    setEditingId(null);
    setFormOpen(false);
    setQuizId(null);
    setQuizValues(emptyQuizForm);
    setQuizErrors({});
    setNotice(null);
    setQuizFormOpen(true);
  }

  function cerrarFormularioCuestionario() {
    if (savingQuiz) return;
    setQuizFormOpen(false);
    setQuizValues(emptyQuizForm);
    setQuizErrors({});
  }

  function cambiarCampoCuestionario(name, value) {
    setQuizValues((previous) => ({ ...previous, [name]: value }));
    setQuizErrors((previous) => ({ ...previous, [name]: undefined }));
    setNotice(null);
  }

  function cambiarOpcionCuestionario(index, value) {
    setQuizValues((previous) => ({
      ...previous,
      opciones: previous.opciones.map((opcion, posicion) => (
        posicion === index ? value : opcion
      )),
    }));
    setQuizErrors((previous) => ({ ...previous, opciones: undefined }));
    setNotice(null);
  }

  function agregarOpcionCuestionario() {
    setQuizValues((previous) => ({
      ...previous,
      opciones: [...previous.opciones, ''],
    }));
    setNotice(null);
  }

  function eliminarOpcionCuestionario(index) {
    setQuizValues((previous) => ({
      ...previous,
      ...quitarOpcion(previous.opciones, previous.indiceCorrecto, index),
    }));
    setQuizErrors((previous) => ({
      ...previous,
      opciones: undefined,
      indiceCorrecto: undefined,
    }));
    setNotice(null);
  }

  async function guardarCuestionario(event) {
    event.preventDefault();
    if (savingQuiz) return;

    const meta = validarQuiz({
      titulo: quizValues.titulo,
      notaMinima: quizValues.notaMinima,
    });
    const pregunta = validarPregunta(quizValues);
    const errores = { ...meta.errores, ...pregunta.errores };
    setQuizErrors(errores);
    setNotice(null);

    if (Object.keys(errores).length) return;

    setSavingQuiz(true);
    try {
      const result = await crearLeccion(cursoId, {
        titulo: meta.datos.titulo,
        tipo: 'cuestionario',
        notaMinima: meta.datos.notaMinima,
        preguntas: [pregunta.datos],
      });
      setItems((previous) => [...previous, result.leccion].sort(
        (a, b) => a.orden - b.orden || a.id - b.id,
      ));
      setQuizFormOpen(false);
      setQuizValues(emptyQuizForm);
      setQuizErrors({});
      setQuizId(result.leccion.id);
      setNotice({
        variant: 'success',
        message: 'Cuestionario creado con su primera pregunta.',
      });
    } catch (err) {
      setQuizErrors(toQuizErrors(err.details));
      setNotice({ variant: 'error', message: err.message });
    } finally {
      setSavingQuiz(false);
    }
  }

  function abrirEdicion(leccion) {
    setEditingId(leccion.id);
    setQuizFormOpen(false);
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

  function pedirBorrado(leccion) {
    if (pending) return;
    setLeccionAEliminar(leccion);
  }

  async function borrar(leccion) {
    if (pending) return;

    setPending(`eliminar-${leccion.id}`);
    setNotice(null);
    try {
      await eliminarLeccion(leccion.id);
      posicionesAnteriores.current = capturarPosiciones();
      setItems((previous) => previous.filter((item) => item.id !== leccion.id));
      if (quizId === leccion.id) {
        setQuizId(null);
      }
      setNotice({ variant: 'success', message: 'Lección eliminada.' });
    } catch (err) {
      setNotice({ variant: 'error', message: err.message });
    } finally {
      setPending(null);
    }
  }

  async function guardarOrden(next) {
    const anterior = items;
    posicionesAnteriores.current = capturarPosiciones();
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
      posicionesAnteriores.current = capturarPosiciones();
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
    setDraggingIndex(null);
    setDragOverIndex(null);

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
            flechas o arrastrando. Agrega contenido o un cuestionario; ambos forman parte de
            la secuencia y pueden reordenarse.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="secondary"
            icon="quiz"
            iconPosition="start"
            onClick={abrirNuevoCuestionario}
            disabled={saving || savingQuiz || pending !== null}
          >
            Agregar cuestionario
          </Button>
          <Button
            icon="post_add"
            iconPosition="start"
            onClick={abrirNueva}
            disabled={saving || savingQuiz || pending !== null}
          >
            Agregar lección de contenido
          </Button>
        </div>
      </header>

      {notice && <Alert variant={notice.variant}>{notice.message}</Alert>}

      {quizFormOpen && (
        <QuizForm
          values={quizValues}
          errors={quizErrors}
          saving={savingQuiz}
          onChange={cambiarCampoCuestionario}
          onChangeOpcion={cambiarOpcionCuestionario}
          onAddOpcion={agregarOpcionCuestionario}
          onRemoveOpcion={eliminarOpcionCuestionario}
          onSubmit={guardarCuestionario}
          onCancel={cerrarFormularioCuestionario}
        />
      )}

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
        <ul ref={listRef} className="space-y-3">
          {items.map((leccion, index) => (
            <LessonRow
              key={leccion.id}
              leccion={leccion}
              index={index}
              total={items.length}
              pending={pending}
              dragging={draggingIndex === index}
              dragOver={dragOverIndex === index}
              onEdit={abrirEdicion}
              onEditQuestions={(leccion) => {
                setNotice(null);
                setQuizFormOpen(false);
                setQuizId(leccion.id);
              }}
              onDelete={pedirBorrado}
              onMove={mover}
              onDragStart={(event) => {
                dragIndex.current = index;
                setDraggingIndex(index);
                event.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
                if (dragOverIndex !== index) {
                  setDragOverIndex(index);
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                soltar(index);
              }}
              onDragEnd={() => {
                dragIndex.current = null;
                setDraggingIndex(null);
                setDragOverIndex(null);
              }}
            />
          ))}
        </ul>
      )}

      {leccionCuestionario && (
        <QuestionEditor
          key={leccionCuestionario.id}
          leccion={leccionCuestionario}
          onUpdate={actualizarCuestionarioEnLista}
          onClose={() => setQuizId(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(leccionAEliminar)}
        title="¿Eliminar esta lección?"
        description={`«${leccionAEliminar?.titulo ?? ''}» y sus preguntas dejarán de estar disponibles. El progreso asociado también se elimina y no se puede deshacer.`}
        confirmLabel="Eliminar lección"
        onCancel={() => setLeccionAEliminar(null)}
        onConfirm={() => {
          const leccion = leccionAEliminar;
          setLeccionAEliminar(null);
          if (leccion) borrar(leccion);
        }}
      />
    </section>
  );
}
