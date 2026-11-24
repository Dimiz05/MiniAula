# MiniAula

MiniAula es una plataforma de aprendizaje de cursos cortos para el proyecto
final de Ingeniería Web 2. Los instructores crean y publican cursos, agregan
lecciones y cuestionarios, y siguen el progreso de los estudiantes. Los
estudiantes exploran el catálogo, se inscriben y avanzan por las lecciones en
orden.

**Estado actual:** la capa de datos y la autenticación están listas. Los modelos
de Sequelize con MySQL `Usuario`, `Curso`, `Leccion`, `Pregunta`, `Inscripcion`
y `Progreso`, sus migraciones, el seed de demostración, el registro/inicio de
sesión con JWT y bcrypt, la validación con Zod, los errores centralizados y el
middleware de seguridad HTTP funcionan. La aplicación React incluye pantallas de
inicio de sesión, registro y perfil, restaura la sesión tras una recarga y
permite cerrar sesión. La pila completa se inicia con un solo comando de Docker.
Los endpoints y pantallas de catálogo, gestión de cursos, inscripción, edición
de lecciones del instructor y porcentaje de avance del estudiante están
implementados. Los estudiantes pueden abrir una lección desbloqueada en el visor
de lecciones, y el temario del curso muestra los estados completada, disponible
y bloqueada que devuelve la API; el servidor sigue verificando la inscripción y
el avance secuencial en cada solicitud de lección. Los intentos de cuestionario
y las pantallas de resultados siguen pendientes.

## Estructura del repositorio

| Directorio | Tecnologías y propósito |
| --- | --- |
| [`api/`](api/) | API REST con Node.js, Express, módulos ES de JavaScript, Sequelize y MySQL. Consulta las [guías de la API](api/AGENTS.md). |
| [`web/`](web/) | Aplicación de una sola página con React, Vite, JavaScript y JSX. Consulta las [guías del frontend](web/AGENTS.md). |
| [`docs/`](docs/) | Documentación de la API, incluida la [colección de Postman](docs/postman/MiniAula.postman_collection.json). |

## Modelo de datos

| Tabla | Campos clave | Restricciones |
| --- | --- | --- |
| `usuarios` | `nombre`, `email`, `password_hash`, `rol`, `creado_en` | `email` único. |
| `cursos` | `titulo`, `descripcion`, `portada`, `categoria`, `nivel`, `estado`, `instructor_id`, `creado_en` | `instructor_id → usuarios.id` (`RESTRICT`). `portada` almacena la ubicación de la portada: `/uploads/portadas/...` para archivos PNG/JPG/WebP subidos; los datos del seed de demostración usan URL externas de marcador de posición. Indexado por `estado`, `categoria` e `instructor_id`. |
| `lecciones` | `titulo`, `tipo`, `contenido`, `video_url`, `orden`, `nota_minima`, `curso_id` | `curso_id → cursos.id` (`CASCADE`). Índice en `(curso_id, orden)`, no único, porque el reordenamiento intercambia posiciones. |
| `preguntas` | `enunciado`, `opciones` (lista JSON), `indice_correcto`, `leccion_id` | `leccion_id → lecciones.id` (`CASCADE`). |
| `inscripciones` | `estudiante_id`, `curso_id`, `fecha_inscripcion`, `completado` | `(estudiante_id, curso_id)` único. `curso_id → cursos.id` (`RESTRICT`) para que un curso con inscripciones no pueda eliminarse. |
| `progresos` | `inscripcion_id`, `leccion_id`, `completada`, `intentos`, `mejor_nota`, `actualizado_en` | `(inscripcion_id, leccion_id)` único. `leccion_id → lecciones.id` (`CASCADE`). |

`nivel` acepta `basico`, `intermedio` o `avanzado`; `estado` acepta `borrador`,
`publicado` o `archivado`; `tipo` acepta `contenido` o `cuestionario`. Una
lección de contenido requiere `contenido` y un cuestionario requiere
`nota_minima`; el modelo valida ambas reglas.

