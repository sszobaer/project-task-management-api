# Project & Task Management API

A RESTful backend API for authenticated users to manage projects and tasks, built as a Backend Intern Technical Assignment.

**Technologies:** Node.js · TypeScript · NestJS · Prisma ORM · PostgreSQL · JWT · bcrypt · class-validator · Scalar API Docs

---

## Features

### Authentication
- User registration with hashed passwords
- Login with JWT issuance
- `GET /auth/me` — current authenticated user
- All protected routes require a valid Bearer token
- Passwords are never returned in any response

### Project Management
- Create, read, update, delete projects
- `ownerId` is always derived from the JWT — never accepted from the client
- Only the project owner may update or delete a project
- A participant (user assigned to any task in the project) may view the project

### Task Management
- Create, read, update, delete tasks scoped to a project
- Task status (`TODO`, `IN_PROGRESS`, `DONE`) and priority (`LOW`, `MEDIUM`, `HIGH`)
- Optional task assignment to a user
- Only the project owner may create, delete, or reassign tasks
- A task's assignee may view and update their own task only
- `GET /tasks/assigned-to-me` — all tasks assigned to the JWT user

### Task Querying
- Pagination (`page`, `limit`)
- Filter by `status` and `priority`
- Search by `title` / `name` (partial, case-insensitive)

---

## Tech Stack

| Technology      | Purpose                  |
|-----------------|--------------------------|
| Node.js         | Runtime                  |
| TypeScript      | Programming language     |
| NestJS 11       | Backend framework        |
| Prisma 7        | ORM                      |
| PostgreSQL      | Database                 |
| @nestjs/jwt     | JWT authentication       |
| passport-jwt    | JWT strategy             |
| bcrypt          | Password hashing         |
| class-validator | Request body validation  |
| class-transformer | DTO transformation     |
| @nestjs/swagger | OpenAPI spec generation  |
| Scalar          | API documentation UI     |

---

## Project Structure

```text
src/
├── common/
│   ├── decorators/        # @CurrentUser() decorator
│   ├── dto/               # PaginationQueryDto (shared base)
│   ├── filters/           # Global HTTP exception filter
│   └── interceptors/      # Global response interceptor
├── modules/
│   ├── auth/              # Registration, login, JWT guard & strategy
│   │   ├── dto/
│   │   ├── guards/
│   │   ├── strategies/
│   │   └── types/
│   ├── project/           # Project CRUD
│   │   └── dto/
│   └── task/              # Task CRUD
│       └── dto/
├── prisma/                # PrismaService
├── app.module.ts
└── main.ts
prisma/
├── schema.prisma
└── migrations/
.env.example
package.json
```

| Directory/File          | Responsibility                                      |
|-------------------------|-----------------------------------------------------|
| `common/decorators`     | Extracts the authenticated user from the JWT        |
| `common/dto`            | Shared `PaginationQueryDto` base class              |
| `common/filters`        | Formats all error responses consistently            |
| `common/interceptors`   | Wraps all success responses in `{ success, data }`  |
| `modules/auth`          | Registration, login, `/auth/me`, JWT guard          |
| `modules/project`       | Project CRUD with ownership authorization           |
| `modules/task`          | Task CRUD with project-scoped authorization         |
| `prisma`                | Database client and service                         |

---

## Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later
- **PostgreSQL** v13 or later (running locally or remote)
- **Git**

---

## Installation

```bash
git clone <repository-url>
cd project-task-management-api
npm install
```

---

## Environment Configuration

Copy the example file:

```bash
# Linux / macOS
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

Open `.env` and fill in your values:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/your_db_name"
JWT_SECRET=replace_with_a_strong_secret_at_least_32_chars
JWT_EXPIRES_IN=1d
```

| Variable       | Description                                  |
|----------------|----------------------------------------------|
| `DATABASE_URL` | PostgreSQL connection string                 |
| `JWT_SECRET`   | Secret used to sign and verify JWTs          |
| `JWT_EXPIRES_IN` | Token expiry duration (e.g. `1d`, `7d`)   |

> **Never commit `.env` to Git.** It is already listed in `.gitignore`.

---

## Database Setup

1. Ensure PostgreSQL is running.
2. Create a database (e.g. `PTM_db`).
3. Set `DATABASE_URL` in `.env`.
4. Run migrations to create all tables:

