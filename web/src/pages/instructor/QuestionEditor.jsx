import { useState } from 'react';
import Alert from '../../components/Alert.jsx';
import Button from '../../components/Button.jsx';
import FormField from '../../components/FormField.jsx';
import Icon from '../../components/Icon.jsx';
import {
  actualizarCuestionario,
  actualizarPregunta,
  crearPregunta,
  eliminarPregunta,
} from '../../services/pregunta.service.js';
import { toFieldErrors } from '../../utils/validation.js';
import {
  NOTA_MINIMA_POR_DEFECTO,
  quitarOpcion,
  toPreguntaErrors,
  validarNotaMinima,
  validarPregunta,
} from './quizForm.js';

const controlClass = 'w-full rounded-control border border-outline bg-surface px-3.5 py-2.5 text-body-md text-secondary placeholder:text-on-surface-variant/70 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary aria-invalid:border-error';

const emptyPregunta = { enunciado: '', opciones: ['', ''], indiceCorrecto: -1 };

function QuestionForm({
  values,
  errors,
  editing,
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
      <FormField
        label="Enunciado de la pregunta"
        maxLength={500}
        required
        error={errors.enunciado}
        value={values.enunciado}
        onChange={(event) => onChange('enunciado', event.target.value)}
      />

      <fieldset className="space-y-2">
        <legend className="mb-1.5 block text-label-md text-secondary">
          Opciones de respuesta <span className="text-error">*</span>
        </legend>

        {values.opciones.map((opcion, index) => {
          const esCorrecta = values.indiceCorrecto === index;

          return (
            <div
              key={index}
              className={`flex items-center gap-3 rounded-control border p-2 ${
                esCorrecta ? 'border-success bg-success-light/40' : 'border-outline bg-surface'
              }`}
            >
              <input
                type="radio"
                name="opcion-correcta"
                checked={esCorrecta}
                onChange={() => onChange('indiceCorrecto', index)}
                aria-label={`Marcar opción ${index + 1} como correcta`}
                className="h-4 w-4 shrink-0 accent-primary"
              />
              <input
                type="text"
                value={opcion}
                maxLength={300}
                onChange={(event) => onChangeOpcion(index, event.target.value)}
                aria-label={`Texto de la opción ${index + 1}`}
                className={controlClass}
              />
              <button
                type="button"
                onClick={() => onRemoveOpcion(index)}
                disabled={values.opciones.length <= 2}
                aria-label={`Eliminar opción ${index + 1}`}
                title="Eliminar opción"
                className="shrink-0 rounded p-1.5 text-error transition-colors hover:bg-error-light disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Icon name="delete" className="text-[18px]" />
              </button>
            </div>
          );
        })}

        {errors.opciones && (
          <p role="alert" className="text-label-sm font-medium text-error">
            {errors.opciones}
          </p>
        )}
        {errors.indiceCorrecto && (
          <p role="alert" className="text-label-sm font-medium text-error">
            {errors.indiceCorrecto}
          </p>
        )}

        <button
          type="button"
          onClick={onAddOpcion}
          className="flex items-center gap-1 text-label-sm font-semibold text-primary hover:underline"
        >
          <Icon name="add" className="text-[16px]" />
          Añadir otra opción
        </button>
      </fieldset>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" icon="save" iconPosition="start" loading={saving}>
          {saving ? 'Guardando…' : editing ? 'Guardar pregunta' : 'Crear pregunta'}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

export default function QuestionEditor({ leccion, onUpdate, onClose }) {
  const [preguntas, setPreguntas] = useState(leccion.preguntas ?? []);
  const [nota, setNota] = useState(leccion.notaMinima ?? NOTA_MINIMA_POR_DEFECTO);
  const [notaInput, setNotaInput] = useState(String(leccion.notaMinima ?? NOTA_MINIMA_POR_DEFECTO));
  const [notaError, setNotaError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [values, setValues] = useState(emptyPregunta);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savingNota, setSavingNota] = useState(false);
  const [pending, setPending] = useState(null);

  function notificar(nextPreguntas, nextNota = nota) {
    onUpdate({ ...leccion, notaMinima: nextNota, preguntas: nextPreguntas });
  }

  function abrirNueva() {
    setEditingId(null);
    setValues({ ...emptyPregunta, opciones: ['', ''] });
    setErrors({});
    setNotice(null);
    setFormOpen(true);
  }

  function abrirEdicion(pregunta) {
    setEditingId(pregunta.id);
    setValues({
      enunciado: pregunta.enunciado,
      opciones: [...pregunta.opciones],
      indiceCorrecto: pregunta.indiceCorrecto,
    });
    setErrors({});
    setNotice(null);
    setFormOpen(true);
  }

  function cerrarFormulario() {
    if (saving) return;
    setFormOpen(false);
    setEditingId(null);
    setValues({ ...emptyPregunta, opciones: ['', ''] });
    setErrors({});
  }

  function cambiarCampo(name, value) {
    setValues((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: undefined }));
    setNotice(null);
  }

  function cambiarOpcion(index, value) {
    setValues((previous) => ({
      ...previous,
      opciones: previous.opciones.map((opcion, posicion) => (
        posicion === index ? value : opcion
      )),
    }));
    setErrors((previous) => ({ ...previous, opciones: undefined }));
    setNotice(null);
  }

  function agregarOpcion() {
    setValues((previous) => ({
      ...previous,
      opciones: [...previous.opciones, ''],
    }));
    setNotice(null);
  }

  function eliminarOpcion(index) {
    setValues((previous) => ({
      ...previous,
      ...quitarOpcion(previous.opciones, previous.indiceCorrecto, index),
    }));
    setErrors((previous) => ({ ...previous, opciones: undefined, indiceCorrecto: undefined }));
    setNotice(null);
  }

  async function guardarPregunta(event) {
    event.preventDefault();
    if (saving) return;

    const { datos, errores } = validarPregunta(values);
    setErrors(errores);
    setNotice(null);

    if (Object.keys(errores).length) return;

    setSaving(true);
    try {
      const result = editingId
        ? await actualizarPregunta(editingId, datos)
        : await crearPregunta(leccion.id, datos);
      const guardada = result.pregunta;
      const next = editingId
        ? preguntas.map((pregunta) => (pregunta.id === editingId ? guardada : pregunta))
        : [...preguntas, guardada];

      setPreguntas(next);
      notificar(next);
      setNotice({
        variant: 'success',
        message: editingId ? 'Pregunta actualizada.' : 'Pregunta creada.',
      });
      setFormOpen(false);
      setEditingId(null);
      setValues({ ...emptyPregunta, opciones: ['', ''] });
      setErrors({});
    } catch (err) {
      setErrors(toPreguntaErrors(err.details));
      setNotice({ variant: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function borrarPregunta(pregunta) {
    if (pending) return;
    if (!window.confirm(`¿Eliminar la pregunta «${pregunta.enunciado}»? Esta acción no se puede deshacer.`)) {
      return;
    }

    setPending(`eliminar-${pregunta.id}`);
    setNotice(null);
    try {
      await eliminarPregunta(pregunta.id);
      const next = preguntas.filter((item) => item.id !== pregunta.id);
      setPreguntas(next);
      notificar(next);
      setNotice({ variant: 'success', message: 'Pregunta eliminada.' });
    } catch (err) {
      setNotice({ variant: 'error', message: err.message });
    } finally {
      setPending(null);
    }
  }

  async function guardarNota(event) {
    event.preventDefault();
    if (savingNota) return;

    const { valor, error } = validarNotaMinima(notaInput);
    setNotaError(error);
    setNotice(null);

    if (error) return;

    setSavingNota(true);
    try {
      const result = await actualizarCuestionario(leccion.id, { notaMinima: valor });
      setNota(valor);
      setNotaInput(String(valor));
      onUpdate({ ...result.leccion, preguntas });
      setNotice({ variant: 'success', message: 'Nota mínima actualizada.' });
    } catch (err) {
      const fieldErrors = toFieldErrors(err.details, ['notaMinima']);
      setNotaError(fieldErrors.notaMinima ?? null);
      setNotice({ variant: 'error', message: err.message });
    } finally {
      setSavingNota(false);
    }
  }

  return (
    <section className="space-y-5 rounded-panel border border-outline bg-surface p-5 shadow-card md:p-6">
      <header className="flex flex-col gap-3 border-b border-outline pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant">
            Editor de preguntas
          </p>
          <h3 className="break-words text-headline-sm text-secondary">{leccion.titulo}</h3>
          <p className="text-body-sm text-on-surface-variant">
            Define enunciados, opciones y marca la respuesta correcta. La calificación se
            resuelve en el servidor y nunca se envía al estudiante.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded bg-surface-variant px-2.5 py-0.5 text-label-sm font-semibold text-secondary">
            Nota mínima: {nota}/100
          </span>
          {onClose && (
            <Button variant="ghost" onClick={onClose} aria-label="Cerrar editor de preguntas">
              Cerrar
            </Button>
          )}
        </div>
      </header>

      {notice && <Alert variant={notice.variant}>{notice.message}</Alert>}

      <form
        noValidate
        onSubmit={guardarNota}
        className="flex flex-col gap-3 rounded-control border border-outline bg-surface-variant/30 p-4 sm:flex-row sm:items-end"
      >
        <FormField
          id="nota-minima-cuestionario"
          label="Nota mínima de aprobación"
          type="number"
          min={1}
          max={100}
          step={1}
          required
          hint="Valor entero entre 1 y 100."
          error={notaError}
          value={notaInput}
          onChange={(event) => {
            setNotaInput(event.target.value);
            setNotaError(null);
            setNotice(null);
          }}
          className="sm:max-w-xs"
        />
        <Button type="submit" variant="secondary" icon="save" iconPosition="start" loading={savingNota}>
          {savingNota ? 'Guardando…' : 'Guardar nota'}
        </Button>
      </form>

      {formOpen && (
        <QuestionForm
          values={values}
          errors={errors}
          editing={Boolean(editingId)}
          saving={saving}
          onChange={cambiarCampo}
          onChangeOpcion={cambiarOpcion}
          onAddOpcion={agregarOpcion}
          onRemoveOpcion={eliminarOpcion}
          onSubmit={guardarPregunta}
          onCancel={cerrarFormulario}
        />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-body-sm text-on-surface-variant">
          {preguntas.length} {preguntas.length === 1 ? 'pregunta configurada' : 'preguntas configuradas'}
        </p>
        <Button icon="add" iconPosition="start" onClick={abrirNueva} disabled={saving || pending !== null}>
          Agregar pregunta
        </Button>
      </div>

      {preguntas.length === 0 ? (
        <div className="rounded-control border border-dashed border-outline bg-surface-variant/30 p-6 text-center">
          <p className="text-body-md font-semibold text-secondary">Todavía no hay preguntas</p>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Agrega la primera pregunta de opción múltiple para este cuestionario.
          </p>
        </div>
      ) : (
        <ol className="space-y-3">
          {preguntas.map((pregunta, index) => (
            <li
              key={pregunta.id}
              className="flex flex-col gap-3 rounded-control border border-outline bg-surface p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0">
                <p className="break-words text-label-md font-semibold text-secondary">
                  {index + 1}. {pregunta.enunciado}
                </p>
                <ul className="mt-2 space-y-1">
                  {pregunta.opciones.map((opcion, posicion) => (
                    <li
                      key={posicion}
                      className={`flex items-start gap-1.5 text-label-sm ${
                        posicion === pregunta.indiceCorrecto
                          ? 'font-semibold text-success'
                          : 'text-on-surface-variant'
                      }`}
                    >
                      <Icon
                        name={posicion === pregunta.indiceCorrecto ? 'check_circle' : 'radio_button_unchecked'}
                        filled={posicion === pregunta.indiceCorrecto}
                        className="mt-0.5 text-[16px]"
                      />
                      <span className="break-words">{opcion}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => abrirEdicion(pregunta)}
                  disabled={pending !== null || saving}
                  aria-label={`Editar pregunta ${index + 1}`}
                  title="Editar pregunta"
                  className="rounded p-1.5 text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-secondary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Icon name="edit" className="text-[18px]" />
                </button>
                <button
                  type="button"
                  onClick={() => borrarPregunta(pregunta)}
                  disabled={pending !== null || saving}
                  aria-label={`Eliminar pregunta ${index + 1}`}
                  title="Eliminar pregunta"
                  className="rounded p-1.5 text-error transition-colors hover:bg-error-light disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Icon name="delete" className="text-[18px]" />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