## Cómo funciona el avance del curso

La API desbloquea cada lección solo después de que la anterior esté completa. Si
la lección anterior es un cuestionario, el estudiante debe aprobarlo para
continuar (RN-01). Un estudiante puede solicitar una lección mediante
`GET /api/lecciones/:id`; la API comprueba que el estudiante autenticado esté
inscrito y que la lección anterior esté completa o aprobada antes de devolver el
contenido. Una lección bloqueada devuelve `403 LECCION_BLOQUEADA` sin su
contenido, y un estudiante fuera del curso recibe `403 NO_INSCRITO`. El detalle
público del curso nunca incluye el contenido de las lecciones ni los enlaces de
video.

La API califica los cuestionarios sin enviar respuestas correctas al navegador,
limita cada cuestionario a tres intentos y conserva la mejor nota. La
comprobación de desbloqueo ya lee la mejor nota almacenada contra la nota mínima
del cuestionario, por lo que la aprobación de cuestionarios puede conectarse sin
cambiar esta regla. Los endpoints de intento y calificación de cuestionarios
siguen pendientes.

## Desarrollo local de la API

Requisitos: Node.js 24, npm y un servidor MySQL 8 en ejecución.

```sh
cd api
cp .env.example .env
npm ci
npm run db:migrate
npm run db:seed
npm start
```

Luego abre `http://localhost:3000/api/health`. Debe devolver
`{"status":"ok"}`. Este endpoint comprueba que la API responde; la API verifica
la conexión con MySQL al iniciar.

Ajusta `api/.env` con tus credenciales locales de MySQL antes de iniciar.
`JWT_SECRET` debe tener al menos 32 caracteres. `api/.env` está ignorado por Git;
solo se versiona `api/.env.example`.

### Scripts de base de datos

| Comando | Propósito |
| --- | --- |
| `npm run db:migrate` | Aplicar las migraciones pendientes de `api/migrations/`. |
| `npm run db:migrate:undo` | Revertir la última migración. |
| `npm run db:seed` | Ejecutar los seeders pendientes de `api/seeders/`. |
| `npm test` | Ejecutar pruebas unitarias y de integración que no necesitan MySQL. |

Las migraciones y los seeders se ejecutan mediante Umzug y quedan registrados en
las tablas `sequelize_meta` y `sequelize_data`, de modo que cada archivo se
ejecuta una sola vez.

### Cuentas de demostración

El seed (automático en el primer inicio con Docker, o con `npm run db:seed` en
local) crea dos instructores y tres estudiantes. Todas las cuentas de
demostración usan la contraseña `Miniaula123!`.

| Email | Rol |
| --- | --- |
| `ana.instructora@miniaula.test` | instructor |
| `bruno.instructor@miniaula.test` | instructor |
| `carla.estudiante@miniaula.test` | estudiante |
| `diego.estudiante@miniaula.test` | estudiante |
| `elena.estudiante@miniaula.test` | estudiante |

El mismo seed crea tres cursos publicados con cinco lecciones cada uno y al
menos un cuestionario calificado por curso:

| Curso | Categoría | Nivel | Instructor | Lecciones |
| --- | --- | --- | --- | --- |
| Fundamentos de JavaScript | Programación | basico | Ana | 4 de contenido + cuestionario (nota mínima 70) |
| Diseño de interfaces web | Diseño | intermedio | Bruno | 3 de contenido + cuestionario (nota mínima 60) + 1 de contenido |
| Inglés técnico para desarrollo | Idiomas | intermedio | Ana | 4 de contenido + cuestionario (nota mínima 60) |

El cuestionario de «Diseño de interfaces web» está en medio del curso para poder
demostrar la regla «hay que aprobar el cuestionario para continuar».

## Formato de respuesta de la API

