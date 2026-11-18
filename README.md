# MiniAula

MiniAula is a short-course learning platform for the Web Engineering 2 final
project. Instructors create and publish courses, add lessons and quizzes, and
track student progress. Students browse the catalog, enroll, and work through
lessons in order.

**Current status:** the Express API foundation is in place: Sequelize with
MySQL, the `Usuario` model and migration, registration/login with JWT and
bcrypt, Zod validation, centralized errors, and HTTP security middleware. The
frontend, courses, lessons, quizzes, and progress modules are still pending.

## Repository structure

| Directory | Stack and purpose |
| --- | --- |
| [`api/`](api/) | REST API with Node.js, Express, JavaScript ES modules, Sequelize, and MySQL. See [API guidelines](api/AGENTS.md). |
| [`web/`](web/) | React single-page application with Vite, JavaScript, and JSX. See [frontend guidelines](web/AGENTS.md). |

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
- Helmet sets security headers, CORS allows only `CORS_ORIGIN` origins, and
  login attempts are rate limited by `LOGIN_RATE_WINDOW_MINUTES` and
  `LOGIN_RATE_MAX`.
- Request logging uses Morgan (disabled during tests).
- Validation uses Zod for bodies, route parameters, and query strings; handlers
  read the parsed values from `request.validated`.
- Centralized error handling returns `{ error: { code, message, details } }` and
  never leaks internal error messages for unexpected failures.
