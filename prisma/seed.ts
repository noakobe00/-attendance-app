import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const adminHash = await bcrypt.hash("admin1234", 10);
  const workerHash = await bcrypt.hash("worker1234", 10);

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      passwordHash: adminHash,
      name: "管理者",
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "worker1@example.com" },
    update: {},
    create: {
      email: "worker1@example.com",
      passwordHash: workerHash,
      name: "打刻者1",
      role: "WORKER",
    },
  });

  await prisma.user.upsert({
    where: { email: "worker2@example.com" },
    update: {},
    create: {
      email: "worker2@example.com",
      passwordHash: workerHash,
      name: "打刻者2",
      role: "WORKER",
    },
  });

  console.log("Seed data created successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
