import { NextResponse } from "next/server";

export async function GET() {
  const env = {
    DATABASE_URL_set: !!process.env.DATABASE_URL,
    DATABASE_URL_prefix: process.env.DATABASE_URL?.slice(0, 20),
    DATABASE_AUTH_TOKEN_set: !!process.env.DATABASE_AUTH_TOKEN,
    DATABASE_AUTH_TOKEN_length: process.env.DATABASE_AUTH_TOKEN?.length,
    SESSION_SECRET_set: !!process.env.SESSION_SECRET,
    SESSION_SECRET_length: process.env.SESSION_SECRET?.length,
    NODE_ENV: process.env.NODE_ENV,
  };

  let dbTest: { ok: boolean; error?: string; userCount?: number } = {
    ok: false,
  };
  try {
    const { prisma } = await import("@/lib/prisma");
    const count = await prisma.user.count();
    dbTest = { ok: true, userCount: count };
  } catch (e) {
    dbTest = {
      ok: false,
      error: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
    };
  }

  return NextResponse.json({ env, dbTest });
}
