# focused-backend

GraphQL API for the Focused app, built with Apollo Server v4, Prisma ORM, and TypeScript, targeting an AWS RDS MySQL database.

## Tech Stack

- **Runtime**: Node.js (ESM) + TypeScript
- **API**: Apollo Server v4 (GraphQL)
- **ORM**: Prisma 7 with a custom generated client
- **Database**: MySQL (AWS RDS)

## Prerequisites

- Node.js 20+
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
npx prisma migrate deploy
```

### 6. Start the server

```bash
npm run start
```

The GraphQL API will be available at **http://localhost:4000**.

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
```
