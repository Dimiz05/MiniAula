# MiniAula

MiniAula is a short-course learning platform for the Web Engineering 2 final
project. Instructors create and publish courses, add lessons and quizzes, and
track student progress. Students browse the catalog, enroll, and work through
lessons in order.

**Current status:** the data layer and authentication are in place. Sequelize
with MySQL models `Usuario`, `Curso`, `Leccion`, `Pregunta`, `Inscripcion`, and
`Progreso`, their migrations, the demo seed, registration/login with JWT and
bcrypt, Zod validation, centralized errors, and HTTP security middleware all
work. The React app includes login, registration, and profile screens, restores
the session after a reload, and supports logout. The complete stack starts with
one Docker command. The catalog, course management, enrollment, and instructor
lesson-editing endpoints and screens are implemented. Quiz, progress, and the
remaining student lesson screens are still pending.

## Repository structure

| Directory | Stack and purpose |
| --- | --- |
| [`api/`](api/) | REST API with Node.js, Express, JavaScript ES modules, Sequelize, and MySQL. See [API guidelines](api/AGENTS.md). |
| [`web/`](web/) | React single-page application with Vite, JavaScript, and JSX. See [frontend guidelines](web/AGENTS.md). |
| [`docs/`](docs/) | API documentation, including the [Postman collection](docs/postman/MiniAula.postman_collection.json). |

## Data model

| Table | Key fields | Constraints |
| --- | --- | --- |
| `usuarios` | `nombre`, `email`, `password_hash`, `rol`, `creado_en` | `email` unique. |
| `cursos` | `titulo`, `descripcion`, `categoria`, `nivel`, `estado`, `instructor_id`, `creado_en` | `instructor_id → usuarios.id` (`RESTRICT`). Indexed by `estado`, `categoria`, and `instructor_id`. |
| `lecciones` | `titulo`, `tipo`, `contenido`, `video_url`, `orden`, `nota_minima`, `curso_id` | `curso_id → cursos.id` (`CASCADE`). Index on `(curso_id, orden)`, not unique, because reordering swaps positions. |
| `preguntas` | `enunciado`, `opciones` (JSON list), `indice_correcto`, `leccion_id` | `leccion_id → lecciones.id` (`CASCADE`). |
| `inscripciones` | `estudiante_id`, `curso_id`, `fecha_inscripcion`, `completado` | `(estudiante_id, curso_id)` unique. `curso_id → cursos.id` (`RESTRICT`) so a course with enrollments cannot be deleted. |
| `progresos` | `inscripcion_id`, `leccion_id`, `completada`, `intentos`, `mejor_nota`, `actualizado_en` | `(inscripcion_id, leccion_id)` unique. `leccion_id → lecciones.id` (`CASCADE`). |

`nivel` accepts `basico`, `intermedio`, or `avanzado`; `estado` accepts
`borrador`, `publicado`, or `archivado`; `tipo` accepts `contenido` or
`cuestionario`. A content lesson requires `contenido`, and a quiz requires
`nota_minima`; both rules are validated by the model.

## How course progress works

The API will unlock each lesson only after the previous one is complete. If the
previous lesson is a quiz, the student must pass it to continue. The API grades
quizzes without sending correct answers to the browser, limits each quiz to
three attempts, and keeps the best score.

## Local API development

Requirements: Node.js 24, npm, and a running MySQL 8 server.

```sh
cd api
cp .env.example .env
npm ci
npm run db:migrate
npm run db:seed
npm start
```

Then open `http://localhost:3000/api/health`. It should return
`{"status":"ok"}`. This endpoint checks that the API responds; the API itself
verifies the MySQL connection at startup.

Adjust `api/.env` with your local MySQL credentials before starting. `JWT_SECRET`
must have at least 32 characters. `api/.env` is ignored by Git; only
`api/.env.example` is committed.

### Database scripts

| Command | Purpose |
| --- | --- |
| `npm run db:migrate` | Apply pending migrations from `api/migrations/`. |
| `npm run db:migrate:undo` | Revert the latest migration. |
| `npm run db:seed` | Run pending seeders from `api/seeders/`. |
| `npm test` | Run unit and integration-style tests that do not need MySQL. |

