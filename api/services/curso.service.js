import { Op, col, fn } from 'sequelize';
import {
  Curso,
  Inscripcion,
  Leccion,
  Usuario,
  sequelize,
} from '../models/index.js';
import { AppError } from '../utils/errors.js';

const ATRIBUTOS_INSTRUCTOR = ['id', 'nombre'];
const ATRIBUTOS_TEMARIO = ['id', 'titulo', 'tipo', 'orden', 'notaMinima'];

export function escaparLike(value) {
  return value.replace(/[\\%_]/g, '\\$&');
}

export function construirFiltroCatalogo({ q, categoria }) {
  const filtro = { estado: 'publicado' };

  if (categoria) {
    filtro.categoria = categoria;
  }

  if (q) {
    filtro.titulo = { [Op.like]: `%${escaparLike(q)}%` };
  }

  return filtro;
}

export function construirPaginacion(total, page, limit) {
  return {
    pagina: page,
    limite: limit,
    total,
    totalPaginas: total === 0 ? 0 : Math.ceil(total / limit),
  };
}

export function toPublicCurso(curso) {
  const {
    id,
    titulo,
    descripcion,
    categoria,
    nivel,
    creadoEn,
    instructor,
  } = curso.get({ plain: true });

  return {
    id,
    titulo,
    descripcion,
    categoria,
    nivel,
    instructor: instructor ? { id: instructor.id, nombre: instructor.nombre } : null,
    creadoEn,
  };
}

export function toTemarioItem(leccion) {
  const {
    id,
    titulo,
    tipo,
    orden,
    notaMinima,
  } = leccion.get({ plain: true });

  return {
    id,
    titulo,
    tipo,
    orden,
    notaMinima,
  };
}

export async function obtenerCursoPublicado(id) {
  const curso = await Curso.findOne({
    where: { id, estado: 'publicado' },
    include: [{
      model: Usuario,
      as: 'instructor',
      attributes: ATRIBUTOS_INSTRUCTOR,
    }],
  });

  if (!curso) {
    return null;
  }

  const lecciones = await Leccion.findAll({
    where: { cursoId: id },
    attributes: ATRIBUTOS_TEMARIO,
    order: [['orden', 'ASC'], ['id', 'ASC']],
  });

  return {
    curso: toPublicCurso(curso),
    temario: lecciones.map(toTemarioItem),
  };
}

export function toInstructorCurso(
  curso,
  { totalLecciones = 0, totalInscritos = 0 } = {},
) {
  const {
    id,
    titulo,
    descripcion,
    categoria,
    nivel,
    estado,
    creadoEn,
  } = curso.get({ plain: true });

  return {
    id,
    titulo,
    descripcion,
    categoria,
    nivel,
    estado,
    creadoEn,
    totalLecciones,
    totalInscritos,
  };
}

export function asegurarPropiedadCurso(curso, instructorId) {
  if (!curso) {
    throw new AppError(404, 'CURSO_NO_ENCONTRADO', 'El curso no existe.');
  }

  if (curso.instructorId !== instructorId) {
    throw new AppError(
      403,
      'CURSO_NO_PROPIO',
      'Solo puedes administrar tus propios cursos.',
    );
  }

  return curso;
}

async function contarRelacionadosPorCurso(Modelo, cursoIds) {
  if (cursoIds.length === 0) {
    return new Map();
  }

  const filas = await Modelo.findAll({
    attributes: [
      [col('curso_id'), 'cursoId'],
      [fn('COUNT', col('id')), 'total'],
    ],
    where: { cursoId: { [Op.in]: cursoIds } },
    group: [col('curso_id')],
    raw: true,
  });

  return new Map(
    filas.map((fila) => [Number(fila.cursoId), Number(fila.total)]),
  );
}

async function contarRelacionadosCurso(cursoId, transaction) {
  const [totalLecciones, totalInscritos] = await Promise.all([
    Leccion.count({ where: { cursoId }, transaction }),
    Inscripcion.count({ where: { cursoId }, transaction }),
  ]);

  return { totalLecciones, totalInscritos };
}

export async function listarCursosPropios(instructorId) {
  const cursos = await Curso.findAll({
    where: { instructorId },
    order: [['creadoEn', 'DESC'], ['id', 'DESC']],
  });

  const cursoIds = cursos.map((curso) => curso.id);
  const [lecciones, inscripciones] = await Promise.all([
    contarRelacionadosPorCurso(Leccion, cursoIds),
    contarRelacionadosPorCurso(Inscripcion, cursoIds),
  ]);

  return cursos.map((curso) => toInstructorCurso(curso, {
    totalLecciones: lecciones.get(curso.id) ?? 0,
    totalInscritos: inscripciones.get(curso.id) ?? 0,
  }));
}

