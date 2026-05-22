#!/usr/bin/env node

function truthy(value) {
  return Boolean(value && ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase()));
}

function stateLine(label, state, details) {
  console.log(`- ${label}: ${state}${details ? ` - ${details}` : ""}`);
}

function classifyPresence({ configured, disabled, isProduction }) {
  if (disabled) return "intentionally disabled";
  if (configured) return "ready";
  return isProduction ? "production misconfigured / fail closed" : "development fallback";
}

const env = process.env;
const isProduction = env.NODE_ENV === "production";
const accessGateConfigured = Boolean(env.NSML_APP_PASSWORD?.trim() && env.NSML_SESSION_SECRET?.trim());
const supabaseDisabled = truthy(env.NSML_SUPABASE_DISABLED);
const aiDisabled = truthy(env.NSML_AI_DISABLED) || env.NSML_AI_PROVIDER?.trim().toLowerCase() === "disabled";
const supabaseConfigured = Boolean(env.SUPABASE_URL?.trim() && env.SUPABASE_SERVICE_ROLE_KEY?.trim());
const evidenceBucketReady = env.NSML_EVIDENCE_BUCKET?.trim() === "nsml-evidence-files";
const aiConfigured =
  env.NSML_AI_PROVIDER?.trim().toLowerCase() === "openai" &&
  Boolean(env.OPENAI_API_KEY?.trim()) &&
  Boolean(env.NSML_AI_MODEL?.trim());

const checks = [
  {
    label: "Access gate",
    state: accessGateConfigured
      ? "ready"
      : isProduction
        ? "production misconfigured / fail closed"
        : "development fallback",
    details: accessGateConfigured
      ? "NSML_APP_PASSWORD and NSML_SESSION_SECRET are present."
      : isProduction
        ? "Production will fail closed until the access gate env vars are set."
        : "Local development fallback is active because access-gate env vars are missing.",
  },
  {
    label: "Supabase core",
    state: classifyPresence({
      configured: supabaseConfigured,
      disabled: supabaseDisabled,
      isProduction,
    }),
    details: supabaseDisabled
      ? "Supabase is intentionally disabled for this deployment."
      : supabaseConfigured
        ? "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are present."
        : isProduction
          ? "Production needs Supabase configured or intentionally disabled."
          : "Local development fallback is active because Supabase env vars are missing.",
  },
  {
    label: "Private evidence storage",
    state: supabaseDisabled
      ? "intentionally disabled"
      : classifyPresence({
          configured: supabaseConfigured && evidenceBucketReady,
          disabled: false,
          isProduction,
        }),
    details: supabaseDisabled
      ? "Storage is intentionally disabled because Supabase is disabled."
      : supabaseConfigured && evidenceBucketReady
        ? "Private bucket nsml-evidence-files is configured."
        : isProduction
          ? "Production needs the private nsml-evidence-files bucket configured and private."
          : "Local development fallback is active because the private evidence bucket is missing.",
  },
  {
    label: "AI readiness",
    state: classifyPresence({
      configured: aiConfigured,
      disabled: aiDisabled,
      isProduction,
    }),
    details: aiDisabled
      ? "AI is intentionally disabled for this deployment."
      : aiConfigured
        ? "NSML_AI_PROVIDER, NSML_AI_MODEL, and OPENAI_API_KEY are present."
        : isProduction
          ? "Production needs AI configured or intentionally disabled."
          : "Local development fallback is active because AI env vars are missing.",
  },
];

console.log("NSML WorkDesk deployment preflight");
console.log(`Mode: ${isProduction ? "production" : "development"}`);
for (const check of checks) {
  stateLine(check.label, check.state, check.details);
}

console.log("");
console.log("Smoke-test reminders:");
console.log("- /login loads publicly.");
console.log("- Protected routes redirect when unauthenticated.");
console.log("- Dashboard, import, cases, drafts, and writing-style load after login.");
console.log("- Evidence upload or fallback state is honest.");
console.log("- Draft copy remains gated by red-team pass/pass_with_caution and safe_to_copy.");
console.log("- No send button exists and route surface remains NSML-only.");

if (checks.some((check) => check.state === "production misconfigured / fail closed")) {
  process.exitCode = 1;
}
