import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function cleanEnv(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const cleaned = value.replace(/\s+/g, "");
  return cleaned.length > 0 ? cleaned : undefined;
}

const adapter = new PrismaLibSql({
  url: cleanEnv(process.env.DATABASE_URL) ?? "file:./dev.db",
  authToken: cleanEnv(process.env.DATABASE_AUTH_TOKEN),
});

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
