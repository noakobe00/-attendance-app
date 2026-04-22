import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decryptSession } from "@/lib/session";

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get("session")?.value;
  const session = await decryptSession(token);

  const isAdminRoute = pathname.startsWith("/admin");
  const isPunchRoute = pathname.startsWith("/punch");
  const isLoginRoute = pathname === "/login";

  if ((isAdminRoute || isPunchRoute) && !session) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isAdminRoute && session && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/punch", req.nextUrl));
  }

  if (isPunchRoute && session && session.role !== "WORKER") {
    return NextResponse.redirect(new URL("/admin", req.nextUrl));
  }

  if (isLoginRoute && session) {
    return NextResponse.redirect(
      new URL(session.role === "ADMIN" ? "/admin" : "/punch", req.nextUrl)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