export async function obtenerCursoPropio(instructorId, cursoId) {
  const curso = await Curso.findByPk(cursoId);
  asegurarPropiedadCurso(curso, instructorId);

  return toInstructorCurso(curso, await contarRelacionadosCurso(curso.id));
}

export async function crearCurso(instructorId, datos) {
  const curso = await Curso.create({
    titulo: datos.titulo,
    descripcion: datos.descripcion,
    categoria: datos.categoria,
    nivel: datos.nivel,
    // RF-06: every new course starts as a draft, regardless of client input.
    estado: 'borrador',
    instructorId,
  });

  return toInstructorCurso(curso);
}

export async function actualizarCursoPropio(instructorId, cursoId, cambios) {
  const curso = await Curso.findByPk(cursoId);
  asegurarPropiedadCurso(curso, instructorId);

  if (cambios.titulo !== undefined) {
    curso.titulo = cambios.titulo;
  }

  if (cambios.descripcion !== undefined) {
    curso.descripcion = cambios.descripcion;
  }

  if (cambios.categoria !== undefined) {
    curso.categoria = cambios.categoria;
  }

  if (cambios.nivel !== undefined) {
    curso.nivel = cambios.nivel;
  }

  await curso.save();

  return toInstructorCurso(curso, await contarRelacionadosCurso(curso.id));
}

async function obtenerCursoBloqueado(cursoId, transaction) {
  return Curso.findByPk(cursoId, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
}

export async function publicarCursoPropio(instructorId, cursoId) {
  return sequelize.transaction(async (transaction) => {
    const curso = await obtenerCursoBloqueado(cursoId, transaction);
    asegurarPropiedadCurso(curso, instructorId);

    if (curso.estado === 'publicado') {
      throw new AppError(
        409,
        'CURSO_YA_PUBLICADO',
        'El curso ya está publicado.',
      );
    }

    if (curso.estado !== 'borrador') {
      throw new AppError(
        409,
        'TRANSICION_INVALIDA',
        'Solo un curso en borrador puede publicarse.',
      );
    }

    // A course needs at least one lesson before it can be published.
    const totalLecciones = await Leccion.count({
      where: { cursoId: curso.id },
      transaction,
    });

    if (totalLecciones === 0) {
      throw new AppError(
        409,
        'CURSO_SIN_LECCIONES',
        'El curso debe tener al menos una lección antes de publicarse.',
      );
    }

    curso.estado = 'publicado';
    await curso.save({ transaction });

    const totalInscritos = await Inscripcion.count({
      where: { cursoId: curso.id },
      transaction,
    });
    return toInstructorCurso(curso, { totalLecciones, totalInscritos });
  });
}

export async function archivarCursoPropio(instructorId, cursoId) {
  return sequelize.transaction(async (transaction) => {
    const curso = await obtenerCursoBloqueado(cursoId, transaction);
    asegurarPropiedadCurso(curso, instructorId);

    if (curso.estado === 'archivado') {
      throw new AppError(
        409,
        'CURSO_YA_ARCHIVADO',
        'El curso ya está archivado.',
      );
    }

    curso.estado = 'archivado';
    await curso.save({ transaction });

    return toInstructorCurso(
      curso,
      await contarRelacionadosCurso(curso.id, transaction),
    );
  });
}

export async function eliminarCursoPropio(instructorId, cursoId) {
  await sequelize.transaction(async (transaction) => {
    const curso = await obtenerCursoBloqueado(cursoId, transaction);
    asegurarPropiedadCurso(curso, instructorId);

    // A course with enrolled students must be archived, not deleted.
    const totalInscritos = await Inscripcion.count({
      where: { cursoId: curso.id },
      transaction,
    });

    if (totalInscritos > 0) {
      throw new AppError(
        409,
        'CURSO_CON_INSCRIPCIONES',
        'No puedes eliminar un curso con estudiantes inscritos. Archívalo en su lugar.',
      );
    }

    await curso.destroy({ transaction });
  });
}

export async function listarCursosPublicados({ page, limit, q, categoria }) {
  const { rows, count } = await Curso.findAndCountAll({
    where: construirFiltroCatalogo({ q, categoria }),
    include: [{
      model: Usuario,
      as: 'instructor',
      attributes: ATRIBUTOS_INSTRUCTOR,
    }],
    order: [['creadoEn', 'DESC'], ['id', 'DESC']],
    limit,
    offset: (page - 1) * limit,
    distinct: true,
  });

  return {
    cursos: rows.map(toPublicCurso),
    paginacion: construirPaginacion(count, page, limit),
  };
}
