import "server-only";

import { getAccessGateStatus } from "@/lib/access-gate";
import { getAiConfigStatus } from "@/lib/ai/config";
import { getPersistenceConfig, hasEvidenceStorageConfig, hasPersistenceConfig } from "@/lib/persistence/config";

export type DeploymentReadinessState =
  | "ready"
  | "intentionally_disabled"
  | "development_fallback"
  | "production_misconfigured";

export type DeploymentReadinessCheck = {
  key: string;
  label: string;
  state: DeploymentReadinessState;
  required: boolean;
  details: string;
  env: string[];
};

export type DeploymentReadinessReport = {
  overall: DeploymentReadinessState;
  checks: DeploymentReadinessCheck[];
  notes: string[];
};

function truthy(value: string | undefined | null) {
  return Boolean(value && ["1", "true", "yes", "on"].includes(value.trim().toLowerCase()));
}

function classifyRequiredConfig({
  configured,
  disabled,
  isProduction,
}: {
  configured: boolean;
  disabled: boolean;
  isProduction: boolean;
}): DeploymentReadinessState {
  if (disabled) return "intentionally_disabled";
  if (configured) return "ready";
  return isProduction ? "production_misconfigured" : "development_fallback";
}

function hasExpectedEvidenceBucket(env: NodeJS.ProcessEnv = process.env) {
  return env.NSML_EVIDENCE_BUCKET?.trim() === "nsml-evidence-files";
}

export function getDeploymentReadinessReport(
  env: NodeJS.ProcessEnv = process.env,
): DeploymentReadinessReport {
  const gate = getAccessGateStatus(env);
  const persistence = getPersistenceConfig();
  const ai = getAiConfigStatus();
  const isProduction = env.NODE_ENV === "production";
  const supabaseDisabled = truthy(env.NSML_SUPABASE_DISABLED);
  const aiDisabled = truthy(env.NSML_AI_DISABLED) || env.NSML_AI_PROVIDER?.trim().toLowerCase() === "disabled";

  const checks: DeploymentReadinessCheck[] = [
    {
      key: "access_gate",
      label: "Access gate",
      state: gate.configured
        ? "ready"
        : isProduction
          ? "production_misconfigured"
          : "development_fallback",
      required: true,
      details: gate.configured
        ? "NSML_APP_PASSWORD and NSML_SESSION_SECRET are configured."
        : isProduction
          ? "Production is fail-closed until NSML_APP_PASSWORD and NSML_SESSION_SECRET are configured."
          : "Development fallback is active because the access-gate env vars are missing.",
      env: ["NSML_APP_PASSWORD", "NSML_SESSION_SECRET"],
    },
    {
      key: "supabase",
      label: "Supabase core",
      state: classifyRequiredConfig({
        configured: Boolean(persistence.supabaseUrl && persistence.serviceRoleKey),
        disabled: supabaseDisabled,
        isProduction,
      }),
      required: false,
      details: supabaseDisabled
        ? "Supabase is intentionally disabled for this deployment."
        : hasPersistenceConfig()
          ? "Supabase URL and service role key are configured."
          : isProduction
            ? "Supabase is missing in production. Either configure it or explicitly disable it."
            : "Development fallback is active because Supabase env vars are missing.",
      env: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    },
    {
      key: "storage",
      label: "Private evidence storage",
      state: supabaseDisabled
        ? "intentionally_disabled"
        : classifyRequiredConfig({
            configured: hasEvidenceStorageConfig(),
            disabled: false,
            isProduction,
          }),
      required: false,
      details: supabaseDisabled
        ? "Storage is intentionally disabled because Supabase is disabled for this deployment."
        : hasEvidenceStorageConfig() && hasExpectedEvidenceBucket(env)
          ? "Private evidence storage is configured with the private nsml-evidence-files bucket."
          : isProduction
            ? "Private evidence storage is missing in production. The private nsml-evidence-files bucket must exist and remain private."
            : "Development fallback is active because the private evidence bucket is not configured.",
      env: ["NSML_EVIDENCE_BUCKET", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    },
    {
      key: "ai",
      label: "AI readiness",
      state: classifyRequiredConfig({
        configured: ai.enabled,
        disabled: aiDisabled,
        isProduction,
      }),
      required: false,
      details: aiDisabled
        ? "AI is intentionally disabled for this deployment."
        : ai.enabled
          ? "AI provider, model, and API key are configured."
          : isProduction
            ? "AI is not configured in production. Either configure it or explicitly disable it."
            : ai.message,
      env: ["NSML_AI_PROVIDER", "NSML_AI_MODEL", "OPENAI_API_KEY"],
    },
  ];

  const overall: DeploymentReadinessState = checks.some((check) => check.state === "production_misconfigured")
    ? "production_misconfigured"
    : checks.some((check) => check.state === "development_fallback")
      ? "development_fallback"
      : checks.some((check) => check.state === "intentionally_disabled")
        ? "intentionally_disabled"
        : "ready";

  const notes = [
    "Production must fail closed when access-gate env vars are missing.",
    "Intentional disable states should be documented explicitly rather than implied.",
    "Middleware/proxy migration remains a backlog item unless a low-risk fix is later approved.",
  ];

  return { overall, checks, notes };
}
