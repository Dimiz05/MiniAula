# MiniAula

MiniAula is a short-course learning platform for the Web Engineering 2 final
project. Instructors create and publish courses, add lessons and quizzes, and
track student progress. Students browse the catalog, enroll, and work through
lessons in order.

**Current status:** the data layer is in place. Sequelize with MySQL models
`Usuario`, `Curso`, `Leccion`, `Pregunta`, `Inscripcion`, and `Progreso`, their
migrations, the demo seed, registration/login with JWT and bcrypt, Zod
validation, centralized errors, and HTTP security middleware all work. The
course, lesson, quiz, enrollment, and progress endpoints are still pending, as
is the frontend.

## Repository structure

| Directory | Stack and purpose |
| --- | --- |
| [`api/`](api/) | REST API with Node.js, Express, JavaScript ES modules, Sequelize, and MySQL. See [API guidelines](api/AGENTS.md). |
| [`web/`](web/) | React single-page application with Vite, JavaScript, and JSX. See [frontend guidelines](web/AGENTS.md). |

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

`npm run db:seed` creates two instructors and three students. All demo accounts
use the password `Miniaula123!`.

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

## API container

From the repository root, with Docker running:

```sh
cp .env.example .env
docker compose up -d --build mysql api
docker compose run --rm api node scripts/migrate.js up
docker compose run --rm api node scripts/seed.js
```

The API is exposed at `http://localhost:3000` and MySQL keeps its data in the
`mysql_data` volume. The full stack (API, frontend, and database) will start
with `docker compose up --build` once the frontend container is implemented.

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
