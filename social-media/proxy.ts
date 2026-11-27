import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET);

const publicPaths = ["/login", "/signup", "/verify"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("session")?.value;

  let loggedIn = false;
  if (token) {
    try {
      await jwtVerify(token, secret);
      loggedIn = true;
    } catch {
      loggedIn = false;
    }
  }

  const isPublic = publicPaths.some((p) => pathname.startsWith(p));

  if (!loggedIn && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (loggedIn && (pathname.startsWith("/login") || pathname.startsWith("/signup"))) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};