```bash
npx prisma migrate dev
```

5. Generate the Prisma Client:

```bash
npx prisma generate
```

To visually inspect the database:

```bash
npx prisma studio
```

---

## Database Migrations

Migration files are committed to the repository under `prisma/migrations/`.

| Command | Purpose |
|---------|---------|
| `npx prisma migrate dev` | Apply pending migrations and generate client (development) |
| `npx prisma migrate deploy` | Apply pending migrations without prompts (CI/production) |
| `npx prisma generate` | Regenerate the Prisma Client after schema changes |

---

## Running the Application

```bash
# Development (watch mode — recommended)
npm run start:dev

# Standard start
npm run start

# Production (requires a prior build)
npm run build
npm run start:prod
```

The API is available at:

```
http://localhost:4000
```

> The port defaults to `4000`. Override it by setting `PORT` in `.env`.

---

## API Documentation

Two documentation UIs are available once the server is running:

| Interface | URL |
|-----------|-----|
| **Scalar** (interactive, recommended) | `http://localhost:4000/api/docs` |
| **Swagger UI** (fallback) | `http://localhost:4000/docs` |

The documentation covers:
- All endpoints and HTTP methods
- Authentication requirements (Bearer JWT)
- Request parameters and bodies
- Response shapes
- Validation and authorization error responses

---

## Authentication

### Flow

1. Register a new account — `POST /api/auth/register`
2. Login with your credentials — `POST /api/auth/login`
3. Receive a JWT in the response
4. Include the JWT in every subsequent protected request:

```http
Authorization: Bearer <JWT_TOKEN>
```

Passwords are hashed with **bcrypt** before storage. Password hashes are never returned in any API response.

---

## Authorization Model

| Actor | Permissions |
|-------|-------------|
| **Project Owner** | Full access: create/view/update/delete project; create/view/update/delete any task; assign/reassign tasks |
| **Task Assignee (Participant)** | View the project; view their own assigned task; update their own assigned task (title, description, status, priority) |
| **Unrelated User** | No access to other users' projects or tasks |

Key rules enforced server-side:

- `ownerId` is always taken from the JWT — the client cannot set it.
- Only the project owner may create, delete, or reassign tasks.
- A participant may only view and update the specific task they are assigned to — not other tasks in the same project.
- Only users who exist in the database may be assigned to a task.
- All route ID parameters are validated as UUIDs before reaching business logic.

---

## API Endpoints

### Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/register` | None | Register a new user |
| `POST` | `/api/auth/login` | None | Login and receive a JWT |
| `GET` | `/api/auth/me` | JWT | Get the current user's profile |

