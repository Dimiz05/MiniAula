import { Curso, Leccion, Pregunta, Usuario } from '../models/index.js';

const instructorAna = 'ana.instructora@miniaula.test';
const instructorBruno = 'bruno.instructor@miniaula.test';

const cursosDemo = [
  {
    instructorEmail: instructorAna,
    titulo: 'Fundamentos de JavaScript',
    descripcion: 'Recorre las bases del lenguaje: variables, tipos, funciones, arreglos y objetos, y cierra con un cuestionario calificado.',
    categoria: 'Programación',
    nivel: 'basico',
    lecciones: [
      {
        titulo: 'Qué es JavaScript y cómo se ejecuta',
        tipo: 'contenido',
        videoUrl: 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
        contenido: 'JavaScript es el lenguaje de la web. Se ejecuta en el navegador y en Node.js. En esta lección verás cómo se carga un script y cómo revisar la consola del navegador.',
      },
      {
        titulo: 'Variables y tipos de datos',
        tipo: 'contenido',
        contenido: 'Trabajarás con let y const, y distinguirás números, cadenas, booleanos, null y undefined. La regla práctica: usa const salvo que necesites reasignar.',
      },
      {
        titulo: 'Funciones y alcance',
        tipo: 'contenido',
        contenido: 'Una función agrupa un paso de tu programa y le da un nombre. Verás parámetros, valores de retorno y por qué el alcance de una variable decide dónde vive.',
      },
      {
        titulo: 'Arreglos y objetos',
        tipo: 'contenido',
        contenido: 'Los arreglos guardan listas ordenadas y los objetos describen entidades con claves. Practicarás map, filter y el acceso a propiedades.',
      },
      {
        titulo: 'Cuestionario final de JavaScript',
        tipo: 'cuestionario',
        notaMinima: 70,
        preguntas: [
          {
            enunciado: '¿Qué palabra reservada declara una constante en JavaScript?',
            opciones: ['var', 'const', 'let', 'static'],
            indiceCorrecto: 1,
          },
          {
            enunciado: '¿Qué devuelve el método filter de un arreglo?',
            opciones: ['Un booleano', 'El primer elemento que cumple la condición', 'Un nuevo arreglo con los elementos que cumplen la condición', 'El largo del arreglo'],
            indiceCorrecto: 2,
          },
          {
            enunciado: '¿Cuál de estos valores es de tipo string?',
            opciones: ['42', 'true', '"Hola"', 'null'],
            indiceCorrecto: 2,
          },
        ],
      },
    ],
  },
  {
    instructorEmail: instructorBruno,
    titulo: 'Diseño de interfaces web',
    descripcion: 'Principios visuales para interfaces claras y accesibles, con un cuestionario intermedio que debes aprobar antes de continuar.',
    categoria: 'Diseño',
    nivel: 'intermedio',
    lecciones: [
      {
        titulo: 'Jerarquía visual',
        tipo: 'contenido',
        contenido: 'La jerarquía indica qué mirar primero. Se construye con tamaño, peso tipográfico, contraste y espacio en blanco, no con decoración.',
      },
      {
        titulo: 'Color y contraste',
        tipo: 'contenido',
        videoUrl: 'https://www.youtube.com/watch?v=HcHhBsXQlRw',
        contenido: 'Elegirás una paleta con un color principal y suficientes contrastes. El texto del cuerpo necesita una relación de contraste de al menos 4.5 a 1 para ser legible.',
      },
      {
        titulo: 'Tipografía para pantallas',
        tipo: 'contenido',
        contenido: 'Una familia para titulares y otra para texto es suficiente en la mayoría de proyectos. Cuida la altura de línea y el largo de la columna de lectura.',
      },
      {
        titulo: 'Cuestionario de accesibilidad visual',
        tipo: 'cuestionario',
        notaMinima: 60,
        preguntas: [
          {
            enunciado: '¿Cuál es el contraste mínimo recomendado para texto de cuerpo según WCAG AA?',
            opciones: ['2 a 1', '3 a 1', '4.5 a 1', '7 a 1'],
            indiceCorrecto: 2,
          },
          {
            enunciado: '¿Qué recurso construye jerarquía visual, además del tamaño?',
            opciones: ['El espacio en blanco y el peso tipográfico', 'Cantidad de animaciones', 'La sombra de los botones', 'El número de columnas del pie de página'],
            indiceCorrecto: 0,
          },
        ],
      },
      {
        titulo: 'Sistemas de diseño y entrega',
        tipo: 'contenido',
        contenido: 'Un sistema de diseño fija componentes, espaciado y colores reutilizables. Documentarlos evita que cada pantalla invente su propia regla.',
      },
    ],
  },
  {
    instructorEmail: instructorAna,
    titulo: 'Inglés técnico para desarrollo',
    descripcion: 'Vocabulario y expresiones en inglés que aparecen todos los días en documentación, revisiones de código y reuniones de equipo.',
    categoria: 'Idiomas',
    nivel: 'intermedio',
    lecciones: [
      {
        titulo: 'Leer documentación técnica',
        tipo: 'contenido',
        contenido: 'La documentación usa verbos en imperativo y frases cortas. Aprenderás a separar la instrucción principal de los ejemplos y las advertencias.',
      },
      {
        titulo: 'Vocabulario de revisión de código',
        tipo: 'contenido',
        contenido: 'Términos frecuentes: request changes, nit, edge case, breaking change, regression y rollback. Reconocerlos te permite responder mejor en una revisión.',
      },
      {
        titulo: 'Escribir mensajes de commit claros',
        tipo: 'contenido',
        contenido: 'Un mensaje útil dice qué cambió y por qué, en presente y en pocas palabras. Verás ejemplos de mensajes correctos y de mensajes que no aportan nada.',
      },
      {
        titulo: 'Reuniones y preguntas',
        tipo: 'contenido',
        contenido: 'Frases para pedir aclaraciones sin bloquear la conversación: could you clarify, what do you mean by, let me repeat that back.',
      },
      {
        titulo: 'Cuestionario de vocabulario técnico',
        tipo: 'cuestionario',
        notaMinima: 60,
        preguntas: [
          {
            enunciado: 'En una revisión de código, ¿qué significa "edge case"?',
            opciones: ['Un caso poco común que puede romper el código', 'El caso más usado por los usuarios', 'Un error de tipografía', 'Una prueba automática'],
            indiceCorrecto: 0,
          },
          {
            enunciado: '¿Qué es una "breaking change"?',
            opciones: ['Un cambio que rompe la compatibilidad para quien consume el código', 'Un error de compilación', 'Un cambio de estilo', 'Una rama sin commits'],
            indiceCorrecto: 0,
          },
          {
            enunciado: '¿Qué expresa "let me repeat that back" en una reunión?',
            opciones: ['Que quieres repetir tu opinión', 'Que confirmas tu comprensión repitiendo lo escuchado', 'Que la reunión terminó', 'Que no estás de acuerdo'],
            indiceCorrecto: 1,
          },
        ],
      },
    ],
  },
];

