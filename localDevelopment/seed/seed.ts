// Seeds the local MySQL container with mock data (localDevelopment/seed/data).
// Run automatically by the `seed` service in docker-compose.yml after
// `prisma db push`, or manually with:
//   DATABASE_URL="mysql://focused:focused@127.0.0.1:3306/focused_dev" npx tsx localDevelopment/seed/seed.ts
//
// Uses the same generated Prisma client as the app (src/generated/prisma) —
// no raw SQL, per project convention.
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../../src/generated/prisma/client.js";
import { users, notes, questions, responses, goals } from "./data/index.js";

// Mirrors src/db/client.ts's adapter setup so seeding goes through the same
// Prisma client configuration the app uses at runtime (no raw SQL).
const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST ?? "db",
  user: process.env.DATABASE_USER ?? "focused",
  password: process.env.DATABASE_PASSWORD ?? "focused",
  database: process.env.DATABASE_NAME ?? "focused_dev",
  port: process.env.DATABASE_PORT ? Number(process.env.DATABASE_PORT) : 3306,
  connectionLimit: 5,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding local database...");

  // Clear existing rows so this script is safely re-runnable.
  await prisma.response.deleteMany();
  await prisma.question.deleteMany();
  await prisma.note.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.canvasUserRelationship.deleteMany();
  await prisma.canvas.deleteMany();
  await prisma.userRelationship.deleteMany();
  await prisma.user.deleteMany();

  const createdUsers = await Promise.all(
    users.map((u) => prisma.user.create({ data: u })),
  );
  const userIdByUsername = new Map(createdUsers.map((u) => [u.username, u.id]));

  await Promise.all(
    notes.map((n) =>
      prisma.note.create({
        data: {
          content: n.content,
          authorId: userIdByUsername.get(n.authorUsername)!,
        },
      }),
    ),
  );

  const createdQuestions = await Promise.all(
    questions.map((q) =>
      prisma.question.create({
        data: {
          body: q.body,
          authorId: userIdByUsername.get(q.authorUsername)!,
        },
      }),
    ),
  );
  const questionIdByBody = new Map(createdQuestions.map((q) => [q.body, q.id]));

  await Promise.all(
    responses.map((r) =>
      prisma.response.create({
        data: {
          body: r.body,
          authorId: userIdByUsername.get(r.authorUsername)!,
          questionId: questionIdByBody.get(r.questionBody)!,
        },
      }),
    ),
  );

  await Promise.all(
    goals.map((g) =>
      prisma.goal.create({
        data: {
          content: g.content,
          dueDate: new Date(g.dueDate),
          userId: userIdByUsername.get(g.userUsername)!,
        },
      }),
    ),
  );

  console.log(
    `Seeded ${createdUsers.length} users, ${notes.length} notes, ${questions.length} questions, ${responses.length} responses, ${goals.length} goals.`,
  );
}

main()
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
