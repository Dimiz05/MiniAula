import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import app from '../app.js';
import { Curso, Inscripcion, Usuario } from '../models/index.js';
import { listarEstudiantesCurso } from '../services/inscripcion.service.js';
import { signAccessToken } from '../utils/jwt.js';

async function iniciarServidor(t) {
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  await once(server, 'listening');

  return `http://127.0.0.1:${server.address().port}`;
}

function cursoFalso({
  id = 1,
  titulo = 'Inglés técnico para equipos',
  estado = 'publicado',
  instructorId = 9,
} = {}) {
  return { id, titulo, estado, instructorId };
}

function crearDatos(t, {
  curso = cursoFalso(),
  inscripciones = [],
} = {}) {
  let consultaInscripciones;

  t.mock.method(Curso, 'findByPk', async () => curso);
  t.mock.method(Inscripcion, 'findAll', async (opciones) => {
    consultaInscripciones = opciones;
    return inscripciones;
  });

  return {
    consultaInscripciones: () => consultaInscripciones,
  };
}

test('el instructor ve el nombre y correo de sus estudiantes inscritos', async (t) => {
  const consultas = crearDatos(t, {
    inscripciones: [
      {
        id: 31,
        estudianteId: 5,
        fechaInscripcion: '2026-03-01T10:00:00.000Z',
        estudiante: {
          id: 5,
          nombre: 'Carla Méndez',
          email: 'carla@miniaula.test',
        },
      },
      {
        id: 32,
        estudianteId: 6,
        fechaInscripcion: '2026-03-02T10:00:00.000Z',
        estudiante: {
          id: 6,
          nombre: 'Diego Rojas',
          email: 'diego@miniaula.test',
        },
      },
    ],
  });

  const resultado = await listarEstudiantesCurso(9, 1);

  assert.equal(consultas.consultaInscripciones().where.cursoId, 1);
  assert.equal(consultas.consultaInscripciones().include[0].model, Usuario);
  assert.equal(consultas.consultaInscripciones().include[0].as, 'estudiante');
  assert.deepEqual(consultas.consultaInscripciones().include[0].attributes, [
    'id',
    'nombre',
    'email',
  ]);
  assert.deepEqual(resultado.curso, {
    id: 1,
    titulo: 'Inglés técnico para equipos',
    estado: 'publicado',
  });
  assert.deepEqual(resultado.estudiantes, [
    {
      id: 31,
      estudianteId: 5,
      nombre: 'Carla Méndez',
      email: 'carla@miniaula.test',
      fechaInscripcion: '2026-03-01T10:00:00.000Z',
    },
    {
      id: 32,
      estudianteId: 6,
      nombre: 'Diego Rojas',
      email: 'diego@miniaula.test',
      fechaInscripcion: '2026-03-02T10:00:00.000Z',
    },
  ]);
});

test('un instructor no puede ver estudiantes de un curso ajeno', async (t) => {
  crearDatos(t, { curso: cursoFalso({ instructorId: 7 }) });

  await assert.rejects(() => listarEstudiantesCurso(9, 1), {
    statusCode: 403,
    code: 'CURSO_NO_PROPIO',
  });
});

test('la ruta de estudiantes exige un instructor autenticado', async (t) => {
  const baseUrl = await iniciarServidor(t);

  const response = await fetch(`${baseUrl}/api/cursos/mios/1/estudiantes`);

  assert.equal(response.status, 401);
  assert.equal((await response.json()).error.code, 'NO_AUTENTICADO');
});

test('la ruta de estudiantes devuelve la lista del curso propio', async (t) => {
  const baseUrl = await iniciarServidor(t);
  t.mock.method(Usuario, 'findByPk', async () => ({ id: 9, rol: 'instructor' }));
  crearDatos(t, {
    inscripciones: [{
      id: 31,
      estudianteId: 5,
      fechaInscripcion: '2026-03-01T10:00:00.000Z',
      estudiante: {
        id: 5,
        nombre: 'Carla Méndez',
        email: 'carla@miniaula.test',
      },
    }],
  });
  const token = signAccessToken({ id: 9, rol: 'instructor' });

  const response = await fetch(`${baseUrl}/api/cursos/mios/1/estudiantes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.curso.titulo, 'Inglés técnico para equipos');
  assert.equal(body.estudiantes[0].nombre, 'Carla Méndez');
});
