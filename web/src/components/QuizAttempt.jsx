import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import Alert from './Alert.jsx';
import Button from './Button.jsx';
import Icon from './Icon.jsx';
import {
  enviarIntento,
  obtenerCuestionarioEstudiante,
} from '../services/leccion.service.js';
import {
  rutaLeccion,
  siguienteLeccionDespuesDe,
} from '../utils/lessonState.js';
import {
  aRespuestas,
  crearSeleccionInicial,
  normalizarIntento,
  respuestaSeleccionada,
  respuestasPendientes,
  totalIntentos,
} from '../utils/quizState.js';

function MensajeError({ error, title = 'No pudimos registrar el intento' }) {
  const detalles = Array.isArray(error?.details)
    ? error.details.filter((detalle) => detalle?.mensaje)
    : [];

  return (
    <Alert variant="error" title={title}>
      <p>{error?.message ?? 'Inténtalo de nuevo en unos momentos.'}</p>
      {detalles.length > 0 && (
        <ul className="mt-2 list-inside list-disc space-y-1">
          {detalles.map((detalle, indice) => (
            <li key={`${detalle.campo ?? 'detalle'}-${indice}`}>
              {detalle.mensaje}
            </li>
          ))}
        </ul>
      )}
    </Alert>
  );
}

export function ResumenIntento({ intento }) {
  return (
    <section
      aria-label="Estado actual del cuestionario"
      className="rounded-panel border border-outline bg-surface p-5 shadow-card"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-label-sm text-on-surface-variant">
            Mejor nota guardada
          </p>
          <p className="mt-1 text-label-lg font-bold text-primary tabular-nums">
            {intento?.mejorNota ?? '—'} / 100
          </p>
        </div>
        <div>
          <p className="text-label-sm text-on-surface-variant">Estado</p>
          <p
            className={`mt-1 text-label-lg font-bold ${
              intento?.aprobada ? 'text-success' : 'text-warning'
            }`}
          >
            {intento?.aprobada ? 'Aprobado' : 'Aún no aprobado'}
          </p>
        </div>
        <div>
          <p className="text-label-sm text-on-surface-variant">
            Intentos restantes
          </p>
          <p className="mt-1 text-label-lg font-bold text-secondary tabular-nums">
            {intento?.intentosDisponibles ?? 0} de {totalIntentos(intento)}
          </p>
        </div>
      </div>
    </section>
  );
}

