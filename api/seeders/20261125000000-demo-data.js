import { Op } from 'sequelize';
import {
  Curso,
  Inscripcion,
  Leccion,
  Pregunta,
  Progreso,
  Usuario,
  sequelize,
} from '../models/index.js';
import { hashPassword } from '../utils/password.js';

const PASSWORD_DEMO = 'Miniaula123!';

// Datos del seed anterior. Se eliminan al ejecutar este seeder para que una
// base existente quede con el conjunto demo nuevo.
const EMAILS_DEMO_ANTERIORES = [
  'ana.instructora@miniaula.test',
  'bruno.instructor@miniaula.test',
  'carla.estudiante@miniaula.test',
  'diego.estudiante@miniaula.test',
  'elena.estudiante@miniaula.test',
];

const TITULOS_DEMO_ANTERIORES = [
  'Fundamentos de JavaScript',
  'Diseño de interfaces web',
  'Inglés técnico para desarrollo',
];

const usuariosDemo = [
  {
    nombre: 'Lucía Ferrer',
    email: 'lucia.instructora@miniaula.test',
    rol: 'instructor',
  },
  {
    nombre: 'Mateo Ríos',
    email: 'mateo.instructor@miniaula.test',
    rol: 'instructor',
  },
  {
    nombre: 'Sofía Álvarez',
    email: 'sofia.estudiante@miniaula.test',
    rol: 'estudiante',
  },
  {
    nombre: 'Tomás Herrera',
    email: 'tomas.estudiante@miniaula.test',
    rol: 'estudiante',
  },
  {
    nombre: 'Valeria Cruz',
    email: 'valeria.estudiante@miniaula.test',
    rol: 'estudiante',
  },
];

const VIDEOS = {
  sintelW3c: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
  bunnyW3c: 'https://media.w3.org/2010/05/bunny/trailer.mp4',
  florMdn: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  conejoMdn: 'https://mdn.github.io/learning-area/html/multimedia-and-embedding/video-and-audio-content/rabbit320.mp4',
  medusa: 'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4',
  sintelCorto: 'https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_1MB.mp4',
};

