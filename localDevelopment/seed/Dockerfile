# Runs once against the `db` service defined in docker-compose.yml:
#    1. Applies the schema defined in prisma/schema.prisma to the local MySQL database via `prisma db push`
#   2. Seeds it with the mock data under localDevelopment/seed/data via seed.ts
#
# Built from the repo root (context: ..) so it has access to prisma/schema.prisma
# and package.json/package-lock.json.
FROM node:24-slim

# node:24-slim (Debian) doesn't ship OpenSSL, which the Prisma query engine
# needs to detect the correct libssl version. Without this, Prisma silently
# falls back to a guessed "openssl-1.1.x" engine that may not match what's
# actually available, causing connection/runtime errors.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install deps first for better layer caching.
COPY package.json package-lock.json ./
RUN npm ci

# Bring in only what the seed step actually needs.
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY localDevelopment/seed ./localDevelopment/seed

RUN npx prisma generate

# `db push` no longer accepts --skip-generate in this Prisma version (it's
# not a recognized flag) — the client was already generated above, so we
# just drop the flag rather than regenerating twice.
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx tsx localDevelopment/seed/seed.ts"]
