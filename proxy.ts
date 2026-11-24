import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get("glint-session")?.value);

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(hasSession ? "/home" : "/login", request.url),
    );
  }

  if ((pathname === "/login" || pathname === "/cadastro") && hasSession) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/cadastro"],
};

