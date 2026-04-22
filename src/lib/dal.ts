import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { decryptSession, readSessionCookie } from "@/lib/session";

export const getSession = cache(async () => {
  const token = await readSessionCookie();
  return decryptSession(token);
});

export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true },
  });
  return user;
});

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/punch");
  return user;
}

export async function requireWorker() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "WORKER") redirect("/admin");
  return user;
}
