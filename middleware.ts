import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const token = process.env.WATCHTOWER_CRON_TOKEN;
  if (!token) return NextResponse.next(); // no-op in dev without the token set

  const auth = req.headers.get("authorization") ?? "";
  const valid = auth.startsWith("Basic ") && atob(auth.slice(6)) === `admin:${token}`;

  if (!valid) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Watchtower Admin"' },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
