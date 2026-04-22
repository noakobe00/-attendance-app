"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";

export type LoginState =
  | { error?: string; fields?: { email?: string } }
  | undefined;

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "メールアドレスとパスワードを入力してください", fields: { email } };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "メールアドレスまたはパスワードが違います", fields: { email } };
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return { error: "メールアドレスまたはパスワードが違います", fields: { email } };
  }

  if (user.role !== "ADMIN" && user.role !== "WORKER") {
    return { error: "アカウントの権限設定が正しくありません", fields: { email } };
  }

  await createSession(user.id, user.role);
  redirect(user.role === "ADMIN" ? "/admin" : "/punch");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