Migrations and seeders run through Umzug and are recorded in the
`sequelize_meta` and `sequelize_data` tables, so each file runs once.

### Demo accounts

The seed (automatic on the first Docker start, or `npm run db:seed` locally)
creates two instructors and three students. All demo accounts use the password
`Miniaula123!`.

| Email | Role |
| --- | --- |
| `ana.instructora@miniaula.test` | instructor |
| `bruno.instructor@miniaula.test` | instructor |
| `carla.estudiante@miniaula.test` | estudiante |
| `diego.estudiante@miniaula.test` | estudiante |
| `elena.estudiante@miniaula.test` | estudiante |

The same seed creates three published courses with five lessons each and at
least one graded quiz per course:

| Course | Category | Level | Instructor | Lessons |
| --- | --- | --- | --- | --- |
| Fundamentos de JavaScript | Programación | basico | Ana | 4 content + quiz (pass mark 70) |
| Diseño de interfaces web | Diseño | intermedio | Bruno | 3 content + quiz (pass mark 60) + 1 content |
| Inglés técnico para desarrollo | Idiomas | intermedio | Ana | 4 content + quiz (pass mark 60) |

The quiz in "Diseño de interfaces web" sits in the middle of the course so the
"a quiz must be passed before continuing" rule can be demonstrated.

## API response format

Every successful single resource returns the resource under its own key:

```json
{ "usuario": { "id": 1, "nombre": "Ana Torres", "email": "ana.instructora@miniaula.test", "rol": "instructor", "creadoEn": "2026-11-18T10:00:00.000Z" } }
```

Every paginated collection returns the list plus its pagination metadata:

```json
{
  "cursos": [{ "id": 1, "titulo": "Fundamentos de JavaScript" }],
  "paginacion": { "page": 1, "limit": 10, "total": 23, "totalPaginas": 3 }
}
```

Use `201` with the created resource, `200` with the resource or collection,
`204` with an empty body for a successful delete, and `409` for duplicate or
conflicting state such as a repeated enrollment. Every error keeps the single
shape below, so the frontend can read `error.message` in any failure:

```json
{ "error": { "code": "VALIDACION", "message": "Los datos enviados no son válidos.", "details": [{ "campo": "email", "mensaje": "El email no es válido." }] } }
```

`details` is `null` when there is nothing more to say.


## Authentication API

| Method and path | Access | Description |
| --- | --- | --- |
| `POST /api/auth/register` | Public | Create an account with `nombre`, `email`, `password`, and optional `rol` (`estudiante` by default). Returns `201` with `{ usuario, token }`. |
| `POST /api/auth/login` | Public, rate limited | Sign in with `email` and `password`. Returns `200` with `{ usuario, token }`. |
| `GET /api/users/me` | Bearer token | Return the authenticated profile. |
| `PUT /api/users/me` | Bearer token | Update `nombre`, `email`, and/or `password`. |

Send the token as `Authorization: Bearer <token>`. Errors always use:

```json
{ "error": { "code": "VALIDACION", "message": "Los datos enviados no son válidos.", "details": [] } }
```

Passwords are hashed with bcrypt and never returned. Protected routes verify the
JWT signature, issuer, audience, and expiration; role middleware is available
for instructor-only routes.

Sessions are stateless JWTs: logging out discards the token on the client and
there is no server-side logout endpoint. Changing your password does not revoke
tokens that were already issued; tokens expire with `JWT_EXPIRES_IN`.

## Course management API (instructor)

Instructor-only routes require a bearer token whose user has the `instructor`
role. Every route below works only on the authenticated instructor's own
courses; another instructor's course returns `403 CURSO_NO_PROPIO`.

