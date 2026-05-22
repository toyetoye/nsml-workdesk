# Deployment

Deployment target: online private deployment.

Possible options:

- Vercel + Supabase
- Railway + Supabase
- Render + Supabase
- Private VPS

Deployment is not part of Sprint 000.

Production requirements:

- environment variables server-side only;
- authentication enabled;
- private uploads;
- audit logs;
- backup/export process.

## Sprint 004 Notes

Sprint 004 establishes the persistence foundation but does not require deployment changes.

Sprint 005 adds the access gate and safe repository wiring, but still does not require deployment execution.

The app must continue to run when Supabase is not configured, using mock/session-compatible fallback behavior.

No public file URLs, no client-side Supabase keys, and no direct client writes should be introduced in this sprint.

Production deployments must fail closed if the access-gate env vars are missing.

Production auth and private upload handling remain later-sprint concerns.

## Sprint 006 Notes

Sprint 006 adds private evidence storage foundation but still does not require deployment execution.

Evidence uploads must use the private Supabase Storage bucket `nsml-evidence-files` and remain server-side only.

Deployment should keep evidence files private, use metadata-only records when storage is unavailable, and avoid public file URLs.

No file preview or parsing should be enabled at deployment time for this sprint.

Virus/malware scanning should be treated as a required future deployment control before broader or less-controlled file ingestion.

## Sprint 007 Notes

Sprint 007 adds server-side EML ingestion foundation but still does not require deployment execution.

Parsed email ingestion must remain server-side only and preserve the original EML as private evidence.

Deployment should keep parsed correspondence traceable back to source evidence, avoid public file URLs, and never render raw email HTML.

Remote email assets must not be fetched automatically.

When Supabase/storage is unavailable, parsing should be disabled or fall back clearly without crashing the app.

Production deployments should continue to keep the access gate, private evidence storage, and repository-backed persistence boundaries intact.

## Sprint 008 Notes

Sprint 008 improves correspondence threading and workspace correspondence UX but still does not require deployment execution.

Threading should deploy as conservative and deterministic: exact header matching first, normalized-subject fallback only when safe, and possible-related surfacing instead of hard merges when uncertain.

Deployment should keep the thread console, parse state, attachment metadata, source evidence linkage, and workspace-scoped correspondence views visible without exposing raw HTML or remote assets.

Archive planning UX should remain placeholder-only until archive extraction is explicitly approved.

Production deployments should continue to enforce the access gate and preserve server-side repository boundaries for correspondence data.

## Sprint 009A Notes

Sprint 009A adds server-side AI triage foundation but still does not require deployment execution.

AI configuration must remain server-side only and must fail safely when the required env vars are missing.

Deployment should keep triage controls disabled or clearly marked as unavailable when AI is not configured, and it must not fabricate AI output.

AI requests must remain selected-context-only and protected by the existing access gate.

Production deployments should continue to keep AI advisory-only, preserve traceability back to source material, and avoid automatic record mutation.

## Sprint 009B Notes

Sprint 009B adds server-side draft generation but still does not require deployment execution.

AI configuration for drafts must remain server-side only and must fail safely when the required env vars are missing.

Deployment should keep draft controls disabled or clearly marked as unavailable when AI is not configured, and it must not fabricate draft output.

Draft requests must remain selected-context-only and protected by the existing access gate.

Production deployments should continue to keep drafts advisory-only, preserve traceability back to source material, and avoid automatic record mutation, ready-state marking, or sending.

## Sprint 009C Notes

Sprint 009C adds server-side red-team review but still does not require deployment execution.

Red-team configuration must remain server-side only and must fail safely when the required env vars are missing.

Deployment should keep red-team controls disabled or clearly marked as unavailable when AI is not configured, and it must not fabricate review output.

Red-team requests must remain selected-draft only and protected by the existing access gate.

Production deployments should continue to keep red-team review advisory-only, preserve traceability back to source material, and avoid automatic record mutation, send-state changes, or copy enabling without a passing review.

## Sprint 010 Notes

Sprint 010 adds the writing-style profile layer but still does not require deployment execution.

Writing-style persistence must remain server-side only and must fall back safely when persistence is unavailable.

Deployment should keep the writing-style editor usable with a safe default profile and session/mock fallback, and it must not depend on localStorage or a hard Supabase connection to keep the app usable.

Writing-style requests must remain protected by the access gate and must only calibrate draft tone, greeting, closing, brevity, stakeholder framing, and phrase choice.

Production deployments should continue to keep style calibration advisory-only, preserve traceability to the active style profile in draft trace payloads, and avoid any interpretation that style can override evidence, safety, missing information, liability controls, or red-team review.

## Sprint 011 Notes

Sprint 011 hardens the existing workflow and does not add new capability.

Manual smoke-test checklist:

1. Log in through the single-user gate.
2. Open `/import`, create or stage an intake item, and confirm the next-step prompts appear.
3. Stage an evidence record, parse eligible EML metadata, and confirm the parsed state is visible.
4. Open a workspace correspondence page and confirm the thread view shows parse, case-link, and source evidence state clearly.
5. Open `/cases`, confirm the case detail shows the next best action, and verify evidence and correspondence cross-links.
6. Open `/drafts`, generate a draft, run red-team review, and confirm `Copy reviewed draft` remains disabled until `safe_to_copy` is true.
7. Open `/settings/writing-style` and confirm the active style profile is visible in the draft workflow context.

Deployment should keep AI-unavailable and persistence-unavailable states obvious but non-blocking, and it should not imply durable state where only session fallback exists.

No send button should appear anywhere in the deployed app, and copy should remain gated by the red-team verdict and `safe_to_copy`.
