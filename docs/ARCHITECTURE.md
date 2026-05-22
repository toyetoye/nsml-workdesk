# Architecture

## Recommended Stack

- Next.js frontend/app framework
- Supabase Postgres for database foundation and later sprint persistence
- Supabase Storage or S3-compatible storage, later sprint
- OpenAI API for structured AI workflows, later sprint
- Single-user access gate, then deployment sprint

## Current Sprint 000 Architecture

Sprint 000 is UI shell only.

No database is required yet.
No AI is required yet.
No external email integration is required.
No file parsing is required.

## Sprint 003 Case Prototype Architecture

Sprint 003 adds a client-side case management prototype on `/cases`.

The case surface is structured around:

- a compact mock case list;
- a selected case detail pane;
- a session-only Create Case drawer or form;
- linked evidence cards;
- linked correspondence tied to the selected case;
- a timeline or activity rail;
- placeholder attach evidence and create-from-intake controls.

All case state is kept in React memory for the current session only.

No persistence, no localStorage, no API routes, no database/Supabase, no AI/OpenAI, no import-to-case connection yet, no real file storage, no EML/PDF/OCR parsing, no Outlook integration, and no email sending are required for this sprint.

## Current Sprint 003 Notes

- Cases are the operational working unit.
- Emails, documents, screenshots, notes, EMLs, quotes, and reports are evidence attached to a case.
- `/import` captures material.
- `/cases` manages the work.

## Sprint 004 Persistence Foundation Architecture

Sprint 004 adds a safe persistence foundation for imports, cases, evidence metadata, correspondence metadata, and timeline records.

The persistence layer is structured around:

- typed database models for the core tables;
- server-side repository helpers for save and retrieve operations;
- a safe persistence config reader;
- a no-op/fallback persistence client when Supabase env vars are missing;
- neutralized old direct Supabase access paths.

The current UI remains mock/session-based when persistence is not configured.

Client components must not write directly to Supabase.

If Supabase environment variables are missing, the app must continue to run with fallback behavior rather than crash.

No real file storage, EML/PDF/OCR parsing, Outlook integration, or AI is required in this sprint.

## Sprint 005 Access Gate and Safe Write Wiring

Sprint 005 adds a single-user access gate and wires intake/case writes through server actions to the repository layer.

The access-gate architecture is structured around:

- a simple app-password login flow;
- a signed HTTP-only session cookie;
- middleware protection for the app shell and protected routes;
- clear development fallback behavior when access-gate env vars are missing;
- fail-closed production behavior when access-gate env vars are missing.

The persistence write path is structured around:

- client components collecting user input;
- server actions validating and saving the payload;
- repository helpers as the database boundary;
- mock/session fallback when Supabase is not configured.

Client components must not write directly to Supabase.

The app must continue to run locally without requiring Supabase, and the login/access gate must not expose the app publicly in production when env vars are missing.

## Routes

- /
- /dashboard
- /vessels/lng-portharcourt-ii
- /vessels/lpg-alfred-temile
- /vessels/lpg-alfred-temile-10
- /projects
- /other
- /import
- /cases
- /drafts
- /settings/writing-style

## Core Components

- AppShell
- Sidebar
- TopBar
- DashboardCard
- AttentionQueue
- VesselWorkspace
- ProjectWorkspace
- ImportPanel
- CaseList
- CaseManagementWorkbench
- CaseDetailPanel
- EvidenceList
- TimelinePanel
- DraftReviewPanel
- StatusBadge
- EvidenceList

## Persistence Notes

- `src/lib/supabase.ts` is a compatibility shim rather than a direct client-side access path.
- `src/lib/memory.ts` no longer queries Supabase directly.
- Repository helpers should be the only approved path for future Supabase read/write operations.
- Intake and case write actions should pass through server-side helpers before touching the repository.

## Sprint 006 Private Evidence Storage Architecture

Sprint 006 adds a private evidence storage foundation for uploaded files and metadata-only evidence records.

The storage architecture is structured around:

- a private Supabase Storage bucket named `nsml-evidence-files`;
- a server-side evidence upload action;
- a server-side storage helper that handles upload or fallback behavior;
- repository-backed evidence metadata persistence;
- private evidence staging and upload surfaces in `/import`;
- case-scoped attach-evidence surfaces in `/cases`.

Evidence uploads must remain server-side only.

