import "server-only";

import type { AiConfigStatus } from "./types";

function resolveModel() {
  return process.env.NSML_AI_MODEL?.trim() || "gpt-4.1-mini";
}

export function getAiConfigStatus(): AiConfigStatus {
  const provider = (process.env.NSML_AI_PROVIDER?.trim().toLowerCase() || "openai") as AiConfigStatus["provider"];
  const model = resolveModel();

  if (provider !== "openai") {
    return {
      provider: "openai",
      model,
      enabled: false,
      message: `AI provider "${provider}" is not supported yet. Set NSML_AI_PROVIDER=openai to enable structured triage.`,
    };
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim() || "";

  if (!apiKey) {
    return {
      provider: "openai",
      model,
      enabled: false,
      message: "AI not configured. Set OPENAI_API_KEY to enable structured triage.",
    };
  }

  return {
    provider: "openai",
    model,
    enabled: true,
    message: `Structured triage enabled with ${provider} (${model}).`,
  };
}
