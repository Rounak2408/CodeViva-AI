import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isAdmin = req.auth?.user?.role === "ADMIN";
  if (req.nextUrl.pathname.startsWith("/admin") && !isAdmin) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