Cada recurso individual exitoso devuelve el recurso bajo su propia clave:

```json
{ "usuario": { "id": 1, "nombre": "Ana Torres", "email": "ana.instructora@miniaula.test", "rol": "instructor", "creadoEn": "2026-11-18T10:00:00.000Z" } }
```

Cada colección paginada devuelve la lista junto con sus metadatos de
paginación:

```json
{
  "cursos": [{ "id": 1, "titulo": "Fundamentos de JavaScript" }],
  "paginacion": { "page": 1, "limit": 10, "total": 23, "totalPaginas": 3 }
}
```

Usa `201` con el recurso creado, `200` con el recurso o la colección, `204` con
cuerpo vacío para una eliminación exitosa y `409` para duplicados o estados en
conflicto, como una inscripción repetida. Todos los errores mantienen la forma
única que aparece abajo, para que el frontend pueda leer `error.message` en
cualquier fallo:

```json
{ "error": { "code": "VALIDACION", "message": "Los datos enviados no son válidos.", "details": [{ "campo": "email", "mensaje": "El email no es válido." }] } }
```

`details` es `null` cuando no hay nada más que indicar.


## API de autenticación

| Método y ruta | Acceso | Descripción |
| --- | --- | --- |
| `POST /api/auth/register` | Público | Crear una cuenta con `nombre`, `email`, `password` y `rol` opcional (`estudiante` por defecto). Devuelve `201` con `{ usuario, token }`. |
| `POST /api/auth/login` | Público, con límite de solicitudes | Iniciar sesión con `email` y `password`. Devuelve `200` con `{ usuario, token }`. |
| `GET /api/users/me` | Token bearer | Devolver el perfil autenticado. |
| `PUT /api/users/me` | Token bearer | Actualizar `nombre`, `email` y/o `password`. |

Envía el token como `Authorization: Bearer <token>`. Los errores siempre usan:

```json
{ "error": { "code": "VALIDACION", "message": "Los datos enviados no son válidos.", "details": [] } }
```

Las contraseñas se almacenan con hash bcrypt y nunca se devuelven. Las rutas
protegidas verifican la firma, el emisor, la audiencia y la expiración del JWT;
el middleware de roles está disponible para las rutas exclusivas de instructores.

Las sesiones son JWT sin estado: cerrar sesión descarta el token en el cliente y
no existe un endpoint de cierre de sesión en el servidor. Cambiar la contraseña
no revoca los tokens ya emitidos; los tokens expiran según `JWT_EXPIRES_IN`.

## API de gestión de cursos (instructor)

Las rutas exclusivas de instructores requieren un token bearer cuyo usuario
tenga el rol `instructor`. Todas las rutas de abajo funcionan solo sobre los
cursos del instructor autenticado; el curso de otro instructor devuelve
`403 CURSO_NO_PROPIO`.

| Método y ruta | Descripción |
| --- | --- |
| `GET /api/cursos/mios` | Listar los cursos del instructor autenticado en cualquier estado, con `totalLecciones` y `totalInscritos`. Devuelve `{ cursos }`. |
| `GET /api/cursos/mios/:id` | Devolver un curso propio para editarlo. Devuelve `{ curso }`. |
| `POST /api/cursos` | Crear un curso con `titulo`, `descripcion`, `categoria` y `nivel` opcional. El servidor siempre guarda `estado: "borrador"` y al instructor autenticado como propietario. Devuelve `201` con `{ curso }`. |
| `PUT /api/cursos/:id` | Actualizar `titulo`, `descripcion`, `categoria` y/o `nivel` de un curso propio. `estado` e `instructorId` no son editables. Devuelve `{ curso }`. |
| `POST /api/cursos/:id/portada` | Subir la portada del curso como cuerpo crudo de la solicitud (`Content-Type: image/png`, `image/jpeg` o `image/webp`), máximo 5 MB. El servidor valida la firma del archivo, lo guarda en `/uploads/portadas`, reemplaza la imagen anterior y devuelve `{ curso }` con la nueva `portada`. |
| `DELETE /api/cursos/:id/portada` | Eliminar la portada del curso y su archivo almacenado. Devuelve `{ curso }` con `portada: null`. |
| `PATCH /api/cursos/:id/publicar` | Publicar un borrador propio. Requiere al menos una lección; de lo contrario devuelve `409 CURSO_SIN_LECCIONES`. Devuelve `{ curso }` con `estado: "publicado"`. |
| `PATCH /api/cursos/:id/archivar` | Archivar un curso propio en borrador o publicado. Funciona incluso cuando hay estudiantes inscritos. Devuelve `{ curso }` con `estado: "archivado"`. |
| `DELETE /api/cursos/:id` | Eliminar un curso propio solo cuando no tiene estudiantes inscritos; de lo contrario devuelve `409 CURSO_CON_INSCRIPCIONES` y el curso debe archivarse. Devuelve `204` sin cuerpo. |