async function buscarInstructor(email) {
  const instructor = await Usuario.findOne({ where: { email } });

  if (!instructor) {
    throw new Error(
      `No existe el instructor ${email}. Ejecuta primero el seeder de usuarios.`,
    );
  }

  return instructor;
}

async function sembrarCurso(datos, instructor) {
  const [curso, creado] = await Curso.findOrCreate({
    where: { titulo: datos.titulo, instructorId: instructor.id },
    defaults: {
      descripcion: datos.descripcion,
      categoria: datos.categoria,
      nivel: datos.nivel,
      estado: 'publicado',
    },
  });

  if (!creado) {
    console.log(`El curso "${datos.titulo}" ya existe; se omite.`);
    return;
  }

  for (const [indice, leccion] of datos.lecciones.entries()) {
    const leccionCreada = await Leccion.create({
      cursoId: curso.id,
      orden: indice + 1,
      titulo: leccion.titulo,
      tipo: leccion.tipo,
      contenido: leccion.contenido ?? null,
      videoUrl: leccion.videoUrl ?? null,
      notaMinima: leccion.notaMinima ?? null,
    });

    for (const pregunta of leccion.preguntas ?? []) {
      await Pregunta.create({
        leccionId: leccionCreada.id,
        enunciado: pregunta.enunciado,
        opciones: pregunta.opciones,
        indiceCorrecto: pregunta.indiceCorrecto,
      });
    }
  }
}

export async function up() {
  for (const datos of cursosDemo) {
    const instructor = await buscarInstructor(datos.instructorEmail);
    await sembrarCurso(datos, instructor);
  }
}

export async function down() {
  await Curso.destroy({ where: { titulo: cursosDemo.map((curso) => curso.titulo) } });
}
