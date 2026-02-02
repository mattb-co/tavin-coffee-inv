import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "http://localhost:5173";

export function middleware(request: NextRequest) {
  const res = NextResponse.next();
  if (request.nextUrl.pathname.startsWith("/api")) {
    res.headers.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: res.headers });
  }
  return res;
}
