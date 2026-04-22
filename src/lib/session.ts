import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export type SessionPayload = {
  userId: string;
  role: "ADMIN" | "WORKER";
  expiresAt: Date;
};

const SESSION_COOKIE = "session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function getEncodedKey() {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function encryptSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ userId: payload.userId, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(payload.expiresAt)
    .sign(getEncodedKey());
}

export async function decryptSession(
  token: string | undefined
): Promise<{ userId: string; role: "ADMIN" | "WORKER" } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getEncodedKey(), {
      algorithms: ["HS256"],
    });
    const userId = payload.userId;
    const role = payload.role;
    if (typeof userId !== "string") return null;
    if (role !== "ADMIN" && role !== "WORKER") return null;
    return { userId, role };
  } catch {
    return null;
  }
}

export async function createSession(userId: string, role: "ADMIN" | "WORKER") {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const token = await encryptSession({ userId, role, expiresAt });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function readSessionCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
}
