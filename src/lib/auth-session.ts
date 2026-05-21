import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ACCESS_COOKIE_NAME,
  ACCESS_SESSION_TTL_SECONDS,
  getAccessGateStatus,
  type AccessGateMode,
  normalizeRedirectTarget,
  verifySignedSessionToken,
} from "@/lib/access-gate";

const DEV_SESSION_SECRET = "nsml-workdesk-dev-session-secret";

export type AccessSessionState = {
  mode: AccessGateMode;
  authenticated: boolean;
  configured: boolean;
  missingEnv: string[];
  warningMessage: string;
};

function resolveSessionSecret() {
  return process.env.NSML_SESSION_SECRET?.trim() || DEV_SESSION_SECRET;
}

function resolveAppPassword() {
  return process.env.NSML_APP_PASSWORD?.trim() || "";
}

export async function getAccessSessionState(): Promise<AccessSessionState> {
  const gate = getAccessGateStatus();

  if (gate.mode === "development-fallback") {
    return {
      mode: gate.mode,
      authenticated: false,
      configured: false,
      missingEnv: gate.missingEnv,
      warningMessage: gate.warningMessage,
    };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;

  if (!token) {
    return {
      mode: gate.mode,
      authenticated: false,
      configured: gate.configured,
      missingEnv: gate.missingEnv,
      warningMessage: gate.warningMessage,
    };
  }

  const verification = await verifySignedSessionToken(token, resolveSessionSecret());

  return {
    mode: gate.mode,
    authenticated: verification.valid,
    configured: gate.configured,
    missingEnv: gate.missingEnv,
    warningMessage: gate.warningMessage,
  };
}

export async function requireWritableAccess(redirectTo: string) {
  const gate = getAccessGateStatus();

  if (gate.mode === "production-misconfigured") {
    redirect("/login?error=setup");
  }

  if (gate.mode === "development-fallback") {
    return {
      gate,
      sessionState: {
        mode: gate.mode,
        authenticated: false,
        configured: false,
        missingEnv: gate.missingEnv,
        warningMessage: gate.warningMessage,
      } satisfies AccessSessionState,
    };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;

  if (!token) {
    redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  const verification = await verifySignedSessionToken(token, resolveSessionSecret());

  if (!verification.valid) {
    redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  return {
    gate,
    sessionState: {
      mode: gate.mode,
      authenticated: true,
      configured: gate.configured,
      missingEnv: gate.missingEnv,
      warningMessage: gate.warningMessage,
    } satisfies AccessSessionState,
  };
}

export async function setAccessSessionCookie() {
  const token = await import("@/lib/access-gate").then(({ createSignedSessionToken }) =>
    createSignedSessionToken(resolveSessionSecret()),
  );

  const cookieStore = await cookies();
  cookieStore.set({
    name: ACCESS_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ACCESS_SESSION_TTL_SECONDS,
  });
}

export async function clearAccessSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_COOKIE_NAME);
}

export function getLoginRedirectTarget(formData: FormData) {
  return normalizeRedirectTarget(String(formData.get("redirectTo") ?? "/dashboard"));
}

export function getSubmittedPassword(formData: FormData) {
  return String(formData.get("password") ?? "");
}

export function getExpectedAccessPassword() {
  return resolveAppPassword();
}
