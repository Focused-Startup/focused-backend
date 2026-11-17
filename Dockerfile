FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY src ./src
COPY prisma ./prisma
EXPOSE 4000


CMD ["npm","run", "start"]