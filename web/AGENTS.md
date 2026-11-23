# MiniAula Web — Agent Instructions

## Scope and stack

Build a React SPA with Vite, JavaScript, and JSX. Consume the MiniAula REST API
using `VITE_API_URL` as the base URL; do not hard-code a deployment URL or put
secrets in `VITE_` variables.

## Design reference

The reviewed visual reference lives in `docs/MiniAula_Disenos_Revisados/`:
`miniaula_design_system.md` plus one HTML screen per flow. Treat it as the
source of truth for colors, type scale, spacing, radii, shadows, and layout
patterns. Its tokens are implemented in `src/index.css` as `text-headline-*`,
`text-body-*`, `text-label-*`, `text-display-*`, `rounded-control`,
`rounded-card`, `rounded-panel`, and `shadow-card|hover|modal`. Reuse the shared
components in `src/components/` instead of restyling controls per page.

## Layout

| Path | Responsibility |
| --- | --- |
| `src/main.jsx` | Mount React and initialize the router and session provider. |
| `src/routes/` | Declare public, session-protected, and role-protected routes with React Router. |
| `src/pages/auth/` | Login, registration, and profile screens. |
| `src/pages/student/` | Catalog, course outline, lesson, quiz result, and enrolled courses with progress. |
| `src/pages/instructor/` | Instructor courses, course and lesson editors, quiz question editor, and course dashboard. |
| `src/components/` | Reusable UI components. |
| `src/hooks/` | Reusable hooks; provide at least two, such as `useAuth` and `useProgress`. |
| `src/config/` | Shared HTTP client configuration. |
| `src/services/` | API calls by domain; components must not call Fetch or Axios directly. |
| `src/assets/`, `public/` | Imported assets and directly served static files, respectively. |

## Implementation conventions

- Keep user and token state in Context API or Zustand and restore the session on reload. Use one configured HTTP client that attaches the token and signs the user out on `401`.
- Keep HTTP and presentation separate. Before changing a request, verify its method, path, and response shape against the API.
- Show loading, error, and empty states in views with remote data. Validate forms on the client and display errors returned by the API.
- Show locked lessons in the outline without revealing their content. Display the quiz grade and pass/fail result returned by the server; never grade in the browser or expect correct answers from the API. Route guards and UI checks do not replace server authorization.
- Support layouts starting at 375 px and use one approved UI library consistently (Tailwind, MUI, or Bootstrap). Do not log credentials, tokens, or sensitive API responses.

## Configuration and verification

- The frontend needs a multi-stage Dockerfile that builds with Vite and serves the output with Nginx. The full stack must start from the repository root with `docker compose up --build` once Docker configuration exists.
- Check `package.json` before running commands. For UI changes, exercise the affected flow and run lint and build when configured; report any checks that could not run.