const cursosDemo = [
  {
    instructorEmail: 'lucia.instructora@miniaula.test',
    titulo: 'React desde cero',
    descripcion:
      'Construye interfaces con componentes, estado, efectos y rutas. Cierra con un cuestionario calificado para comprobar lo aprendido.',
    portada:
      'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?auto=format&fit=crop&w=1200&q=80',
    categoria: 'Programación',
    nivel: 'intermedio',
    lecciones: [
      {
        titulo: 'Componentes y JSX',
        tipo: 'contenido',
        videoUrl: VIDEOS.sintelW3c,
        contenido:
          'Un componente es una función que devuelve JSX. En esta lección separarás la interfaz en piezas reutilizables y aprenderás a pasar props con nombres claros.',
      },
      {
        titulo: 'Estado y eventos',
        tipo: 'contenido',
        videoUrl: VIDEOS.bunnyW3c,
        contenido:
          'El estado guarda los datos que cambian con la interacción. Verás cómo actualizar el estado desde un evento sin mutar el valor anterior y por qué la función de actualización recibe el estado previo.',
      },
      {
        titulo: 'Efectos y datos remotos',
        tipo: 'contenido',
        videoUrl: VIDEOS.florMdn,
        contenido:
          'Los efectos sincronizan el componente con el mundo exterior. Practicarás una carga de datos con estados de carga, error y lista vacía, y limpiarás la suscripción al desmontar.',
      },
      {
        titulo: 'Rutas y navegación',
        tipo: 'contenido',
        videoUrl: VIDEOS.conejoMdn,
        contenido:
          'React Router declara rutas públicas y protegidas. Aprenderás a leer parámetros, navegar sin recargar la página y proteger una vista según la sesión y el rol.',
      },
      {
        titulo: 'Cuestionario final de React',
        tipo: 'cuestionario',
        notaMinima: 70,
        preguntas: [
          {
            enunciado: '¿Qué recibe un componente funcional para mostrar datos?',
            opciones: ['Props', 'Un archivo CSS', 'Una migración', 'Un token JWT'],
            indiceCorrecto: 0,
          },
          {
            enunciado: '¿Qué hook guarda datos que cambian con la interacción?',
            opciones: ['useState', 'useEffect', 'useMemo', 'useRef'],
            indiceCorrecto: 0,
          },
          {
            enunciado: '¿Qué hook se usa para una carga de datos al montar?',
            opciones: ['useEffect', 'useState', 'useContext', 'useReducer'],
            indiceCorrecto: 0,
          },
        ],
      },
    ],
  },
  {
    instructorEmail: 'mateo.instructor@miniaula.test',
    titulo: 'Diseño de interfaces accesibles',
    descripcion:
      'Principios visuales y de accesibilidad para interfaces claras. El cuestionario intermedio debe aprobarse antes de continuar con el resto del curso.',
    portada:
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1200&q=80',
    categoria: 'Diseño',
    nivel: 'intermedio',
    lecciones: [
      {
        titulo: 'Jerarquía visual',
        tipo: 'contenido',
        videoUrl: VIDEOS.medusa,
        contenido:
          'La jerarquía indica qué mirar primero. Se construye con tamaño, peso tipográfico, contraste y espacio en blanco, no con decoración adicional.',
      },
      {
        titulo: 'Color y contraste',
        tipo: 'contenido',
        videoUrl: VIDEOS.florMdn,
        contenido:
          'Una paleta accesible combina un color principal con variantes legibles. El texto del cuerpo necesita una relación de contraste de al menos 4.5 a 1.',
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
            enunciado: '¿Qué recurso construye jerarquía visual además del tamaño?',
            opciones: [
              'El espacio en blanco y el peso tipográfico',
              'La cantidad de animaciones',
              'La sombra de los botones',
              'El número de columnas del pie de página',
            ],
            indiceCorrecto: 0,
          },
          {
            enunciado: '¿Qué atributo describe una imagen para lectores de pantalla?',
            opciones: ['alt', 'src', 'loading', 'class'],
            indiceCorrecto: 0,
          },
        ],
      },
      {
        titulo: 'Tipografía para pantallas',
        tipo: 'contenido',
        videoUrl: VIDEOS.conejoMdn,
        contenido:
          'Una familia para titulares y otra para texto suele ser suficiente. Cuida la altura de línea y el largo de la columna para que la lectura no canse.',
      },
      {
        titulo: 'Sistemas de diseño',
        tipo: 'contenido',
        videoUrl: VIDEOS.sintelCorto,
        contenido:
          'Un sistema de diseño fija componentes, espaciado y colores reutilizables. Documentar esas reglas evita que cada pantalla invente su propio estilo.',
      },
    ],
  },
  {
    instructorEmail: 'lucia.instructora@miniaula.test',
    titulo: 'Inglés técnico para equipos',
    descripcion:
      'Vocabulario y expresiones en inglés que aparecen en documentación, revisiones de código y reuniones de equipo. Incluye un cuestionario final.',
    portada:
      'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80',
    categoria: 'Idiomas',
    nivel: 'intermedio',
    lecciones: [
      {
        titulo: 'Leer documentación técnica',
        tipo: 'contenido',
        videoUrl: VIDEOS.bunnyW3c,
        contenido:
          'La documentación usa verbos en imperativo y frases cortas. Aprenderás a separar la instrucción principal de los ejemplos y las advertencias.',
      },
      {
        titulo: 'Vocabulario de revisión de código',
        tipo: 'contenido',
        videoUrl: VIDEOS.florMdn,
        contenido:
          'Términos frecuentes: request changes, nit, edge case, breaking change, regression y rollback. Reconocerlos te permite responder mejor en una revisión.',
      },
      {
        titulo: 'Mensajes de commit claros',
        tipo: 'contenido',
        videoUrl: VIDEOS.conejoMdn,
        contenido:
          'Un mensaje útil dice qué cambió y por qué, en presente y en pocas palabras. Verás ejemplos de mensajes correctos y de mensajes que no aportan nada.',
      },
      {
        titulo: 'Reuniones y preguntas',
        tipo: 'contenido',
        videoUrl: VIDEOS.medusa,
        contenido:
          'Frases para pedir aclaraciones sin bloquear la conversación: could you clarify, what do you mean by, let me repeat that back.',
      },
      {
        titulo: 'Cuestionario de vocabulario técnico',
        tipo: 'cuestionario',
        notaMinima: 60,
        preguntas: [
          {
            enunciado: 'En una revisión de código, ¿qué significa "edge case"?',
            opciones: [
              'Un caso poco común que puede romper el código',
              'El caso más usado por los usuarios',
              'Un error de tipografía',
              'Una prueba automática',
            ],
            indiceCorrecto: 0,
          },
          {
            enunciado: '¿Qué es una "breaking change"?',
            opciones: [
              'Un cambio que rompe la compatibilidad para quien consume el código',
              'Un error de compilación',
              'Un cambio de estilo',
              'Una rama sin commits',
            ],
            indiceCorrecto: 0,
          },
          {
            enunciado: '¿Qué expresa "let me repeat that back" en una reunión?',
            opciones: [
              'Que quieres repetir tu opinión',
              'Que confirmas tu comprensión repitiendo lo escuchado',
              'Que la reunión terminó',
              'Que no estás de acuerdo',
            ],
            indiceCorrecto: 1,
          },
        ],
      },
    ],
  },
];

