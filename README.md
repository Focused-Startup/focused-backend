# focused-backend

GraphQL API for the Focused app, built with Apollo Server v4, Prisma ORM, and TypeScript, targeting an AWS RDS MySQL database.

## Tech Stack

- **Runtime**: Node.js (ESM) + TypeScript
- **API**: Apollo Server v4 (GraphQL)
- **ORM**: Prisma 7 with a custom generated client
- **Database**: MySQL (AWS RDS)

## Prerequisites

- Node.js 22+
- npm 10+
- A running MySQL database (local or AWS RDS)

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/Focused-Startup/focused-backend.git
cd focused-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"
```

Replace `USER`, `PASSWORD`, `HOST`, `PORT`, and `DATABASE` with your MySQL connection details.

### 4. Generate the Prisma client

```bash
npx prisma generate
```

### 5. Run database migrations

```bash
npx prisma migrate dev
```

### 6. Build the app

```bash
npm run build
```

### 6. Start the server

```bash
npm run start
```

## Local Database (Docker)

If you don't want to develop against the shared AWS RDS instance, you can run
a local MySQL database in Docker that matches `prisma/schema.prisma`, and
optionally seed it with mock data. All of this lives under `localDevelopment/`.

### 1. Start the local database

```bash
cd localDevelopment
cp .env.example .env   # optional: override default local credentials/ports
docker compose up -d db
```

This builds and starts a MySQL 8.0 container (`focused-local-db`) on
`127.0.0.1:3306` with the credentials from `.env.example`/`.env`
(`focused` / `focused`, database `focused_dev`). Data persists in the
`focused-local-db-data` Docker volume across restarts.

### 2. Point the backend at the local database

In the project root `.env`, temporarily swap in the local connection details
(keep your RDS values commented out so you can switch back easily):

```env
DATABASE_URL="mysql://focused:focused@127.0.0.1:3306/focused_dev"
DATABASE_USER="focused"
DATABASE_PASSWORD="focused"
DATABASE_NAME="focused_dev"
DATABASE_HOST="127.0.0.1"
DATABASE_PORT=3306
```

### 3. Seed mock data

Once connectivity is confirmed, seed the local database with mock users,
notes, questions, responses, and goals:

```bash
cd localDevelopment
docker compose run --rm seed
```

This builds a one-shot container that runs `prisma db push` against the `db`
service and then inserts the fixtures from `localDevelopment/seed/data/`
(safe to re-run — it clears existing rows first). See
`localDevelopment/README.md` for details on what's included.

You can now run `npm run start` from the project root as usual, and the
backend will read/write against your local, seeded database.

### Stopping / resetting

```bash
cd localDevelopment
docker compose down        # stop containers, keep data
docker compose down -v     # stop containers and wipe the local database
```

## Available Scripts

| Script | Description |
|---|---|
| `npm run start` | Start the server with `tsx` |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run lint` | Lint the `src/` directory |
| `npm run lint:fix` | Auto-fix lint errors |

## Project Structure

```
src/
  index.ts              # Apollo Server entry point
  schemas/              # GraphQL type definitions (root schema, enums, inputs, Query, Mutation)
  models/               # Per-model GraphQL type definitions
  resolvers/            # GraphQL resolvers
  generated/prisma/     # Auto-generated Prisma client (do not edit)
prisma/
  schema.prisma         # Prisma data model
  migrations/           # Database migration history
localDevelopment/
  Dockerfile            # Local MySQL 8.0 container definition
  docker-compose.yml    # Local db + one-shot seed container
  seed/                 # Mock data + seed script for the local database
```
