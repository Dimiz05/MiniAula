# MiniAula

MiniAula is a short-course learning platform for the Web Engineering 2 final
project. Instructors create and publish courses, add lessons and quizzes, and
track student progress. Students browse the catalog, enroll, and work through
lessons in order.

**Current status:** The Express API scaffold and its Dockerfile are in place.
The frontend, MySQL integration, and full-stack Compose setup are not
implemented yet.

## Repository structure

| Directory | Stack and purpose |
| --- | --- |
| [`api/`](api/) | REST API with Node.js, Express, JavaScript ES modules, Sequelize, and MySQL. See [API guidelines](api/AGENTS.md). |
| [`web/`](web/) | React single-page application with Vite, JavaScript, and JSX. See [frontend guidelines](web/AGENTS.md). |

## How course progress works

The API unlocks each lesson only after the previous one is complete. If the
previous lesson is a quiz, the student must pass it to continue. The API grades
quizzes without sending correct answers to the browser, limits each quiz to
three attempts, and keeps the best score.

## Running locally

With Node.js 24 and npm installed, run the API from the repository root:

```sh
cd api
npm ci
npm start
```

Open `http://localhost:3000/api/health`. It should return `{"status":"ok"}`.
This endpoint checks that the API is running; it does not check a database.
Inside `api/`, use `npm run dev` to restart on source changes or `npm test` to
run the test suite. Set `PORT` to override the default port.

### API container

From the repository root, with Docker running:

```sh
docker build -t miniaula-api ./api
docker run --rm -p 3000:3000 miniaula-api
```

### Full stack (planned)

Once the frontend and MySQL service are configured, the full stack will start
from the repository root with:

```sh
docker compose up --build
```

Database configuration, seeding instructions, and demo accounts will be
documented when they are available.