La portada se sube desde el editor del instructor con un selector de archivos.
Solo se aceptan imágenes PNG, JPG/JPEG y WebP de hasta 5 MB; la API valida la
firma del archivo en lugar de confiar en la extensión. Los archivos se sirven
desde `/uploads/portadas` y la ruta se devuelve en el catálogo público, el
detalle público del curso y las respuestas de cursos del instructor. Docker
Compose conserva el volumen de uploads para que las portadas sobrevivan a los
reinicios de los contenedores.

Las transiciones de estado las impone el backend: `borrador → publicado` solo
después de que exista al menos una lección, y `borrador|publicado → archivado`.
Publicar un curso ya publicado devuelve `409 CURSO_YA_PUBLICADO`; publicar un
curso archivado o archivar uno ya archivado devuelve `409 TRANSICION_INVALIDA` /
`409 CURSO_YA_ARCHIVADO`. Los cambios de estado y la eliminación se ejecutan en
una transacción con la fila del curso bloqueada, de modo que una regla fallida
nunca deja una eliminación parcial. Los cursos archivados desaparecen del
catálogo público porque este solo lista cursos `publicado`.

## API de gestión de lecciones (instructor)

Estas rutas requieren un token bearer con el rol `instructor` y funcionan solo
sobre los cursos del instructor autenticado. El detalle del curso que usa el
editor devuelve el contenido completo de las lecciones; el detalle público del
curso lo sigue ocultando.

| Método y ruta | Descripción |
| --- | --- |
| `GET /api/cursos/mios/:id` | Devolver un curso propio para editarlo con `{ curso, lecciones }`. Cada lección incluye `id`, `titulo`, `tipo`, `contenido`, `videoUrl`, `orden`, `notaMinima` y `cursoId`. Un cuestionario también incluye `preguntas` ordenadas por `id`, cada una con `id`, `enunciado`, `opciones`, `indiceCorrecto` y `leccionId`; el editor del instructor necesita el índice correcto. |
| `POST /api/cursos/:id/lecciones` | Crear una lección de contenido con `titulo`, `contenido` y `videoUrl` opcional. El servidor guarda `tipo: "contenido"`, asigna el siguiente `orden` y devuelve `201 { leccion }`. |
| `PUT /api/lecciones/:id` | Actualizar `titulo`, `contenido` y/o `videoUrl` de una lección de contenido propia. Se requiere al menos un campo. Devuelve `{ leccion }`; un cuestionario devuelve `409 LECCION_NO_ES_CONTENIDO`. |
| `DELETE /api/lecciones/:id` | Eliminar una lección propia. Devuelve `204`. Eliminar una lección también borra sus preguntas y el progreso del estudiante mediante la cascada de claves foráneas existente. |
| `PATCH /api/cursos/:id/lecciones/orden` | Reordenar un curso propio con `{ "orden": [lessonId, ...] }`. La lista debe contener todas las lecciones del curso exactamente una vez; una lista vacía es válida solo cuando el curso no tiene lecciones. El servidor reescribe `orden` como `1..N` y devuelve `{ lecciones }`. |

