import { Op } from 'sequelize';
import { Curso, Leccion, Usuario } from '../models/index.js';

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