| Method and path | Description |
| --- | --- |
| `GET /api/cursos/mios` | List the authenticated instructor's courses in every state, with `totalLecciones` and `totalInscritos`. Returns `{ cursos }`. |
| `GET /api/cursos/mios/:id` | Return one own course for editing. Returns `{ curso }`. |
| `POST /api/cursos` | Create a course with `titulo`, `descripcion`, `categoria`, and optional `nivel`. The server always stores `estado: "borrador"` and the authenticated instructor as owner. Returns `201` with `{ curso }`. |
| `PUT /api/cursos/:id` | Update `titulo`, `descripcion`, `categoria`, and/or `nivel` of an own course. `estado` and `instructorId` are not editable. Returns `{ curso }`. |
| `PATCH /api/cursos/:id/publicar` | Publish an own draft. Requires at least one lesson; otherwise returns `409 CURSO_SIN_LECCIONES`. Returns `{ curso }` with `estado: "publicado"`. |
| `PATCH /api/cursos/:id/archivar` | Archive an own draft or published course. Works even when students are enrolled. Returns `{ curso }` with `estado: "archivado"`. |
| `DELETE /api/cursos/:id` | Delete an own course only when it has no enrolled students; otherwise returns `409 CURSO_CON_INSCRIPCIONES` and the course must be archived. Returns `204` with no body. |

State transitions are enforced by the backend: `borrador → publicado` only
after at least one lesson exists, and `borrador|publicado → archivado`.
Publishing an already published course returns `409 CURSO_YA_PUBLICADO`;
publishing an archived course or archiving an already archived course returns
`409 TRANSICION_INVALIDA` / `409 CURSO_YA_ARCHIVADO`. State changes and
deletion run in a transaction with the course row locked, so a failed rule
never leaves a partial delete. Archived courses disappear from the public
catalog because it only lists `publicado` courses.

## Lesson management API (instructor)

These routes require a bearer token with the `instructor` role and work only on
the authenticated instructor's own courses. The course detail used by the
editor returns the full lesson content; the public course detail keeps hiding it.

| Method and path | Description |
| --- | --- |
| `GET /api/cursos/mios/:id` | Return an own course for editing with `{ curso, lecciones }`. Each lesson includes `id`, `titulo`, `tipo`, `contenido`, `videoUrl`, `orden`, `notaMinima`, and `cursoId`. |
| `POST /api/cursos/:id/lecciones` | Create a content lesson with `titulo`, `contenido`, and optional `videoUrl`. The server stores `tipo: "contenido"`, assigns the next `orden`, and returns `201 { leccion }`. |
| `PUT /api/lecciones/:id` | Update `titulo`, `contenido`, and/or `videoUrl` of an own content lesson. At least one field is required. Returns `{ leccion }`; a quiz returns `409 LECCION_NO_ES_CONTENIDO`. |
| `DELETE /api/lecciones/:id` | Delete an own lesson. Returns `204`. Deleting a lesson also removes its questions and student progress through the existing foreign-key cascade. |
| `PATCH /api/cursos/:id/lecciones/orden` | Reorder an own course with `{ "orden": [lessonId, ...] }`. The list must contain every lesson of the course exactly once; an empty list is valid only when the course has no lessons. The server rewrites `orden` as `1..N` and returns `{ lecciones }`. |

Creating, reordering, and deleting a lesson run inside a transaction with the
course row locked. A foreign course or lesson returns
`403 CURSO_NO_PROPIO`, a missing one returns `404`, an invalid body returns
`422 VALIDACION`, an order that does not match the course lessons returns
`409 ORDEN_LECCIONES_INVALIDO`, and editing a quiz through the content route
returns `409 LECCION_NO_ES_CONTENIDO`.

## Frontend authentication

| Route | Access | Screen |
| --- | --- | --- |
| `/login` | Public | Sign in with email and password. |
| `/registro` | Public | Create a student or instructor account. |
| `/perfil` | Bearer token | Read and update name, email, and password; logout. |

The SPA keeps `{ token, usuario }` in `localStorage` under
`miniaula.session.v1`, so the session survives a page reload. One configured
fetch client (`web/src/config/http.js`) reads `VITE_API_URL`, attaches the
bearer token, normalizes the `{ error: { code, message, details } }` envelope,
and clears the session on an authenticated `401`. Logout discards the stored
token and returns to `/login`, matching the stateless JWT behavior described
above. Passwords, tokens, and API responses are never logged.

