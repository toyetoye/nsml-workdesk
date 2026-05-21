import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE_NAME,
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
  const requestHeaders = withPathHeader(request);
  const appPassword = process.env.NSML_APP_PASSWORD?.trim() ?? "";
  const sessionSecret = process.env.NSML_SESSION_SECRET?.trim() ?? "";
  const isProduction = process.env.NODE_ENV === "production";
  const configured = Boolean(appPassword && sessionSecret);
  const developmentFallback = !configured && !isProduction;

  if (isPublicPath(pathname)) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (developmentFallback) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (!configured && isProduction) {
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
    sessionSecret || "nsml-workdesk-dev-session-secret",
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
  matcher: ["/((?!_next/|favicon.ico|robots.txt|sitemap.xml).*)"],
};
