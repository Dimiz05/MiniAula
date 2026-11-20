import { Curso, Usuario } from '../models/index.js';

const cursosDemo = [
  {
    titulo: 'JavaScript moderno desde cero',
    descripcion: 'Aprende las bases del lenguaje, módulos, asincronía y buenas prácticas para construir aplicaciones web.',
    categoria: 'Programación',
    nivel: 'principiante',
    estado: 'publicado',
    instructor: 'ana.instructora@miniaula.test',
    creadoEn: '2026-09-02T10:00:00Z',
  },
  {
    titulo: 'Diseño de interfaces con Figma',
    descripcion: 'Diseña pantallas claras y consistentes: jerarquía visual, componentes y prototipos interactivos.',
    categoria: 'Diseño',
    nivel: 'intermedio',
    estado: 'publicado',
    instructor: 'bruno.instructor@miniaula.test',
    creadoEn: '2026-09-12T10:00:00Z',
  },
  {
    titulo: 'Inglés para el trabajo',
    descripcion: 'Vocabulario y expresiones para reuniones, correos y presentaciones en entornos profesionales.',
    categoria: 'Idiomas',
    nivel: 'principiante',
    estado: 'publicado',
    instructor: 'ana.instructora@miniaula.test',
    creadoEn: '2026-09-22T10:00:00Z',
  },
  {
    titulo: 'React: aplicaciones con Vite',
    descripcion: 'Construye una SPA con componentes, rutas, estado y consumo de una API REST.',
    categoria: 'Programación',
    nivel: 'intermedio',
    estado: 'publicado',
    instructor: 'bruno.instructor@miniaula.test',
    creadoEn: '2026-10-02T10:00:00Z',
  },
  {
    titulo: 'Fundamentos de SQL',
    descripcion: 'Modela datos y escribe consultas con filtros, orden, agrupaciones y relaciones entre tablas.',
    categoria: 'Programación',
    nivel: 'principiante',
    estado: 'publicado',
    instructor: 'ana.instructora@miniaula.test',
    creadoEn: '2026-10-12T10:00:00Z',
  },
  {
    titulo: 'Comunicación visual para productos',
    descripcion: 'Aplica color, tipografía y composición para que tus productos digitales comuniquen mejor.',
    categoria: 'Diseño',
    nivel: 'avanzado',
    estado: 'publicado',
    instructor: 'bruno.instructor@miniaula.test',
    creadoEn: '2026-10-22T10:00:00Z',
  },
  {
    titulo: 'Bases de datos con Sequelize',
    descripcion: 'Curso en preparación sobre modelos, asociaciones, migraciones y consultas con Sequelize.',
    categoria: 'Programación',
    nivel: 'intermedio',
    estado: 'borrador',
    instructor: 'ana.instructora@miniaula.test',
    creadoEn: '2026-11-02T10:00:00Z',
  },
  {
    titulo: 'Fotografía con el móvil',
    descripcion: 'Curso archivado: composición, luz y edición básica usando solo el teléfono.',
    categoria: 'Diseño',
    nivel: 'principiante',
    estado: 'archivado',
    instructor: 'bruno.instructor@miniaula.test',
    creadoEn: '2026-08-15T10:00:00Z',
  },
];

async function buscarInstructor(email) {
  const instructor = await Usuario.findOne({
    where: { email },
    attributes: ['id'],
  });

  if (!instructor) {
    throw new Error(`Falta el instructor ${email}; ejecuta primero el seeder de usuarios.`);
  }

  return instructor;
}

export async function up() {
  const instructores = new Map();

  for (const datos of cursosDemo) {
    if (!instructores.has(datos.instructor)) {
      instructores.set(datos.instructor, await buscarInstructor(datos.instructor));
    }

    const { instructor, ...curso } = datos;
    const [, creado] = await Curso.findOrCreate({
      where: { titulo: curso.titulo, instructorId: instructores.get(instructor).id },
      defaults: curso,
    });

    if (!creado) {
      console.log(`El curso "${curso.titulo}" ya existe; se omite.`);
    }
  }
}

export async function down() {
  await Curso.destroy({
    where: { titulo: cursosDemo.map((curso) => curso.titulo) },
  });
}
