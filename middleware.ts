import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE_NAME,
  getAccessGateStatus,
  isPublicPath,
  verifySignedSessionToken,
} from "@/lib/access-gate";

function withPathHeader(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nsml-pathname", request.nextUrl.pathname);

  return requestHeaders;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const gate = getAccessGateStatus();
  const requestHeaders = withPathHeader(request);

  if (isPublicPath(pathname)) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (gate.mode === "development-fallback") {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (gate.mode === "production-misconfigured") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "setup");

    return NextResponse.redirect(url);
  }

  const token = request.cookies.get(ACCESS_COOKIE_NAME)?.value;

  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);

    return NextResponse.redirect(url);
  }

  const verification = await verifySignedSessionToken(
    token,
    process.env.NSML_SESSION_SECRET?.trim() || "nsml-workdesk-dev-session-secret",
  );

  if (!verification.valid) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);

    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/|login|favicon.ico|robots.txt|sitemap.xml).*)"],
};
