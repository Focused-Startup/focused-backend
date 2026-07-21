# Local MySQL database for focused-backend development.
#
# This image just wraps the official MySQL 8.0 image with sane defaults and a
# healthcheck so `docker-compose.yml` (in this same folder) can wait for the
# database to be ready before running `prisma db push` / the seed script.
#
# The actual schema (tables, columns, relations) is NOT baked into this image.
# Instead, it is applied at container start time straight from
# `prisma/schema.prisma` via Prisma, so the local database is always in sync
# with the schema checked into source control — no separate SQL to maintain.
FROM mysql:8.0

# Sensible local-only defaults. Override any of these via docker-compose.yml
# or a `.env` file placed next to it if you need different values.
ENV MYSQL_DATABASE=focused_dev
ENV MYSQL_USER=focused
ENV MYSQL_PASSWORD=focused
ENV MYSQL_ROOT_PASSWORD=root

EXPOSE 3306

# Lets `depends_on: condition: service_healthy` in docker-compose.yml know
# when MySQL is actually accepting connections (not just that the process
# started).
HEALTHCHECK --interval=5s --timeout=5s --retries=10 \
  CMD mysqladmin ping -h 127.0.0.1 -u root -p"$MYSQL_ROOT_PASSWORD" --silent