### Projects

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/projects` | JWT | Create a project (owner is JWT user) |
| `GET` | `/api/projects` | JWT | List accessible projects (owned + participated) |
| `GET` | `/api/projects/:id` | JWT | Get a single project (owner or participant) |
| `PATCH` | `/api/projects/:id` | JWT | Update a project (owner only) |
| `DELETE` | `/api/projects/:id` | JWT | Delete a project and all its tasks (owner only) |

### Tasks

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/projects/:projectId/tasks` | JWT | Create a task in a project (owner only) |
| `GET` | `/api/projects/:projectId/tasks` | JWT | List tasks (owner: all; participant: own only) |
| `GET` | `/api/tasks/assigned-to-me` | JWT | List all tasks assigned to the JWT user |
| `GET` | `/api/tasks/:id` | JWT | Get a single task (owner or that task's assignee) |
| `PATCH` | `/api/tasks/:id` | JWT | Update a task (owner or that task's assignee) |
| `DELETE` | `/api/tasks/:id` | JWT | Delete a task (owner only) |

---

## Task Filtering & Pagination

All list endpoints support pagination and search. Task list endpoints additionally support status and priority filtering.

```
GET /api/projects/:projectId/tasks?page=1&limit=10&status=TODO&priority=HIGH&search=design
GET /api/tasks/assigned-to-me?page=1&limit=10&status=IN_PROGRESS&search=homepage
GET /api/projects?page=1&limit=10&search=marketing
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | `1` | Page number (min: 1) |
| `limit` | integer | `10` | Items per page (min: 1, max: 100) |
| `status` | enum | — | `TODO` \| `IN_PROGRESS` \| `DONE` |
| `priority` | enum | — | `LOW` \| `MEDIUM` \| `HIGH` |
| `search` | string | — | Partial, case-insensitive match on title/name |

### Paginated Response Shape

```json
{
  "success": true,
  "data": [ ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

---

## Validation & Error Handling

### Validation Strategy

- **Request bodies** — validated via `class-validator` decorators on DTOs
- **Query parameters** — validated via `class-validator` with `@Type(() => Number)` coercion
- **Route parameters** — all UUID params validated with NestJS `ParseUUIDPipe` before reaching handlers
- `ValidationPipe` is global with `whitelist: true` and `forbidNonWhitelisted: true`

### Error Response Format

All errors follow a consistent shape:

```json
{
  "success": false,
  "message": "Access denied"
}
```

Validation errors include a field-level breakdown:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "title", "message": "title should not be empty" },
    { "field": "status", "message": "status must be TODO, IN_PROGRESS, or DONE" }
  ]
}
```

### Success Response Format

```json
{
  "success": true,
  "data": { }
}
```

---

## HTTP Status Codes

| Status | Meaning |
|--------|---------|
| `200` | Successful GET / PATCH / DELETE |
| `201` | Resource created (POST) |
| `400` | Validation error or bad request |
| `401` | Missing or invalid JWT |
| `403` | Authenticated but not authorized |
| `404` | Resource not found |
| `409` | Conflict (e.g. email already registered) |
| `500` | Unexpected internal server error |

---

## Testing

The project includes a Jest configuration and an end-to-end test scaffold.

```bash
# Unit tests (no unit test files written yet)
npm test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:cov
```

> No unit or integration test cases have been implemented in this submission. The test infrastructure (Jest, Supertest, `@nestjs/testing`) is installed and configured.

---

## Prisma Commands Reference

```bash
# Apply migrations and regenerate client (development)
npx prisma migrate dev

# Apply migrations without prompts (production/CI)
npx prisma migrate deploy

# Regenerate Prisma Client after schema changes
npx prisma generate

# Open Prisma Studio (database browser)
npx prisma studio

# Validate the schema
npx prisma validate

# Format the schema file
npx prisma format
```

---

## Git & Repository Notes

- `.env` is listed in `.gitignore` — never committed
- `node_modules/` is excluded
- `.env.example` is committed as a configuration template
- `prisma/migrations/` is committed — reviewers do not need to generate migrations manually
- `generated/prisma/` (Prisma Client output) is excluded from Git

---

## Known Limitations & Assumptions

- **No automated test cases** — the test infrastructure is present but no test specs were written.
- **No Docker support** — the project requires a locally installed PostgreSQL instance.
- **Task cascade delete** — when a project is deleted, all its tasks are automatically deleted via the Prisma `onDelete: Cascade` relation.
- **Task assignment model** — any existing user may be assigned to a task. Being assigned to a task grants participant access to that project only. There is no separate project membership table.
- **Pagination max limit** — `limit` is capped at `100` per request.
- **`assignedToId` reassignment** — only the project owner may change the `assignedToId` field on an existing task.

---

## Bonus Features Implemented

| Feature | Details |
|---------|---------|
| **Search** | All list endpoints support `?search=` for partial, case-insensitive name/title filtering |
| **Scalar API Docs** | Interactive documentation at `/api/docs` |
| **OpenAPI/Swagger** | Machine-readable spec at `/docs` |
| **UUID Validation** | All route ID parameters are validated as UUIDs via `ParseUUIDPipe` |
| **Shared base DTO** | `PaginationQueryDto` is extended by all query DTOs — no duplication |

---

## Assignment Compliance

```
[x] User registration
[x] User login with JWT
[x] Current-user endpoint (/auth/me)
[x] Password hashing (bcrypt)
[x] Project CRUD
[x] Project ownership authorization (server-side)
[x] Task CRUD (scoped to project)
[x] Task assignment to users
[x] Task status and priority
[x] Task filtering by status and priority
[x] Task pagination
[x] Search across all list endpoints
[x] Input validation (class-validator, ParseUUIDPipe)
[x] Consistent error handling and response format
[x] Prisma ORM with migrations
[x] API documentation (Scalar + Swagger)
[x] Participant authorization (task-level, not project-level)
[ ] Automated tests (infrastructure present; no test cases written)
[ ] Docker support
```
