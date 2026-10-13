import { NextRequest, NextResponse } from "next/server";

// Fail closed: the admin is a browser-local demo without real authentication.
// Never expose these routes on the public production deployment.
export function proxy(request: NextRequest) {
  if (process.env.VERCEL_ENV === "production" && request.nextUrl.pathname.startsWith("/admin")) {
    return new NextResponse("Panel administrativo no disponible en producción.", {
      status: 404,
      headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" },
    });
  }
  return NextResponse.next();
}
export const config = { matcher: ["/admin/:path*"] };
