export const ACCESS_COOKIE_NAME = "nsml_access_session";
export const DEFAULT_REDIRECT_TO = "/dashboard";
export const ACCESS_SESSION_TTL_SECONDS = 60 * 60 * 8;

export type AccessGateMode = "configured" | "development-fallback" | "production-misconfigured";

export type AccessGateStatus = {
  mode: AccessGateMode;
  isProduction: boolean;
  isDevelopment: boolean;
  configured: boolean;
  missingEnv: string[];
  warningMessage: string;
};

export type AccessSessionPayload = {
  v: 1;
  iat: number;
  exp: number;
  nonce: string;
};

const textEncoder = new TextEncoder();

function toBase64Url(input: Uint8Array) {
  let binary = "";

  for (const byte of input) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

function fromBase64Url(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function toJsonBase64Url(value: unknown) {
  return toBase64Url(textEncoder.encode(JSON.stringify(value)));
}

function fromJsonBase64Url<T>(value: string) {
  const bytes = fromBase64Url(value);
  const decoded = new TextDecoder().decode(bytes);

  return JSON.parse(decoded) as T;
}

function constantTimeEquals(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let result = 0;

  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return result === 0;
}

function safeTrim(value: string | undefined | null) {
  return value?.trim() ?? "";
}

export function getAccessGateStatus(env: NodeJS.ProcessEnv = process.env): AccessGateStatus {
  const isProduction = env.NODE_ENV === "production";
  const isDevelopment = !isProduction;
  const missingEnv: string[] = [];

  if (!safeTrim(env.NSML_APP_PASSWORD)) {
    missingEnv.push("NSML_APP_PASSWORD");
  }

  if (!safeTrim(env.NSML_SESSION_SECRET)) {
    missingEnv.push("NSML_SESSION_SECRET");
  }

  const configured = missingEnv.length === 0;
  const mode: AccessGateMode = configured
    ? "configured"
    : isProduction
      ? "production-misconfigured"
      : "development-fallback";

  return {
    mode,
    isProduction,
    isDevelopment,
    configured,
    missingEnv,
    warningMessage:
      mode === "development-fallback"
        ? "Development fallback is active because access-gate env vars are missing."
        : mode === "production-misconfigured"
          ? "Production is misconfigured. Set NSML_APP_PASSWORD and NSML_SESSION_SECRET before exposing the app."
          : "Single-user access gate is configured.",
  };
}

export function isPublicPath(pathname: string) {
  if (pathname === "/login" || pathname.startsWith("/login/")) {
    return true;
  }

  if (pathname.startsWith("/_next/")) {
    return true;
  }

  if (pathname.includes(".")) {
    return true;
  }

  return (
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  );
}

export function normalizeRedirectTarget(value: string | null | undefined) {
  const candidate = safeTrim(value);

  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return DEFAULT_REDIRECT_TO;
  }

  if (candidate === "/login" || candidate.startsWith("/login/")) {
    return DEFAULT_REDIRECT_TO;
  }

  return candidate;
}

export function createNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

export async function createSignedSessionToken(
  sessionSecret: string,
  ttlSeconds = ACCESS_SESSION_TTL_SECONDS,
) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload: AccessSessionPayload = {
    v: 1,
    iat: nowSeconds,
    exp: nowSeconds + ttlSeconds,
    nonce: createNonce(),
  };
  const encodedPayload = toJsonBase64Url(payload);
  const signature = await signAccessToken(encodedPayload, sessionSecret);

  return `v1.${encodedPayload}.${signature}`;
}

export async function verifySignedSessionToken(token: string, sessionSecret: string) {
  const [version, encodedPayload, signature] = token.split(".");

  if (version !== "v1" || !encodedPayload || !signature) {
    return { valid: false, reason: "malformed" as const };
  }

  let payload: AccessSessionPayload;

  try {
    payload = fromJsonBase64Url<AccessSessionPayload>(encodedPayload);
  } catch {
    return { valid: false, reason: "invalid-payload" as const };
  }

  if (payload.v !== 1 || typeof payload.exp !== "number" || payload.exp <= 0) {
    return { valid: false, reason: "invalid-payload" as const };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);

  if (payload.exp < nowSeconds) {
    return { valid: false, reason: "expired" as const, payload };
  }

  const expectedSignature = await signAccessToken(encodedPayload, sessionSecret);

  if (!constantTimeEquals(signature, expectedSignature)) {
    return { valid: false, reason: "signature-mismatch" as const, payload };
  }

  return { valid: true as const, payload };
}

async function signAccessToken(payload: string, sessionSecret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(sessionSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(payload));

  return toBase64Url(new Uint8Array(signature));
}