Crear, reordenar y eliminar una lección se ejecutan dentro de una transacción con
la fila del curso bloqueada. Un curso o lección ajenos devuelven
`403 CURSO_NO_PROPIO`, uno inexistente devuelve `404`, un cuerpo inválido
devuelve `422 VALIDACION`, un orden que no coincide con las lecciones del curso
devuelve `409 ORDEN_LECCIONES_INVALIDO`, y editar un cuestionario por la ruta de
contenido devuelve `409 LECCION_NO_ES_CONTENIDO`.

## API de preguntas de cuestionario (instructor)

Estas rutas requieren un token bearer con el rol `instructor` y funcionan solo
sobre los cursos del instructor autenticado. Las preguntas y sus opciones se
editan juntas: `opciones` es una lista JSON almacenada en la fila de la pregunta,
por lo que no hay endpoints separados de opciones. El índice correcto se
devuelve solo al instructor; los endpoints para estudiantes y el temario público
nunca lo exponen.

| Método y ruta | Descripción |
| --- | --- |
| `POST /api/lecciones/:id/preguntas` | Crear una pregunta en un cuestionario propio con `enunciado`, `opciones` (al menos dos cadenas no vacías) e `indiceCorrecto` (índice basado en cero dentro de `opciones`). Devuelve `201 { pregunta }`; una lección de contenido devuelve `409 LECCION_NO_ES_CUESTIONARIO`. |
| `PUT /api/preguntas/:id` | Reemplazar `enunciado`, `opciones` e `indiceCorrecto` de una pregunta propia. Los tres campos son obligatorios para que el índice correcto siempre apunte a una opción existente. Devuelve `{ pregunta }`. |
| `DELETE /api/preguntas/:id` | Eliminar una pregunta propia. Devuelve `204`. |
| `PATCH /api/lecciones/:id/cuestionario` | Configurar la nota mínima de un cuestionario propio con `{ "notaMinima": 70 }`, un entero de 1 a 100. Devuelve `{ leccion }`; una lección de contenido devuelve `409 LECCION_NO_ES_CUESTIONARIO`. |

Una lección o pregunta ajena devuelve `403 CURSO_NO_PROPIO`, una inexistente
devuelve `404 PREGUNTA_NO_ENCONTRADA` o `404 LECCION_NO_ENCONTRADA`, y un cuerpo
inválido devuelve `422 VALIDACION` con el sobre de error estándar. Las pantallas
del instructor usan estas rutas mediante la acción «Editar preguntas» de una
fila de cuestionario: el editor de preguntas lista las preguntas, marca la opción
correcta y guarda la nota mínima. Los intentos y la calificación de cuestionarios
quedan fuera de esta fase.

## API de inscripción, acceso a lecciones y progreso del estudiante

Estas rutas requieren un token bearer con el rol `estudiante`. Un estudiante solo
recibe sus propias inscripciones, progreso y notas (RN-08); el id del estudiante
siempre proviene de la sesión, nunca de la cadena de consulta ni del cuerpo.

