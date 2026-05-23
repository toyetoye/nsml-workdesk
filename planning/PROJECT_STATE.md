# Project State

## Current phase

Sprint 015 complete.

## Active sprint

Sprint 016 - next approved sprint.

## Confirmed decisions

- Build as separate app.
- Can fork STAFF-OS and strip.
- Deploy online eventually.
- Single user.
- Manual import first.
- No Outlook connection in v1.
- No automatic email sending.
- Dashboard is the landing page.
- Imported emails enter through `/import` first, then appear under the relevant vessel, project, or other workspace after classification, and can later be linked to a case.
- Sprint 000 is mock-data only and includes the NSML WorkDesk shell, dashboard, workspaces, import staging, workspace correspondence surfaces, CoS Assistant placeholder, and linked correspondence placeholder.
- Sprint 001 upgraded the dashboard into a mock command centre with top status cards, urgent attention queue, pending my reply queue, waiting on others queue, decision required queue, drafts ready / failed red-team placeholder, needs evidence queue, recent import activity, vessel snapshot, workspace/status filters, and drill-down links.
- Sprint 001 remains mock-data only with client-side filtering only and no AI, API routes, database, persistence, Outlook integration, email sending, upload logic, or EML parsing.
- Sprint 002 added a manual intake workbench on `/import` with a paste/snippet/manual note form, source type, workspace assignment, status, sender/source, received or created date-time, body/content, tags/topic, a file upload placeholder, a recent intake/import batch list, a selected intake detail view, a simulated route-to-workspace action, a disabled Create case from this placeholder action, and a separate imported correspondence viewer.
- Sprint 002 uses session-only React state and no localStorage, persistence, API routes, database/Supabase, AI/OpenAI, Outlook integration, email sending, real file storage, or EML/PDF/OCR parsing.
- Sprint 003 added a `/cases` case management workbench with a mock case list, selected case detail pane, session-only Create Case drawer/form, case status, priority, category, owner/waiting party, age and due indicators, a Decision Required / Next Action section, linked evidence cards, linked correspondence tied to the selected case, a timeline/activity rail, and placeholder Attach evidence and Create from intake item actions.
- Sprint 003 is mock-data only and uses session-only React state with seeded `caseRecords` and `evidenceRecords`, no persistence, no localStorage, no API routes, no database/Supabase, no AI/OpenAI, no import-to-case connection yet, no real file storage, no EML/PDF/OCR parsing, no Outlook integration, and no email sending.
- Sprint 004 added the Supabase persistence foundation with database migrations, seeded confirmed workspaces, RLS-enabled tables, typed persistence models, safe persistence config, a no-op/fallback persistence client, repository helpers, and neutralized old direct Supabase access paths.
- Sprint 004 converted `src/lib/supabase.ts` into a compatibility shim and changed `src/lib/memory.ts` so it no longer directly queries Supabase.
- Sprint 004 keeps the app usable without Supabase configured and preserves the current mock/session-based UI behavior.
- Sprint 004 does not add AI, file parsing, real file storage, Outlook integration, email sending, or auth.
- Sprint 005 added a single-user app-password gate with a signed HTTP-only session cookie, protected the main app shell, and wired intake and case writes through server-side actions into the repository layer.
- Sprint 005 keeps local development usable with a clear fallback when access-gate or Supabase environment variables are missing.
- Sprint 005 preserves mock/session fallback for intake and case workflows when persistence is unavailable.
- Sprint 005 does not add AI, file parsing, real file storage, Outlook integration, email sending, multi-user accounts, roles, or Supabase Auth.
- Sprint 006 added a private Supabase Storage bucket foundation for evidence files, a server-side evidence upload action, a server-side storage helper, evidence metadata persistence through the repository layer, an `/import` private evidence upload and staging area, a `/cases` attach-evidence panel, and fallback/prototype behavior when Supabase/storage is not configured.
- Sprint 006 keeps evidence uploads private, metadata-first, and server-side only; no public file URLs or client-side Supabase Storage writes are allowed.
- Sprint 006 does not add file preview, file parsing, AI, Outlook integration, or email sending.
- Sprint 007 added a server-side EML ingestion foundation using `mailparser`, preserving original EML files as private evidence while creating structured correspondence thread and message records.
- Sprint 007 adds parse status fields on evidence records, `parsed_thread_id` and `parsed_message_id` linkage, and `source_evidence_id` linkage on parsed correspondence.
- Sprint 007 uses deterministic workspace routing without AI: case workspace wins when linked, assigned workspace is used when no case link exists, and unclassified/import staging is used when workspace is unclear.
- Sprint 007 extracts subject, from, to, cc, bcc, date, message-id, in-reply-to, references, safe body text, and attachment metadata only.
- Sprint 007 keeps raw HTML unrendered, remote email assets unfetched, and parse errors visible and non-destructive.
- Sprint 007 disables parsing or falls back clearly when Supabase/storage is unavailable.
- Sprint 007 does not add AI, drafting, red-team agent, Outlook integration, email sending, unsafe HTML rendering, or PDF/OCR parsing.
- Sprint 008 improved correspondence threading and workspace correspondence UX with deterministic `message-id` / `in-reply-to` / `references` matching, conservative normalized-subject fallback, possible-related surfacing for uncertain matches, an operational thread console in `EmailWorkbench`, attachment metadata display, parse state and parse error visibility, source evidence linkage visibility, linked/unlinked case state, placeholder link/create-case actions, workspace-scoped correspondence views, `/import` staging/unclassified correspondence, workspace/status/sender/attachment/parse/case-link filters, and a ZIP/PST/archive import placeholder UX.
- Sprint 008 keeps threading deterministic and conservative: a false merge is worse than leaving related emails separate.
- Sprint 008 does not add archive extraction, AI, drafting, red-team agent, Outlook integration, email sending, unsafe HTML rendering, or remote asset loading.
- Sprint 009A added the server-side AI intake/triage foundation with an AI config helper, selected-context-only triage builders, a server-side triage service, protected AI server actions, a structured triage schema, triage from selected intake items/threads/cases, the advisory-only `TriageResultPanel`, and a triage-aware CoS Assistant status panel that is not a general chatbot.
- Sprint 009A keeps AI advisory only: source type and source IDs are always included, `evidence_used` is shown in the result, persisted triage output is stored as an audit-style record when available, and session-only display remains available when persistence is not.
- Sprint 009A disables AI controls when env vars are missing and does not fabricate AI output.
- Sprint 009A does not add drafting, red-team review, Outlook integration, email sending, automatic routing/classification, automatic record mutation, PDF/OCR AI extraction, or background processing.
- Sprint 009B added server-side AI draft generation with selected-context-only draft builders, protected draft generation actions, a structured draft response schema, draft generation from selected intake items/threads/cases, the `DraftResultPanel`, and the `DraftsWorkbench`.
- Sprint 009B keeps drafts advisory only and never ready: draft statuses are limited to `pending_red_team`, `needs_evidence`, and `blocked`; `must_be_red_teamed` is always true; copy remains disabled until red-team review exists; and there is no send button or mark-ready action.
- Sprint 009B preserves source/evidence traceability, stores source IDs and evidence basis with drafts, and shows persisted drafts when available or session-only drafts when persistence is unavailable.
- Sprint 009B does not add red-team review, sending, Outlook integration, automatic routing/status changes, automatic case creation, automatic record mutation, PDF/OCR AI extraction, or background processing.
- Sprint 009C added the server-side AI red-team review foundation with selected-draft red-team builders, a protected red-team server action, `draft_red_team_reviews` persistence, red-team review from `DraftResultPanel` and `/drafts`, a structured red-team review schema, and source -> draft -> red-team traceability.
- Sprint 009C keeps copy disabled unless `safe_to_copy` is true, and only `pass` or `pass_with_caution` may unlock `Copy reviewed draft`; there is still no send button or mark-ready action outside the review gate.
- Sprint 009C preserves source IDs reviewed in the UI and in persisted review metadata when available, while keeping session-only review display available when persistence is unavailable.
- Sprint 009C does not add sending, Outlook integration, automatic reply sending, automatic case/status/routing changes, automatic draft replacement, PDF/OCR extraction, or background/bulk review.
- Sprint 010 added the Writing Style Profile page, a protected writing-style save action, a persisted writing style profile schema, a safe default writing profile, and session/mock fallback when persistence is unavailable.
- Sprint 010 adds configurable style controls for default greeting, default closing, preferred tone and brevity, use of kindly and please note, technical directness, caution level, stakeholder tone notes, preferred phrases, phrases to avoid, liability-sensitive wording rules, and draft mode guidance for the supported stakeholder profiles.
- Sprint 010 makes draft generation consume the active writing style profile, carries the style profile in the draft trace payload, and keeps safety rules above style preferences.
- Sprint 010 does not add localStorage, hard Supabase dependency, email sending, Outlook integration, mailbox connection, red-team bypass, or ready-state override.
- Sprint 011 hardened the end-to-end workflow with the `WorkflowChecklist` component, next-best-action guidance across dashboard, import, workspace, cases, drafts, and writing-style surfaces, improved cross-links between `/import`, workspace correspondence, `/cases`, `/drafts`, and `/settings/writing-style`, improved operational state labels, clearer AI-unavailable and persistence-unavailable states, and a dashboard that reflects the real workflow path.
- Sprint 011 adds a manual QA / smoke-test checklist to the deployment notes so workflow verification stays aligned with the live path.
- Sprint 011 does not add new AI capability, new parsing capability, Outlook integration, email sending, automatic case creation/routing/status mutation, bulk/background processing, or multi-user roles.
- Sprint 012 focuses on production readiness only with environment validation, deployment/security documentation, explicit ready/fallback classification, and a backlog note for the Next.js middleware/proxy warning.
- Sprint 012 keeps protected routes gated, preserves honest fallback states, and does not add new workflow, AI, parsing, Outlook, email, or automation capability.
- Sprint 013 removed the remaining legacy Staff-OS routes, neutralized old route wording, and confirmed the production route surface is NSML-only.
- Sprint 013 does not add new workflow capability; it is route-surface hygiene only.
- Sprint 014 focuses on deployment execution support for the default Vercel + Supabase path and does not add new workflow capability.
- Sprint 015 added the Vessel Support Assurance & Governance Signal Tracker, the `/assurance` protected route, Assurance navigation entry, Assurance Signals / Vessel Support Items / Vessel Engagement Log / Weekly Evidence Pack sections, assurance tables, evidence-level guardrails, neutral wording guidance, request-specifics flow, signal-to-support-item conversion only when sufficiently specific, safe support-item/case/evidence linking, and a deterministic weekly evidence pack with no AI generation.
- Sprint 015 keeps the assurance module evidence-backed and action-tracking only; it does not allow unsupported allegations to be stored as facts, does not create disciplinary conclusions, and does not add email sending, Outlook integration, automatic escalation, political/sentiment scoring, or automatic AI conclusions.

## Product rules

- AI can recommend but cannot act. AI triage output is advisory only and must remain traceable to selected source material.
- Generated drafts are not safe to send until they pass red-team review. Draft generation may prepare wording, but it cannot approve, send, or mark a response ready.
- Writing style can shape tone, greeting, closing, brevity, stakeholder framing, and phrase choice, but it cannot override evidence, safety, missing information, liability controls, or red-team review.
- Every workflow surface must make the next safe action clear while preserving the rule that external communication remains manual and user-controlled.
- Production readiness must classify states honestly: ready, intentionally disabled, development fallback, or production misconfigured / fail closed.

## Next action

Start the next approved sprint.
