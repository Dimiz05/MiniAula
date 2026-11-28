import { toFieldErrors } from '../../utils/validation.js';

export const NOTA_MINIMA_POR_DEFECTO = 70;

export function validarPregunta({ enunciado = '', opciones = [], indiceCorrecto = -1 } = {}) {
  const datos = {
    enunciado: enunciado.trim(),
    opciones: opciones.map((opcion) => opcion.trim()),
    indiceCorrecto,
  };
  const errores = {};

  if (!datos.enunciado) {
    errores.enunciado = 'El enunciado es obligatorio.';
  }

  if (datos.opciones.length < 2) {
    errores.opciones = 'La pregunta requiere al menos dos opciones.';
  } else if (datos.opciones.some((opcion) => !opcion)) {
    errores.opciones = 'Cada opción debe tener texto.';
  } else if (
    !Number.isInteger(datos.indiceCorrecto)
    || datos.indiceCorrecto < 0
    || datos.indiceCorrecto >= datos.opciones.length
  ) {
    errores.indiceCorrecto = 'Marca la opción correcta.';
  }

  return { datos, errores };
}

export function validarNotaMinima(valor) {
  const numero = Number(valor);

  if (!Number.isInteger(numero) || numero < 1 || numero > 100) {
    return {
      valor: null,
      error: 'La nota mínima debe ser un número entero entre 1 y 100.',
    };
  }

  return { valor: numero, error: null };
}

export function validarQuiz({ titulo = '', notaMinima = NOTA_MINIMA_POR_DEFECTO } = {}) {
  const nota = validarNotaMinima(notaMinima);
  const datos = {
    titulo: titulo.trim(),
    notaMinima: nota.valor,
  };
  const errores = {};

  if (datos.titulo.length < 3 || datos.titulo.length > 150) {
    errores.titulo = 'El título debe tener entre 3 y 150 caracteres.';
  }

  if (nota.error) {
    errores.notaMinima = nota.error;
  }

  return { datos, errores };
}

export function toPreguntaErrors(details) {
  const errores = toFieldErrors(details, ['enunciado', 'opciones', 'indiceCorrecto']);

  if (!errores.opciones && Array.isArray(details)) {
    const detalleOpcion = details.find((detalle) => (
      typeof detalle?.campo === 'string'
      && detalle.campo.startsWith('opciones')
      && typeof detalle?.mensaje === 'string'
    ));

    if (detalleOpcion) {
      errores.opciones = detalleOpcion.mensaje;
    }
  }

  return errores;
}

// La API anida los errores de la primera pregunta como `preguntas.0.campo`.
export function toQuizErrors(details) {
  const errores = toFieldErrors(details, ['titulo', 'notaMinima']);

  if (!Array.isArray(details)) {
    return errores;
  }

  const prefijo = 'preguntas.0.';

  for (const detalle of details) {
    if (
      typeof detalle?.campo !== 'string'
      || !detalle.campo.startsWith(prefijo)
      || typeof detalle?.mensaje !== 'string'
    ) {
      continue;
    }

    const campo = detalle.campo.slice(prefijo.length);

    if (
      ['enunciado', 'opciones', 'indiceCorrecto'].includes(campo)
      && !errores[campo]
    ) {
      errores[campo] = detalle.mensaje;
    }
  }

  return errores;
}

export function quitarOpcion(opciones, indiceCorrecto, indice) {
  if (opciones.length <= 2 || indice < 0 || indice >= opciones.length) {
    return { opciones, indiceCorrecto };
  }

  const siguientes = opciones.filter((_, posicion) => posicion !== indice);
  let siguienteCorrecto = indiceCorrecto;

  if (siguienteCorrecto === indice) {
    siguienteCorrecto = -1;
  } else if (siguienteCorrecto > indice) {
    siguienteCorrecto -= 1;
  }

  return { opciones: siguientes, indiceCorrecto: siguienteCorrecto };
}
