function numeroONull(valor) {
  if (valor === null || valor === undefined || valor === '') {
    return null;
  }

  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function numeroO(valor, defecto = 0) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : defecto;
}

export function normalizarIntento(intento = {}) {
  return {
    nota: numeroONull(intento?.nota),
    aprobada: intento?.aprobada === true,
    mejorNota: numeroONull(intento?.mejorNota),
    notaMinima: numeroONull(intento?.notaMinima),
    intentos: numeroO(intento?.intentos, 0),
    // Si la API no informa los intentos disponibles, se asume cero para no
    // habilitar un envío que el servidor podría rechazar.
    intentosDisponibles: numeroO(intento?.intentosDisponibles, 0),
  };
}

export function totalIntentos(intento) {
  return numeroO(intento?.intentos, 0) + numeroO(intento?.intentosDisponibles, 0);
}

export function crearSeleccionInicial(preguntas = []) {
  return (Array.isArray(preguntas) ? preguntas : []).reduce((seleccion, pregunta) => {
    seleccion[String(pregunta.id)] = null;
    return seleccion;
  }, {});
}

export function respuestaSeleccionada(seleccion, preguntaId) {
  const valor = seleccion?.[String(preguntaId)];
  return Number.isInteger(valor) ? valor : null;
}

export function respuestasPendientes(preguntas = [], seleccion = {}) {
  return (Array.isArray(preguntas) ? preguntas : []).filter(
    (pregunta) => respuestaSeleccionada(seleccion, pregunta.id) === null,
  );
}

export function aRespuestas(preguntas = [], seleccion = {}) {
  return (Array.isArray(preguntas) ? preguntas : []).map((pregunta) => ({
    preguntaId: Number(pregunta.id),
    opcion: respuestaSeleccionada(seleccion, pregunta.id),
  }));
}
