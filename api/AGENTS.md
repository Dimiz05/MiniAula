# MiniAula API — Agent Instructions

## Scope and stack

Build the MiniAula REST API with Node.js, Express, JavaScript ES modules
(`import`/`export`), Sequelize, and MySQL. The course brief defines the
required endpoints under `/api`; preserve their methods, paths, and access rules.

## Layout and request flow

| Path | Responsibility |
| --- | --- |
| `index.js` | Load configuration, assemble Express, mount `/api`, and start the server. |
| `config/` | Environment configuration and Sequelize connection. |
| `routes/` | Register endpoints and compose validation, access checks, and controllers. |
| `middlewares/` | Authentication, role and resource authorization, validation, and centralized error handling. |
| `schemas/` | Zod or Joi validation for request bodies, route parameters, and query strings. |
| `controllers/` | Translate HTTP input and service results into responses; no business logic or database queries. |
| `services/` | Enforce business rules and use Sequelize models for persistence. |
| `models/` | Define users, courses, lessons, questions, enrollments, and progress, with their associations. |
| `migrations/`, `seeders/` | Version schema changes and provide reproducible demo data. |
| `utils/` | Shared helpers such as JWT and application errors. |

## Business rules and API contracts

- Enforce progression on the server: a lesson unlocks only after the previous lesson is complete, and a preceding quiz must be passed. Return `403` for locked lessons and never send their content.
- Grade quizzes on the server. Never expose correct answers. Limit each quiz to three attempts and retain the best score.
- Require enrollment for lesson access. Reject duplicate enrollment with `409`. Students may read only their own progress and grades; instructors may modify only their own courses, lessons, and questions.
- New courses start as drafts. Expose only published courses in the catalog; require at least one lesson before publication and archive rather than delete courses with enrollments. Support catalog search, category filters, and `page`/`limit`.
- Hash passwords with bcrypt; use expiring JWTs and middleware to check the token and role. Never return passwords or password hashes.
- Use centralized errors shaped as `{ error: { code, message, details } }`. Configure Helmet, CORS restricted to the frontend origin, login rate limiting, and request logging with Morgan or Pino.

## Configuration and verification

- Keep credentials in local `.env` files; commit only placeholder values in `.env.example`. Use migrations for schema changes; never use destructive Sequelize synchronization.
- Seed at least two instructors, three students, and three published courses with five lessons and at least one quiz each.
- Document the required endpoints with Swagger at `/api/docs` or an exported Postman collection. The API needs its own Dockerfile and uses the separate MySQL service in root Compose.
- Check `package.json` before running commands; do not assume the reference project's package manager, scripts, or ports. Verify affected endpoints and access rules once runnable checks exist.