Client components must not write directly to Supabase Storage.

The app must continue to run when Supabase storage is not configured, using explicit staged or fallback-prototype behavior rather than pretending durable storage exists.

No public file URLs, no file previews, and no file parsing are required in this sprint.

## Sprint 006 Notes

Files are evidence. Sprint 006 stores files privately and records metadata only; it does not claim to understand, parse, summarise, or validate file contents yet.

Virus/malware scanning is a future control that must be addressed before broader or less-controlled ingestion.

## Sprint 007 EML Ingestion Architecture

Sprint 007 adds a server-side EML ingestion foundation for private evidence files.

The ingestion architecture is structured around:

- a server-side parser based on `mailparser`;
- private EML evidence as the preserved source artifact;
- deterministic correspondence creation from parsed metadata;
- evidence parse state and error tracking;
- correspondence thread and message records linked back to source evidence;
- workspace routing without AI;
- fallback or disabled parsing when Supabase/storage is unavailable.

Parsed metadata should capture:

- subject;
- from;
- to;
- cc;
- bcc when present;
- sent / received date;
- message-id;
- in-reply-to;
- references;
- safe body text only;
- attachment metadata only.

HTML email bodies must never be rendered raw. HTML should be reduced to safe text only, and remote email resources must not be fetched automatically.

Routing is deterministic:

- if evidence is linked to a case, that case workspace wins;
- otherwise, the assigned workspace is used;
- otherwise, the thread remains in Import/Staging or unclassified.

The UI should expose parse states:

- not parsed;
- parsing;
- parsed;
- failed;
- unsupported.

Parse failures must be visible and non-destructive. The original EML remains preserved as evidence regardless of parse outcome.

## Sprint 008 Correspondence Threading and UX Architecture

Sprint 008 builds an operational thread console on top of the parsed correspondence spine.

The threading architecture is structured around:

- exact `message-id`, `in-reply-to`, and `references` matching first;
- `references` as the strongest thread-chain signal;
- conservative normalized-subject fallback only when sender and date proximity also look safe;
- uncertain matches remaining separate and being surfaced only as possible related threads;
- thread-level presentation in `EmailWorkbench` with chronological messages rather than a flat list;
- attachment metadata display and source evidence linkage display;
- parse state and parse error display alongside the thread;
- linked/unlinked case indicators and placeholder case-linking actions;
- workspace-scoped correspondence views for import staging, vessels, projects, and general correspondence;
- `/import` staging/unclassified correspondence as the intake area;
- archive planning UX for ZIP/PST/bulk import without extraction.

Threading must remain deterministic and conservative. False merges are worse than leaving related emails separate.

Parsed correspondence must continue to respect the Sprint 007 security posture:

- no raw HTML rendering;
- no remote asset loading;
- no public file URLs;
- no client-side Supabase writes;
- no AI-driven classification.

## Sprint 009A AI Triage Architecture

Sprint 009A adds a server-side AI triage layer for selected intake items, correspondence threads, and cases.

The AI architecture is structured around:

- an AI config helper that reports whether structured triage is enabled;
- selected-context-only triage builders for intake items, threads, and cases;
- a server-side triage service that calls the model and validates structured JSON output;
- protected AI server actions for intake, thread, and case triage;
- an advisory-only triage result component;
- audit-style persistence when available and session-only display when persistence is not available;
- traceability through source type, source IDs, and evidence-used references.

AI requests must be server-side only and must only send the selected item plus directly linked evidence or correspondence. Unrelated vessels, projects, and the full evidence library must never be sent.

AI output must remain advisory. It must not change workspace, case, status, or routing automatically.

The CoS Assistant remains a structured triage aide only; it is not a general chatbot yet.

## Sprint 009B Draft Generation Architecture

Sprint 009B adds a server-side AI draft generation layer for selected intake items, correspondence threads, and cases.

The draft architecture is structured around:

- selected-context-only draft builders for intake items, threads, and cases;
- a server-side draft generation service that calls the model and validates structured JSON output;
- protected AI server actions for draft generation;
- an advisory-only draft result component;
- a draft workbench that lists generated draft records and preserves source traceability;
- persistence when available and session-only display when persistence is not available;
- draft statuses limited to `pending_red_team`, `needs_evidence`, and `blocked`.

