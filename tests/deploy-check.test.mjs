import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const script = fileURLToPath(new URL("../scripts/deploy-check.js", import.meta.url));
// Synthetic fixtures only. Never read the developer's .env files or use live credentials.
const access = {
  NODE_ENV: "production",
  NSML_APP_PASSWORD: "synthetic-password-not-a-real-secret",
  NSML_SESSION_SECRET: "synthetic-session-not-a-real-secret",
};
const configured = {
  ...access,
  SUPABASE_URL: "https://synthetic-project.invalid",
  SUPABASE_SERVICE_ROLE_KEY: "synthetic-service-role-not-a-real-secret",
  NSML_EVIDENCE_BUCKET: "nsml-evidence-files",
  NSML_AI_PROVIDER: "openai",
  OPENAI_API_KEY: "synthetic-api-key-not-a-real-secret",
  NSML_AI_MODEL: "synthetic-model",
};

function runPreflight(t, overrides = {}, files = {}) {
  const cwd = mkdtempSync(join(tmpdir(), "nsml-preflight-test-"));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const env = { ...process.env };
  for (const key of Object.keys(env)) {
    if (/^(NSML_|SUPABASE_|NEXT_PUBLIC_SUPABASE_|OPENAI_|AZURE_OPENAI_|NODE_ENV$|NODE_OPTIONS$)/i.test(key)) {
      delete env[key];
    }
  }
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(cwd, name), content, "utf8");
  }
  const result = spawnSync(process.execPath, [script], {
    cwd,
    env: { ...env, ...overrides },
    encoding: "utf8",
    timeout: 10000,
    windowsHide: true,
  });
  assert.equal(result.error, undefined);
  assert.equal(result.signal, null);
  return { status: result.status, output: result.stdout + result.stderr };
}

test("missing development configuration is an explicit fallback", (t) => {
  const result = runPreflight(t);
  assert.equal(result.status, 0);
  assert.match(result.output, /Mode: development/);
  assert.match(result.output, /Access gate: development fallback/);
});

test("missing production configuration fails the preflight", (t) => {
  const result = runPreflight(t, { NODE_ENV: "production" });
  assert.equal(result.status, 1);
  assert.match(result.output, /Access gate: production misconfigured \/ fail closed/);
});

for (const key of ["NSML_APP_PASSWORD", "NSML_SESSION_SECRET"]) {
  test(`missing ${key} cannot be bypassed by disabling optional services`, (t) => {
    const result = runPreflight(t, {
      ...access,
      [key]: " ",
      NSML_SUPABASE_DISABLED: "true",
      NSML_AI_DISABLED: "true",
    });
    assert.equal(result.status, 1);
    assert.match(result.output, /Access gate: production misconfigured \/ fail closed/);
  });
}

test("optional services may be intentionally disabled without claiming they are ready", (t) => {
  const result = runPreflight(t, {
    ...access,
    NSML_SUPABASE_DISABLED: "true",
    NSML_AI_DISABLED: "true",
  });
  assert.equal(result.status, 0);
  assert.match(result.output, /Supabase core: intentionally disabled/);
  assert.match(result.output, /Private evidence storage: intentionally disabled/);
  assert.match(result.output, /AI readiness: intentionally disabled/);
});

for (const key of ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "NSML_EVIDENCE_BUCKET", "OPENAI_API_KEY", "NSML_AI_MODEL"]) {
  test(`missing ${key} fails production preflight when the service is enabled`, (t) => {
    const result = runPreflight(t, { ...configured, [key]: "" });
    assert.equal(result.status, 1);
  });
}

test("an unexpected evidence bucket name fails production preflight", (t) => {
  const result = runPreflight(t, { ...configured, NSML_EVIDENCE_BUCKET: "unexpected-bucket" });
  assert.equal(result.status, 1);
  assert.match(result.output, /Private evidence storage: production misconfigured/);
});

test("an unsupported enabled AI provider fails production preflight", (t) => {
  const result = runPreflight(t, { ...configured, NSML_AI_PROVIDER: "unsupported" });
  assert.equal(result.status, 1);
  assert.match(result.output, /AI readiness: production misconfigured/);
});

test("configured environment passes without exposing synthetic secret values", (t) => {
  const result = runPreflight(t, configured);
  assert.equal(result.status, 0);
  for (const key of ["NSML_APP_PASSWORD", "NSML_SESSION_SECRET", "SUPABASE_SERVICE_ROLE_KEY", "OPENAI_API_KEY"]) {
    assert.equal(result.output.includes(configured[key]), false, `${key} value was printed`);
  }
});

test("configuration success is not represented as verified live security", (t) => {
  const result = runPreflight(t, configured);
  assert.equal(result.status, 0);
  assert.match(result.output, /Scope: environment configuration only/);
  assert.match(result.output, /does not verify credentials, bucket existence or privacy, RLS policies, or a live deployment/);
  assert.doesNotMatch(result.output, /Private bucket nsml-evidence-files is configured/);
});

test("disable flags override populated optional-service credentials", (t) => {
  const result = runPreflight(t, {
    ...configured,
    NSML_SUPABASE_DISABLED: " YES ",
    NSML_AI_DISABLED: " ON ",
  });
  assert.equal(result.status, 0);
  assert.match(result.output, /Supabase core: intentionally disabled/);
  assert.match(result.output, /AI readiness: intentionally disabled/);
});

test("provider=disabled explicitly disables AI", (t) => {
  const result = runPreflight(t, { ...configured, NSML_AI_PROVIDER: " disabled ", OPENAI_API_KEY: "" });
  assert.equal(result.status, 0);
  assert.match(result.output, /AI readiness: intentionally disabled/);
});

test("process environment takes precedence over env files", (t) => {
  const result = runPreflight(t, configured, {
    ".env.local": "NSML_AI_PROVIDER=unsupported\nNSML_EVIDENCE_BUCKET=unexpected-bucket\n",
  });
  assert.equal(result.status, 0);
});

test("env.local takes precedence over env using synthetic isolated fixtures", (t) => {
  const result = runPreflight(t, access, {
    ".env.local": "export NSML_SUPABASE_DISABLED='true'\nNSML_AI_DISABLED=\"true\"\n",
    ".env": "NSML_SUPABASE_DISABLED=false\nNSML_AI_DISABLED=false\n",
  });
  assert.equal(result.status, 0);
  assert.match(result.output, /Supabase core: intentionally disabled/);
  assert.match(result.output, /AI readiness: intentionally disabled/);
});