| Método y ruta | Descripción |
| --- | --- |
| `GET /api/inscripciones/mias` | Listar las inscripciones del estudiante autenticado. Cada elemento incluye los campos de la inscripción, el resumen público del curso, `porcentajeAvance`, `leccionesCompletadas` y `totalLecciones`. |
| `GET /api/cursos/:id/temario` | Devolver el temario del curso para el estudiante inscrito como `{ curso, inscripcion, temario, porcentajeAvance, leccionesCompletadas, totalLecciones }`. Cada elemento del temario incluye `id`, `titulo`, `tipo`, `orden`, `notaMinima` y `estado` (`completada`, `disponible` o `bloqueada`). Un estudiante fuera del curso recibe `403 NO_INSCRITO`, y el temario nunca incluye el contenido de las lecciones ni enlaces de video. |
| `GET /api/lecciones/:id` | Devolver una lección desbloqueada como `{ leccion }`. Una lección de contenido incluye `contenido`, `videoUrl`, `notaMinima` y `cursoId`. El estudiante debe estar inscrito (`403 NO_INSCRITO`) y la lección anterior debe estar completa, o el cuestionario anterior aprobado con `mejorNota >= notaMinima` (`403 LECCION_BLOQUEADA`). Una lección inexistente devuelve `404 LECCION_NO_ENCONTRADA`. Esta ruta no devuelve las preguntas ni las respuestas correctas del cuestionario. |

El porcentaje usa todas las lecciones del curso como denominador. Las lecciones
de contenido cuentan cuando su fila de progreso tiene `completada: true`; los
cuestionarios cuentan cuando su mejor nota almacenada alcanza `nota_minima`,
igual que la regla de desbloqueo de lecciones. El resultado se redondea a un
número entero. Un curso sin lecciones devuelve `0` en lugar de dividir entre cero.
La pantalla «Mis cursos» muestra el porcentaje y la barra de progreso de cada
inscripción.

## Autenticación del frontend

| Ruta | Acceso | Pantalla |
| --- | --- | --- |
| `/login` | Público | Iniciar sesión con email y contraseña. |
| `/registro` | Público | Crear una cuenta de estudiante o instructor. |
| `/perfil` | Token bearer | Leer y actualizar nombre, email y contraseña; cerrar sesión. |

La ruta de lección del estudiante `/cursos/:cursoId/lecciones/:leccionId` requiere
un estudiante autenticado. Solo renderiza la lección cuando
`GET /api/lecciones/:id` devuelve su contenido; un `403 LECCION_BLOQUEADA` o un
`403 NO_INSCRITO` muestra el estado bloqueado y el temario informado por
`GET /api/cursos/:id/temario` sin revelar contenido.

La SPA guarda `{ token, usuario }` en `localStorage` bajo
`miniaula.session.v1`, por lo que la sesión sobrevive a una recarga de página. Un
cliente fetch configurado (`web/src/config/http.js`) lee `VITE_API_URL`, adjunta
el token bearer, normaliza el sobre `{ error: { code, message, details } }` y
borra la sesión ante un `401` autenticado. Cerrar sesión descarta el token
almacenado y vuelve a `/login`, en línea con el comportamiento JWT sin estado
descrito arriba. Las contraseñas, los tokens y las respuestas de la API nunca se
registran en logs.

## Colección de Postman

[`docs/postman/MiniAula.postman_collection.json`](docs/postman/MiniAula.postman_collection.json)
prueba la API implementada: health, registro, inicio de sesión, perfil,
validación y gestión de lecciones del instructor. Captura automáticamente tokens
e IDs de cursos/lecciones y comprueba el código de estado y el código de error de
cada caso.

1. Inicia la pila con `docker compose up --build` (o la API local).
2. En Postman, elige **Import** y selecciona el archivo de la colección.
3. Ejecuta toda la colección con **Run** en el Collection Runner; las solicitudes
   están ordenadas y comparten las variables de la colección.

`baseUrl` usa `http://localhost:3000/api` por defecto; cámbialo en las variables
de la colección para probar otro host. Las solicitudes de registro usan
`{{$timestamp}}`, por lo que cada ejecución crea cuentas nuevas. Se aplican
límites de tasa (registro: 5 por hora; inicio de sesión: 10 por 15 minutos);
`docker compose restart api` limpia los contadores en memoria. La carpeta de
lecciones usa los instructores del seed, crea una lección temporal, restaura el
orden del curso y elimina esa lección al final. Las solicitudes para el CRUD de
cursos, inscripciones, progreso y el panel del instructor se agregarán más
adelante.

