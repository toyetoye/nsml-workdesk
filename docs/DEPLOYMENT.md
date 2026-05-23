# Deployment

Deployment target: **Vercel + Supabase** for the first deployment path unless a clear blocker is identified.

Supported deployment targets:

- Vercel + Supabase
- Railway + Supabase
- Render + Supabase
- Private VPS

Production requirements:

- environment variables server-side only;
- authentication enabled;
- private uploads;
- audit logs;
- backup/export process;
- no public file URLs;
- no client-side Supabase writes;
- no exposed service role keys.

Required production environment variables:

- `NSML_APP_PASSWORD`
- `NSML_SESSION_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `NSML_AI_PROVIDER`
- `NSML_AI_MODEL`
- optional `NSML_SUPABASE_DISABLED`
- optional `NSML_AI_DISABLED`

Storage setting:

- `NSML_EVIDENCE_BUCKET=nsml-evidence-files` when evidence storage is enabled.

Helpful preflight:

```bash
npm run deploy:check
```

The preflight reports readiness states only. It does not print secrets.

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

Sprint 011 is complete. It hardens the existing workflow and does not add new capability.

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

The deployment checklist should be treated as smoke-test guidance for the real workflow path, not as a new feature surface.

## Sprint 012 Production Readiness Notes

Sprint 012 focuses on safe online deployment readiness rather than new workflow capability.

Production readiness checklist:

1. Confirm `NSML_APP_PASSWORD` and `NSML_SESSION_SECRET` are set.
2. Confirm `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set, or explicitly document Supabase as intentionally disabled.
3. Confirm `NSML_EVIDENCE_BUCKET` points to the private `nsml-evidence-files` bucket and that the bucket is private.
4. Confirm Supabase migrations have been applied.
5. Confirm `NSML_AI_PROVIDER`, `NSML_AI_MODEL`, and `OPENAI_API_KEY` are set, or explicitly document AI as intentionally disabled.
6. Confirm protected routes remain gated and production fail-closed behavior is preserved.
7. Confirm no public file URLs, no client-side Supabase writes, and no exposed service role keys.
8. Confirm no send button exists and that the red-team copy gate remains active.
9. Confirm fallback states are obvious and honest when persistence or AI is intentionally disabled.

Optional explicit disable flags:

- `NSML_SUPABASE_DISABLED`
- `NSML_AI_DISABLED`

Deployment target notes:

- Vercel + Supabase remains a viable target.
- Railway + Supabase remains a viable target.
- Render + Supabase remains a viable target.
- Private VPS remains a viable target if server-side environment handling is kept intact.

Backup/export notes:

- Preserve a repeatable backup/export process for database, storage metadata, and audit logs.
- Keep private evidence files exportable only through controlled server-side processes.

Middleware / proxy note:

- The existing Next.js warning about the `middleware` file convention is logged as deployment/backlog work.
- Do not migrate to `proxy` during this sprint unless a later low-risk change is explicitly approved.

Deployment validation helper:

- A server-side deployment-readiness helper may be used to classify the app as ready, intentionally disabled, development fallback, or production misconfigured / fail closed.
- Readiness classification should stay honest and should not imply deployment readiness when fallback mode is actually in use.

## Sprint 014 Deployment Execution Support

Sprint 014 supports first deployment execution only.

Default deployment path:

- Vercel for the Next.js app
- Supabase for database and storage

Deployment order:

1. Create the Supabase project.
2. Apply migrations in order.
3. Confirm seeded workspaces are present.
4. Confirm `NSML_EVIDENCE_BUCKET` is set to the private evidence bucket `nsml-evidence-files`.
5. Confirm the bucket is private.
6. Configure the Vercel project.
7. Set production environment variables.
8. Deploy the app.
9. Test public `/login`.
10. Test protected route redirect.
11. Test login success.
12. Test `/dashboard`.
13. Test `/import`.
14. Test `/cases`.
15. Test `/drafts`.
16. Test evidence upload or fallback state.
17. Test AI configured or intentionally disabled state.
18. Test draft -> red-team -> copy gate.
19. Confirm no send button exists.
20. Confirm the route surface remains NSML-only.

Post-deployment smoke tests:

- `/login` loads publicly.
- Protected routes redirect when unauthenticated.
- Login succeeds with the single-user gate.
- Dashboard, import, cases, and drafts load after login.
- Evidence upload is private or the fallback state is obvious and honest when intentionally disabled.
- AI is configured or clearly disabled.
- Draft copy remains disabled until red-team returns `pass` or `pass_with_caution` and `safe_to_copy` is true.
- No send button exists anywhere.
- No public file URLs are exposed.

Deployment execution reminders:

- Keep secrets only in deployment environment variables.
- Do not commit secrets.
- Do not expose the service role key client-side.
- Keep the middleware warning on the backlog unless a later low-risk fix is approved.

## Sprint 015 Assurance Deployment Notes

Sprint 015 adds the assurance and governance signal tracker but does not require new deployment capability beyond the existing protected app surface and persistence foundation.

Deployment notes for assurance:

- `/assurance` is a protected route and should remain behind the existing access gate.
- The Assurance navigation entry should remain visible only in the protected app surface.
- The new assurance tables must be included in the migration order alongside the rest of the Supabase schema.
- The weekly evidence pack is deterministic and does not require AI configuration.
- Evidence-level guardrails should remain active in production so Fact cannot be stored without evidence support.
- Sensitive or unverified governance signals must remain neutral and must not be treated as verified facts.
- No email sending, Outlook integration, automatic escalation, political scoring, sentiment scoring, or disciplinary conclusions should be exposed at deployment time.
- The route surface should stay NSML-only and protected routes must continue to fail closed if access-gate env vars are missing.
