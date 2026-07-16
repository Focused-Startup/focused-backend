# Local Development Environment

This folder spins up a local MySQL database matching `prisma/schema.prisma`,
so you can develop and test `focused-backend` without touching the AWS RDS
instance.

See the "Local Database (Docker)" section in the root [README.md](../README.md)
for full usage instructions.

## Contents

- `Dockerfile` — MySQL 8.0 image with local-only default credentials
- `docker-compose.yml` — runs the `db` container and a one-shot `seed` container
- `.env.example` — copy to `.env` to override local credentials/ports
- `seed/` — seeds the database with mock data on container start
  - `seed.ts` — applies the schema and inserts the mock data via Prisma
  - `data/` — mock users, notes, questions, responses, and goals
  - `Dockerfile` — builds the seed runner image