Draft requests must be server-side only and must only send the selected item plus directly linked evidence or correspondence. Unrelated vessels, projects, and the full evidence library must never be sent.

Draft output must remain advisory. It must not change workspace, case, status, or routing automatically. There is no ready state in Sprint 009B.

The Drafts workbench remains a protected review surface, not a send queue. Copy remains disabled until red-team review exists.

## Sprint 009C Red-Team Review Architecture

Sprint 009C adds a server-side red-team review layer for generated drafts.

The red-team architecture is structured around:

- selected-draft review builders that use the draft plus its selected source/evidence snapshot;
- a protected server-side red-team action;
- a structured review schema with verdict, readiness status, risks, gaps, and recommended revisions;
- `draft_red_team_reviews` persistence when available and session-only display when persistence is unavailable;
- source -> draft -> red-team traceability;
- UI surfaces that show reviewed source IDs and gate copy behind `safe_to_copy`;
- a `Copy reviewed draft` control that unlocks only after a passing verdict.

Red-team review must remain server-side only and selected-context-only. It must not send unrelated vessels, projects, or the whole evidence library.

Red-team review must not mutate the source draft automatically. It only determines whether the draft may be copied manually by the user.

## Sprint 010 Writing Style Profile Architecture

Sprint 010 adds a writing-style profile layer that calibrates draft voice without weakening safety or red-team controls.

The writing-style architecture is structured around:

- a protected `/settings/writing-style` profile editor;
- a server-side save action for the active writing style profile;
- a persisted style profile schema with a safe default profile;
- session/mock fallback when persistence is unavailable;
- controlled style guidance injected into draft-generation builders;
- style profile trace payload data carried with generated drafts.

The writing-style layer should influence:

- default greeting and closing;
- preferred tone and brevity;
- use of `kindly` and `please note`;
- technical directness and caution level;
- stakeholder-specific tone notes;
- preferred phrases and phrases to avoid;
- liability-sensitive wording rules;
- draft-mode guidance for supported draft modes.

The writing-style layer must remain bounded guidance only. It must not override evidence, missing information, liability controls, or the red-team gate. If style conflicts with safety, the safety rule wins.

## Sprint 011 Workflow Hardening Architecture

Sprint 011 keeps the existing capability stack intact and adds lightweight workflow guidance so the app feels coherent from login through copy-reviewed draft.

The workflow-hardening layer is structured around:

- a reusable `WorkflowChecklist` component for next-best-action guidance;
- dashboard, import, workspace, cases, drafts, and writing-style surfaces that point to the next safe step;
- improved state labels for staged, parsed, unclassified, linked to case, pending triage, triaged, draft pending red-team, reviewed safe to copy, and needs evidence states;
- clear AI-unavailable and persistence-unavailable messaging that stays non-blocking;
- a dashboard path that reflects the real operational flow instead of a disconnected queue board;
- compact smoke-test guidance in deployment notes so the workflow can be verified manually.

Workflow guidance must remain compact and directional. It should help the user see the next safe action without turning any page into a wall of instructions or adding new automation.

## Sprint 012 Production Readiness Architecture

Sprint 012 adds a small server-side deployment-readiness helper and deployment-oriented configuration notes rather than a new product surface.

The production-readiness layer is structured around:

- explicit validation of access-gate, Supabase, storage, and AI environment variables;
- honest classification of readiness as ready, intentionally disabled, development fallback, or production misconfigured / fail closed;
- fail-closed access-gate behavior in production when required env vars are missing;
- deployment notes that keep the private evidence bucket, migrations, AI config, and backup/export plan visible;
- a backlog note for the Next.js `middleware` to `proxy` warning rather than a risky last-minute migration.

Readiness validation must stay server-side and must not obscure fallback mode as a fully ready production state.

## Future Architecture Notes

AI must work through structured outputs.
AI drafts must pass red-team review.
Original evidence must be preserved unchanged.
AI outputs must remain separate from original evidence.
Generated drafts are not safe to send until they pass red-team review. Draft generation may prepare wording, but it cannot approve, send, or mark a response ready.
Red-team review must check unsupported claims, liability exposure, technical risk, tone risk, evidence gaps, missing information, confidentiality concerns, and required user checks before copy is enabled.
Writing style can shape tone, greeting, closing, brevity, stakeholder framing, and phrase choice, but it cannot override evidence, safety, missing information, liability controls, or red-team review.