export function QuizResultado({
  intento,
  onReintentar,
  puedeReintentar = false,
  siguiente = null,
  cursoId = null,
}) {
  const aprobada = intento?.aprobada === true;
  const tieneNota = intento?.nota !== null && intento?.nota !== undefined;
  const notaMinima = intento?.notaMinima;
  const total = totalIntentos(intento);
  const mensaje = aprobada
    ? tieneNota
      ? `Superaste la nota mínima de ${notaMinima} puntos.`
      : `Tu mejor nota guardada alcanza la nota mínima de ${notaMinima} puntos.`
    : `La nota mínima es ${notaMinima} puntos.`;

  return (
    <section
      aria-label="Resultado del cuestionario"
      className={`overflow-hidden rounded-panel border bg-surface p-6 shadow-card md:p-8 ${
        aprobada ? 'border-success/40' : 'border-warning/40'
      }`}
    >
      <div className="flex flex-col gap-4 border-b border-outline pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${
              aprobada
                ? 'bg-success-light text-success'
                : 'bg-warning-light text-warning'
            }`}
          >
            <Icon
              name={aprobada ? 'verified' : 'error'}
              filled
              className="text-[30px]"
            />
          </div>
          <div>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-label-sm font-semibold ${
                aprobada
                  ? 'bg-success-light text-success'
                  : 'bg-warning-light text-warning'
              }`}
            >
              {aprobada ? 'Aprobado' : 'Reprobado'}
            </span>
            <h2 className="mt-1 text-headline-sm text-secondary">
              {tieneNota ? 'Resultado del intento' : 'Estado del cuestionario'}
            </h2>
            <p className="text-body-sm text-on-surface-variant">{mensaje}</p>
          </div>
        </div>

        {tieneNota && (
          <div className="sm:border-l sm:border-outline sm:pl-6 sm:text-right">
            <span className="text-label-sm text-on-surface-variant">
              Nota obtenida
            </span>
            <p
              className={`text-display-lg font-bold tabular-nums ${
                aprobada ? 'text-success' : 'text-warning'
              }`}
            >
              {intento.nota}
              <span className="text-body-lg text-on-surface-variant">/100</span>
            </p>
          </div>
        )}
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-control border border-outline bg-surface-variant/40 p-4">
          <dt className="text-label-sm text-on-surface-variant">
            Estado de aprobación
          </dt>
          <dd
            className={`mt-1 text-label-lg font-bold ${
              aprobada ? 'text-success' : 'text-warning'
            }`}
          >
            {aprobada ? 'Aprobado' : 'Reprobado'}
          </dd>
        </div>
        <div className="rounded-control border border-outline bg-surface-variant/40 p-4">
          <dt className="text-label-sm text-on-surface-variant">
            Intentos restantes
          </dt>
          <dd className="mt-1 text-label-lg font-bold text-secondary tabular-nums">
            {intento?.intentosDisponibles ?? 0} de {total}
          </dd>
        </div>
        <div className="rounded-control border border-outline bg-surface-variant/40 p-4">
          <dt className="text-label-sm text-on-surface-variant">
            Mejor nota guardada
          </dt>
          <dd className="mt-1 text-label-lg font-bold text-primary tabular-nums">
            {intento?.mejorNota ?? '—'} / 100
          </dd>
        </div>
      </dl>

      {aprobada && siguiente && cursoId && (
        <div className="mt-6 flex items-start gap-3 rounded-control border border-success/30 bg-success-light p-4">
          <Icon
            name="check_circle"
            filled
            className="mt-0.5 text-[20px] text-success"
          />
          <p className="text-body-md text-secondary">
            ¡Felicitaciones! Superaste la nota mínima requerida. La siguiente
            lección del curso fue desbloqueada automáticamente en tu cuenta.
          </p>
        </div>
      )}

      {(puedeReintentar || (aprobada && siguiente && cursoId)) && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-label-sm text-on-surface-variant">
            {aprobada
              ? siguiente
                ? 'La siguiente lección ya está disponible.'
                : 'Puedes repetir el cuestionario para mejorar tu mejor nota.'
              : 'La calificación y los intentos los valida el servidor.'}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {puedeReintentar && typeof onReintentar === 'function' && (
              <Button variant="secondary" icon="replay" onClick={onReintentar}>
                {aprobada
                  ? 'Reintentar para mejorar nota'
                  : 'Volver a intentarlo'}
              </Button>
            )}
            {aprobada && siguiente && cursoId && (
              <Link
                to={rutaLeccion(cursoId, siguiente.id)}
                className="inline-flex"
              >
                <Button icon="arrow_forward">Continuar al siguiente tema</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export function QuizPreguntas({
  preguntas = [],
  seleccion = {},
  onSeleccionar,
  onSubmit,
  enviando = false,
  respondidas = 0,
  total = 0,
  error = null,
}) {
  const porcentaje = total > 0 ? Math.round((respondidas * 100) / total) : 0;

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div className="rounded-panel border border-outline bg-surface p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-label-md font-bold text-secondary">
            Respondidas: {respondidas} de {total}
          </span>
          <span className="text-label-sm font-semibold text-primary tabular-nums">
            {porcentaje}% respondido
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={porcentaje}
          aria-label="Progreso del cuestionario"
          className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-variant"
        >
          <div
            className="h-2 rounded-full bg-primary transition-all duration-200"
            style={{ width: `${porcentaje}%` }}
          />
        </div>
      </div>

      {error && <MensajeError error={error} />}

      {preguntas.map((pregunta, indicePregunta) => {
        const opciones = Array.isArray(pregunta.opciones) ? pregunta.opciones : [];
        const seleccionada = respuestaSeleccionada(seleccion, pregunta.id);

        return (
          <fieldset
            key={pregunta.id}
            className="rounded-panel border border-outline bg-surface p-6 shadow-card md:p-8"
          >
            <legend className="px-2 text-label-sm font-semibold uppercase tracking-[0.14em] text-primary">
              Pregunta {indicePregunta + 1}
            </legend>
            <h2 className="text-headline-sm leading-snug text-secondary">
              {pregunta.enunciado}
            </h2>

            <div className="mt-5 space-y-3">
              {opciones.map((opcion, indiceOpcion) => {
                const inputId = `pregunta-${pregunta.id}-opcion-${indiceOpcion}`;
                const activa = seleccionada === indiceOpcion;

                return (
                  <label
                    key={inputId}
                    htmlFor={inputId}
                    className={`flex cursor-pointer items-center gap-3 rounded-control border p-4 transition-colors ${
                      activa
                        ? 'border-primary bg-primary/5'
                        : 'border-outline bg-surface hover:border-primary/50 hover:bg-surface-variant/40'
                    } ${enviando ? 'cursor-not-allowed opacity-70' : ''}`}
                  >
                    <input
                      id={inputId}
                      type="radio"
                      name={`pregunta-${pregunta.id}`}
                      value={indiceOpcion}
                      checked={activa}
                      onChange={() => onSeleccionar?.(pregunta.id, indiceOpcion)}
                      disabled={enviando}
                      className="h-4 w-4 shrink-0 accent-primary"
                    />
                    <span className="text-body-md text-secondary">{opcion}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      })}

      <div className="flex flex-col gap-3 border-t border-outline pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl text-label-sm text-on-surface-variant">
          La calificación se realiza en el servidor. El cuestionario no revela
          las respuestas correctas.
        </p>
        <Button
          type="submit"
          icon="send"
          loading={enviando}
          disabled={enviando}
        >
          {enviando ? 'Enviando respuestas…' : 'Enviar respuestas'}
        </Button>
      </div>
    </form>
  );
}

export default function QuizAttempt({
  leccion,
  onIntentoRegistrado,
  cursoId = null,
  temario = [],
}) {
  const [cuestionario, setCuestionario] = useState(null);
  const [intento, setIntento] = useState(null);
  const [seleccion, setSeleccion] = useState({});
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);
  const [recarga, setRecarga] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(null);
  const [resultado, setResultado] = useState(null);
  const envioEnCurso = useRef(false);

  useEffect(() => {
    let activo = true;

    setCargando(true);
    setErrorCarga(null);
    setErrorEnvio(null);
    setResultado(null);

    obtenerCuestionarioEstudiante(leccion.id)
      .then((respuesta) => {
        if (!activo) {
          return;
        }

        const leccionApi = respuesta?.leccion ?? null;
        const preguntas = Array.isArray(leccionApi?.preguntas)
          ? leccionApi.preguntas
          : [];

        if (!leccionApi?.id) {
          setErrorCarga(
            new Error('La respuesta del servidor no incluyó el cuestionario.'),
          );
          return;
        }

        setCuestionario(leccionApi);
        setIntento(normalizarIntento(respuesta?.intento));
        setSeleccion(crearSeleccionInicial(preguntas));
      })
      .catch((error) => {
        if (activo) {
          setErrorCarga(error);
        }
      })
      .finally(() => {
        if (activo) {
          setCargando(false);
        }
      });

    return () => {
      activo = false;
    };
  }, [leccion.id, recarga]);

  const recargar = useCallback(() => {
    setRecarga((valor) => valor + 1);
  }, []);

  const cuestionarioDesactualizado = cuestionario
    && String(cuestionario.id) !== String(leccion.id);

  if (cargando || cuestionarioDesactualizado) {
    return (
      <div
        role="status"
        className="rounded-panel border border-outline bg-surface p-8 text-center shadow-card"
      >
        <p className="text-body-md text-on-surface-variant">
          Cargando el cuestionario…
        </p>
      </div>
    );
  }

  if (errorCarga) {
    return (
      <Alert variant="error" title="No pudimos cargar el cuestionario">
        <p>{errorCarga.message}</p>
        <div className="mt-4">
          <Button variant="secondary" icon="refresh" onClick={recargar}>
            Reintentar
          </Button>
        </div>
      </Alert>
    );
  }

  if (!cuestionario) {
    return (
      <Alert variant="warning" title="Cuestionario no disponible">
        El servidor no devolvió la información del cuestionario.
      </Alert>
    );
  }

  const preguntas = Array.isArray(cuestionario.preguntas)
    ? cuestionario.preguntas
    : [];
  const intentoActual = normalizarIntento(intento);
  const pendientes = respuestasPendientes(preguntas, seleccion);
  const respondidas = preguntas.length - pendientes.length;
  const puedeRendir = intentoActual.intentosDisponibles > 0;
  const mostrarFormulario = !resultado && puedeRendir && preguntas.length > 0;

  async function manejarEnvio(event) {
    event.preventDefault();

    if (envioEnCurso.current) {
      return;
    }

    if (pendientes.length > 0) {
      setErrorEnvio({
        message: `Responde todas las preguntas antes de enviar. Te faltan ${pendientes.length}.`,
      });
      return;
    }

    envioEnCurso.current = true;
    setEnviando(true);
    setErrorEnvio(null);

    try {
      const respuesta = await enviarIntento(
        leccion.id,
        aRespuestas(preguntas, seleccion),
      );
      const siguienteIntento = normalizarIntento(respuesta?.intento);

      setIntento(siguienteIntento);
      setResultado(siguienteIntento);
      onIntentoRegistrado?.(siguienteIntento);
    } catch (error) {
      if (error?.code === 'INTENTOS_AGOTADOS') {
        setIntento((actual) => {
          const normalizado = normalizarIntento(actual);

          return {
            ...normalizado,
            intentos: totalIntentos(normalizado),
            intentosDisponibles: 0,
          };
        });
      }

      setErrorEnvio(error);
    } finally {
      envioEnCurso.current = false;
      setEnviando(false);
    }
  }

  function reintentar() {
    if (intentoActual.intentosDisponibles <= 0) {
      return;
    }

    setResultado(null);
    setErrorEnvio(null);
    setSeleccion(crearSeleccionInicial(preguntas));
  }

  const total = totalIntentos(intentoActual);
  const intentoMostrado = resultado ?? intentoActual;
  const siguiente = intentoMostrado.aprobada && cursoId
    ? siguienteLeccionDespuesDe(temario, leccion.id)
    : null;

  return (
    <div className="space-y-6">
      <header className="rounded-panel border border-outline bg-surface p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-label-sm font-semibold uppercase tracking-[0.14em] text-warning">
              <Icon name="quiz" className="text-[18px]" />
              Evaluación de conocimientos
            </p>
            <h2 className="mt-1 text-headline-md text-secondary">
              {cuestionario.titulo ?? leccion.titulo}
            </h2>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              {preguntas.length}{' '}
              {preguntas.length === 1 ? 'pregunta' : 'preguntas'} · La nota se
              calcula en el servidor.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-outline bg-surface-variant px-3 py-1 text-label-sm font-semibold text-secondary">
              Nota mínima: {intentoActual.notaMinima ?? '—'} pts
            </span>
            <span className="rounded-full border border-warning/30 bg-warning-light px-3 py-1 text-label-sm font-semibold text-warning">
              Intentos restantes: {intentoActual.intentosDisponibles} de {total}
            </span>
            {intentoActual.aprobada && (
              <span className="inline-flex items-center gap-1 rounded-full bg-success-light px-3 py-1 text-label-sm font-semibold text-success">
                <Icon name="check_circle" filled className="text-[16px]" />
                Aprobado
              </span>
            )}
          </div>
        </div>
      </header>

      {preguntas.length === 0 ? (
        <Alert variant="warning" title="Cuestionario sin preguntas">
          Este cuestionario todavía no tiene preguntas configuradas. El servidor
          no puede calificarlo.
        </Alert>
      ) : (
        <>
          {intentoActual.intentos > 0 && !resultado && (
            <ResumenIntento intento={intentoActual} />
          )}

          {errorEnvio && !mostrarFormulario && (
            <MensajeError error={errorEnvio} />
          )}

          {resultado ? (
            <QuizResultado
              intento={resultado}
              onReintentar={reintentar}
              puedeReintentar={resultado.intentosDisponibles > 0}
              siguiente={siguiente}
              cursoId={cursoId}
            />
          ) : !puedeRendir ? (
            <QuizResultado
              intento={intentoActual}
              onReintentar={null}
              puedeReintentar={false}
              siguiente={siguiente}
              cursoId={cursoId}
            />
          ) : (
            <QuizPreguntas
              preguntas={preguntas}
              seleccion={seleccion}
              onSeleccionar={(preguntaId, opcion) => {
                setSeleccion((actual) => ({
                  ...actual,
                  [String(preguntaId)]: opcion,
                }));
                setErrorEnvio(null);
              }}
              onSubmit={manejarEnvio}
              enviando={enviando}
              respondidas={respondidas}
              total={preguntas.length}
              error={errorEnvio}
            />
          )}
        </>
      )}
    </div>
  );
}