## Pila completa con Docker

Requisitos: Docker con Compose v2. No se instala nada más en el host. La pila se
define en `docker-compose.yml` en la raíz del repositorio.

Desde la raíz del repositorio:

```sh
docker compose up --build
```

El comando construye la API y el frontend, inicia MySQL, espera a que esté
saludable, aplica las migraciones pendientes, ejecuta los seeders pendientes y
luego inicia la API. El primer inicio tarda un par de minutos; los siguientes
reutilizan las imágenes y el volumen de la base de datos. Cuando termina de
arrancar:

- Frontend: `http://localhost:8080`
- Estado de la API: `http://localhost:3000/api/health`
- Cuentas de demostración: consulta [Cuentas de demostración](#cuentas-de-demostración).
  El seed se ejecuta automáticamente la primera vez que se crea la base de datos.

| Servicio | Contenedor | Notas |
| --- | --- | --- |
| `api` | Node.js 24 + Express | `Dockerfile` propio en `api/Dockerfile`; prepara el esquema y el seed antes de escuchar. |
| `web` | Compilación multi-etapa de Vite servida por Nginx | `Dockerfile` propio en `web/Dockerfile`; fallback de SPA para React Router. |
| `mysql` | MySQL 8.4 | Los datos persisten en el volumen `mysql_data`. |

Comandos útiles:

| Comando | Propósito |
| --- | --- |
| `docker compose up --build -d` | Ejecutar en segundo plano. |
| `docker compose logs -f api` | Seguir los logs de la API, incluidos la migración de inicio y los conteos del seed. |
| `docker compose down` | Detener la pila y conservar el volumen de la base de datos. |
| `docker compose down -v` | Detener la pila y eliminar la base de datos, para que el siguiente inicio sea realmente desde cero. |
| `docker compose run --rm api npm run db:migrate` | Ejecutar las migraciones manualmente. |
| `docker compose run --rm api npm run db:seed` | Ejecutar manualmente los seeders pendientes (ya cubiertos por el arranque). |

Compose tiene valores por defecto solo locales para que el inicio con un comando
funcione sin un `.env`. Para cambiar puertos, credenciales, el secreto JWT o la
URL de la API:

```sh
cp .env.example .env
```

`VITE_API_URL` se incrusta en el frontend en tiempo de compilación. Si cambias
`API_PORT`, ajusta `VITE_API_URL` para que coincida y recompila el frontend
(`docker compose build web`). Los valores por defecto y secretos de
`docker-compose.yml` son solo para desarrollo local; sobreescríbelos en `.env`
para cualquier entorno compartido.

### Desarrollo local del frontend

```sh
cd web
cp .env.example .env
npm ci
npm run dev
```

`VITE_API_URL` debe apuntar a la API en ejecución. Usa `npm run build` para
comprobar la compilación de producción y `npm test` para las pruebas del cliente
de autenticación, la restauración de sesión y el renderizado de rutas.

## Configuración y seguridad

- Copia `.env.example` a `.env` en la raíz del repositorio para Compose, o
  `api/.env.example` a `api/.env` para un proceso local de la API.
- Helmet establece cabeceras de seguridad, CORS solo permite los orígenes de
  `CORS_ORIGIN`, el inicio de sesión está limitado por
  `LOGIN_RATE_WINDOW_MINUTES` y `LOGIN_RATE_MAX`, y el registro por
  `REGISTER_RATE_WINDOW_MINUTES` y `REGISTER_RATE_MAX`.
- El registro de solicitudes usa Morgan (deshabilitado durante las pruebas).
- La validación usa Zod para cuerpos, parámetros de ruta y cadenas de consulta;
  los handlers leen los valores analizados desde `request.validated`.
- El manejo centralizado de errores devuelve `{ error: { code, message, details } }`
  y nunca filtra mensajes internos en fallos inesperados.