## Postman collection

[`docs/postman/MiniAula.postman_collection.json`](docs/postman/MiniAula.postman_collection.json)
tests the implemented API: health, registration, login, and profile. It captures
the token automatically and asserts the status code and error code of each case.

1. Start the stack with `docker compose up --build` (or the local API).
2. In Postman, choose **Import** and select the collection file.
3. Run the whole collection with **Run** in the Collection Runner; requests are
   ordered and share the collection variables.

`baseUrl` defaults to `http://localhost:3000/api`; change it in the collection
variables to test another host. Registration requests use `{{$timestamp}}`, so
each run creates fresh accounts. Rate limits apply (registration: 5 per hour;
login: 10 per 15 minutes); `docker compose restart api` clears the in-memory
counters. Requests for courses, lessons, enrollments, progress, and the
instructor dashboard will be added as those endpoints are implemented.

## Full stack with Docker

Requirements: Docker with Compose v2. Nothing else is installed on the host.
The stack is defined in `docker-compose.yml` at the repository root.

From the repository root:

```sh
docker compose up --build
```

The command builds the API and the frontend, starts MySQL, waits for it to be
healthy, applies pending migrations, runs pending seeders, and then starts the
API. The first start takes a couple of minutes; later starts reuse the images
and the database volume. When it finishes booting:

- Frontend: `http://localhost:8080`
- API health: `http://localhost:3000/api/health`
- Demo accounts: see [Demo accounts](#demo-accounts). The seed runs
  automatically the first time the database is created.

| Service | Container | Notes |
| --- | --- | --- |
| `api` | Node.js 24 + Express | Own `api/Dockerfile`; prepares the schema and seed before listening. |
| `web` | Multi-stage Vite build served by Nginx | Own `web/Dockerfile`; SPA fallback for React Router. |
| `mysql` | MySQL 8.4 | Data persists in the `mysql_data` volume. |

Useful commands:

| Command | Purpose |
| --- | --- |
| `docker compose up --build -d` | Run in the background. |
| `docker compose logs -f api` | Follow API logs, including the startup migration and seed counts. |
| `docker compose down` | Stop the stack and keep the database volume. |
| `docker compose down -v` | Stop the stack and delete the database, so the next start is truly from zero. |
| `docker compose run --rm api npm run db:migrate` | Run migrations manually. |
| `docker compose run --rm api npm run db:seed` | Run pending seeders manually (already covered by startup). |

Compose has local-only defaults so the one-command start works without a
`.env`. To change ports, credentials, the JWT secret, or the API URL:

```sh
cp .env.example .env
```

`VITE_API_URL` is baked into the frontend at build time. If you change
`API_PORT`, set `VITE_API_URL` to match and rebuild the frontend
(`docker compose build web`). The defaults and secrets in `docker-compose.yml`
are for local development only; override them in `.env` for any shared
environment.

### Frontend local development

```sh
cd web
cp .env.example .env
npm ci
npm run dev
```

`VITE_API_URL` must point to the running API. Use `npm run build` to check the
production build and `npm test` for the authentication client, session restore,
and route rendering tests.

## Configuration and security

- Copy `.env.example` to `.env` at the repository root for Compose, or
  `api/.env.example` to `api/.env` for a local API process.
- Helmet sets security headers, CORS allows only `CORS_ORIGIN` origins, login is
  rate limited by `LOGIN_RATE_WINDOW_MINUTES` and `LOGIN_RATE_MAX`, and
  registration by `REGISTER_RATE_WINDOW_MINUTES` and `REGISTER_RATE_MAX`.
- Request logging uses Morgan (disabled during tests).
- Validation uses Zod for bodies, route parameters, and query strings; handlers
  read the parsed values from `request.validated`.
- Centralized error handling returns `{ error: { code, message, details } }` and
  never leaks internal error messages for unexpected failures.