async function eliminarDatosDemo(transaction) {
  const emails = [
    ...EMAILS_DEMO_ANTERIORES,
    ...usuariosDemo.map((usuario) => usuario.email),
  ];
  const titulos = [
    ...TITULOS_DEMO_ANTERIORES,
    ...cursosDemo.map((curso) => curso.titulo),
  ];

  const usuarios = await Usuario.findAll({
    where: { email: { [Op.in]: emails } },
    attributes: ['id'],
    transaction,
  });
  const usuarioIds = usuarios.map((usuario) => Number(usuario.id));
  const filtrosCurso = [{ titulo: { [Op.in]: titulos } }];

  if (usuarioIds.length > 0) {
    filtrosCurso.push({ instructorId: { [Op.in]: usuarioIds } });
  }

  const cursos = await Curso.findAll({
    where: { [Op.or]: filtrosCurso },
    attributes: ['id'],
    transaction,
  });
  const cursoIds = cursos.map((curso) => Number(curso.id));
  const filtrosInscripcion = [];

  if (cursoIds.length > 0) {
    filtrosInscripcion.push({ cursoId: { [Op.in]: cursoIds } });
  }

  if (usuarioIds.length > 0) {
    filtrosInscripcion.push({ estudianteId: { [Op.in]: usuarioIds } });
  }

  if (filtrosInscripcion.length > 0) {
    const inscripciones = await Inscripcion.findAll({
      where: { [Op.or]: filtrosInscripcion },
      attributes: ['id'],
      transaction,
    });
    const inscripcionIds = inscripciones.map(
      (inscripcion) => Number(inscripcion.id),
    );

    if (inscripcionIds.length > 0) {
      // Las FKs de inscripciones son RESTRICT: se limpia el avance y las
      // inscripciones antes de eliminar los cursos y usuarios demo.
      await Progreso.destroy({
        where: { inscripcionId: { [Op.in]: inscripcionIds } },
        transaction,
      });
      await Inscripcion.destroy({
        where: { id: { [Op.in]: inscripcionIds } },
        transaction,
      });
    }
  }

  if (cursoIds.length > 0) {
    await Curso.destroy({
      where: { id: { [Op.in]: cursoIds } },
      transaction,
    });
  }

  if (usuarioIds.length > 0) {
    await Usuario.destroy({
      where: { id: { [Op.in]: usuarioIds } },
      transaction,
    });
  }
}

async function crearUsuariosDemo(transaction) {
  const passwordHash = await hashPassword(PASSWORD_DEMO);
  const usuarios = new Map();

  for (const datos of usuariosDemo) {
    const [usuario] = await Usuario.findOrCreate({
      where: { email: datos.email },
      defaults: { ...datos, passwordHash },
      transaction,
    });
    usuarios.set(datos.email, usuario);
  }

  return usuarios;
}

async function crearCursoDemo(datos, instructor, transaction) {
  const curso = await Curso.create(
    {
      instructorId: instructor.id,
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      portada: datos.portada,
      categoria: datos.categoria,
      nivel: datos.nivel,
      estado: 'publicado',
    },
    { transaction },
  );

  for (const [indice, leccion] of datos.lecciones.entries()) {
    const leccionCreada = await Leccion.create(
      {
        cursoId: curso.id,
        orden: indice + 1,
        titulo: leccion.titulo,
        tipo: leccion.tipo,
        contenido: leccion.contenido ?? null,
        videoUrl: leccion.videoUrl ?? null,
        notaMinima: leccion.notaMinima ?? null,
      },
      { transaction },
    );

    for (const pregunta of leccion.preguntas ?? []) {
      await Pregunta.create(
        {
          leccionId: leccionCreada.id,
          enunciado: pregunta.enunciado,
          opciones: pregunta.opciones,
          indiceCorrecto: pregunta.indiceCorrecto,
        },
        { transaction },
      );
    }
  }
}

export async function up() {
  await sequelize.transaction(async (transaction) => {
    await eliminarDatosDemo(transaction);
    const usuarios = await crearUsuariosDemo(transaction);

    for (const datos of cursosDemo) {
      const instructor = usuarios.get(datos.instructorEmail);
      await crearCursoDemo(datos, instructor, transaction);
    }
  });

  console.log(
    'Datos demo nuevos: 2 instructores, 3 estudiantes, 3 cursos publicados con portada y videos.',
  );
}

export async function down() {
  await sequelize.transaction(async (transaction) => {
    await eliminarDatosDemo(transaction);
  });
}
