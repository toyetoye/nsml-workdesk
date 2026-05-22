# Roadmap

## Sprint 000

Complete.

Delivered:

- NSML WorkDesk shell
- Dashboard landing page
- three separate vessel workspaces
- Projects workspace
- Other workspace
- Import staging area
- Cases placeholder
- Drafts placeholder
- Writing Style placeholder
- CoS Assistant placeholder
- mock Imported Email Workbench
- workspace-level vessel/project/other correspondence surfaces
- linked correspondence placeholder in Cases
- mock data only

Notes:

- `/import` is staging/unclassified only, not permanent email storage.
- No AI, Outlook integration, email sending, database runtime dependency, EML parsing, or persistence.

## Sprint 001

Complete.

Delivered:

- dashboard command centre
- top status cards
- urgent attention queue
- pending my reply queue
- waiting on others queue
- decision required queue
- drafts ready / failed red-team placeholder
- needs evidence queue
- recent import activity
- vessel snapshot
- workspace/status filters
- drill-down links to existing pages
- mock queue data only
- client-side filtering only

Notes:

- No AI, API routes, database, persistence, Outlook integration, email sending, upload logic, or EML parsing.
- The dashboard explains why each item matters and suggests a next action.

## Sprint 002

Complete.

Delivered:

- manual intake workbench on `/import`
- paste/snippet/manual note intake form
- source type field
- workspace assignment field
- status assignment field
- sender/source field
- received or created date-time field
- body/content field
- tags/topic field
- file upload placeholder only
- recent intake/import batch list
- selected intake detail view
- simulated route-to-workspace action
- disabled Create case from this placeholder action
- imported correspondence viewer remains separate
- session-only React state

Notes:

- No localStorage, persistence, API routes, database/Supabase, AI/OpenAI, Outlook integration, email sending, real file storage, or EML/PDF/OCR parsing.
- Import is the capture/staging desk. It can accept pasted emails, notes, and future files, but real routing, persistence, parsing, and case creation belong to later sprints.

## Sprint 003

Complete.

Delivered:

- `/cases` case management workbench
- mock case list
- selected case detail pane
- session-only Create Case drawer/form
- case status, priority, category, owner/waiting party, age/due indicators
- Decision Required / Next Action section
- linked evidence cards
- linked correspondence tied to selected case
- timeline/activity rail
- Attach evidence placeholder only
- Create from intake item placeholder only
- seeded mock `caseRecords` and `evidenceRecords`
- session-only React state

Notes:

- No persistence, localStorage, API routes, database/Supabase, AI/OpenAI, import-to-case connection yet, real file storage, EML/PDF/OCR parsing, Outlook integration, or email sending.
- A case is the operational working unit. Emails, documents, screenshots, notes, EMLs, quotes, and reports are evidence attached to a case. `/import` captures material; `/cases` manages the work.

## Sprint 004

Complete.

Delivered:

- Supabase persistence foundation
- database migration for workspaces, import batches, intake items, cases, evidence, correspondence, links, timeline events, decisions, draft placeholder, and audit logs
- seeded confirmed workspaces
- RLS enabled on tables
- typed persistence models
- safe persistence config
- no-op/fallback persistence client
- repository helpers
- neutralized old direct Supabase access paths
- `src/lib/supabase.ts` converted to a compatibility shim
- `src/lib/memory.ts` no longer directly queries Supabase
- app remains usable without Supabase configured

Notes:

- Current UI remains mock/session-based.
- No AI, no file parsing, no real file storage, no Outlook integration, no email sending, and no auth were added.

## Sprint 005

Complete.

Delivered:

- single-user access gate
- protected main app shell
- .env.example placeholders for access gate
- manual intake save through server actions and repository utilities
- case save through server actions and repository utilities
- safe missing-env fallback for development
- mock/session behavior preserved when persistence is unavailable

Notes:

- No AI, no file parsing, no real file storage, no Outlook integration, no email sending, no multi-user accounts, no roles, and no Supabase Auth were added.
- Client components do not write directly to Supabase.

## Sprint 006

Complete.

Delivered:

- private Supabase Storage bucket foundation for evidence files
- private bucket name `nsml-evidence-files`
- server-side evidence upload action
- server-side storage helper
- evidence metadata persistence through the repository layer
- `/import` private evidence upload and staging area
- `/cases` attach-evidence panel
- evidence metadata fields for filename, stored path/key, MIME type, file size, source type, workspace assignment, linked intake/case placeholders, evidence status, description/note, and storage state
- fallback/prototype behavior when Supabase/storage is not configured

Notes:

- No public file URLs, no client-side Supabase Storage writes, no file preview, no file parsing, no AI, no Outlook integration, and no email sending.
- Files are evidence. In Sprint 006, files may be uploaded or staged as private evidence records, but the system must not claim to understand, parse, summarise, or validate file contents until a later parsing/AI sprint.
- Virus/malware scanning remains a future risk to address before broader or less-controlled file ingestion.

## Sprint 007

Complete.

Delivered:

- server-side EML ingestion foundation
- mailparser-based parsing
- original EML preserved as private evidence
- parse status fields on evidence records
- `parsed_thread_id` and `parsed_message_id` linkage
- `source_evidence_id` linkage from parsed correspondence
- deterministic workspace routing without AI
- case workspace wins if evidence is linked to a case
- assigned workspace used when no case link exists
- unclassified/import staging used when workspace is unclear
- subject/from/to/cc/bcc/date/message-id/in-reply-to/references extraction
- safe body text extraction
- raw HTML not rendered
- remote email assets not fetched
- attachment metadata only
- visible parse states: not parsed, parsing, parsed, failed, unsupported
- parse errors visible and non-destructive
- parsing disabled/fallback when Supabase/storage is unavailable

Notes:

- No AI, no drafting, no red-team agent, no Outlook integration, no email sending, no unsafe HTML rendering, and no PDF/OCR parsing.
- EML ingestion converts uploaded email files into structured correspondence metadata while preserving the original EML as evidence. It does not interpret, classify by AI, draft responses, or validate the truth of the email content.
- Email HTML must never be rendered raw. Remote email resources must not be fetched automatically.

## Sprint 008

Complete.

Delivered:

- deterministic correspondence threading
- message-id, in-reply-to, and references matching
- conservative normalized-subject fallback
- uncertain matches surfaced as possible related threads rather than hard-merged
- operational thread console in `EmailWorkbench`
- chronological message timeline
- attachment metadata display
- parse state and parse error visibility
- source evidence linkage visibility
- linked/unlinked case state
- placeholder Link to case action
- placeholder Create case from thread action
- workspace-scoped correspondence views
- `/import` staging/unclassified correspondence view
- workspace/status/sender/attachment/parse/case-link filters
- ZIP/PST/archive import placeholder UX only

Notes:

- No archive extraction, no AI, no drafting, no red-team agent, no Outlook integration, no email sending, no unsafe HTML rendering, and no remote asset loading.
- Threading must be deterministic and conservative. A false merge is worse than leaving related emails separate. When uncertain, preserve separate threads and surface possible relationship only.

## Sprint 009A

Complete.

Delivered:

- server-side AI intake/triage foundation
- AI config helper
- selected-context-only triage builders
- server-side triage service
- protected AI server actions
- structured triage schema
- triage from selected intake item
- triage from selected correspondence thread
- triage from selected case
- advisory-only `TriageResultPanel`
- CoS Assistant triage-aware status only, not a general chatbot
- traceability to source type and source IDs
- `evidence_used` shown in result
- persistence/audit-style storage when available
- session-only triage display when persistence is unavailable
- disabled AI controls when env vars are missing
- no fake AI output
- no automatic record mutation

Notes:

- No drafting, no red-team agent, no Outlook integration, no email sending, no automatic routing/classification, no PDF/OCR AI extraction, and no background processing.
- AI can recommend but cannot act. AI triage output is advisory only and must remain traceable to selected source material.
- AI calls must be server-side, selected-context-only, and must not send unrelated vessels/projects or the whole evidence library.

## Sprint 009B

Complete.

Delivered:

- server-side AI draft generation foundation
- selected-context-only draft builders
- protected draft generation actions
- draft generation from selected intake item
- draft generation from selected correspondence thread
- draft generation from selected case
- structured draft response schema
- `DraftResultPanel`
- `DraftsWorkbench`
- `/drafts` upgraded from placeholder to draft workbench
- draft statuses limited to `pending_red_team`, `needs_evidence`, and `blocked`
- `must_be_red_teamed` always true
- source/evidence traceability
- evidence basis, assumptions, missing information, liability cautions, recommended attachments, and confidence
- copy disabled until red-team review exists
- no ready state
- no send button
- no mark-ready action

Notes:

- No red-team review, no Outlook integration, no email sending, and no automatic case/status/routing changes.
- Generated drafts are not safe to send until they pass red-team review. Draft generation may prepare wording, but it cannot approve, send, or mark a response ready.

## Sprint 009C

Complete.

Delivered:

- server-side AI red-team review foundation
- selected-draft red-team builders
- protected red-team server action
- `draft_red_team_reviews` persistence foundation
- red-team review from `DraftResultPanel`
- red-team review from `/drafts`
- structured red-team review schema
- source -> draft -> red-team traceability
- source IDs reviewed shown in UI
- verdicts: `pass`, `pass_with_caution`, `revise`, `reject`, `needs_more_evidence`
- readiness statuses: `ready_to_copy`, `not_ready`
- `safe_to_copy` enforcement
- copy disabled unless `safe_to_copy` is true
- `Copy reviewed draft` button only after `pass` or `pass_with_caution`
- no send button
- no Outlook integration
- no automatic reply sending
- no automatic case/status/routing changes
- no automatic draft replacement
- no background or bulk review

Notes:

- No draft may be copied or treated as usable until it passes red-team review or passes with caution.
- Red-team review checks unsupported claims, liability exposure, technical risk, tone risk, evidence gaps, missing information, confidentiality concerns, and required user checks before copy is enabled.

## Sprint 010

Complete.

Delivered:

- Writing Style Profile page
- protected writing-style save action
- persisted writing style profile schema
- safe default writing profile
- session/mock fallback when persistence is unavailable
- default greeting
- default closing
- preferred tone
- preferred brevity
- use of kindly
- use of please note
- technical directness
- caution level
- stakeholder tone notes
- preferred phrases
- phrases to avoid
- liability-sensitive wording rules
- draft mode guidance
- stakeholder profiles for vessel/captain/chief engineer, owner/charterer, class/surveyor, vendor/procurement, and management
- draft generation now consumes the active writing style profile
- style profile carried in draft trace payload
- no localStorage
- no hard Supabase dependency
- no email sending
- no Outlook integration
- no mailbox connection
- no red-team bypass
- no ready-state override

Notes:

- Writing style can shape tone, greeting, closing, brevity, stakeholder framing, and phrase choice, but it cannot override evidence, safety, missing information, liability controls, or red-team review.
- The writing-style profile remains a calibration layer, not a permission to relax safety or claim unsupported facts.

## Sprint 011

Complete.

Delivered:

- end-to-end workflow hardening
- `WorkflowChecklist` component
- next-best-action guidance across dashboard, import, workspace, cases, drafts, and writing-style surfaces
- improved cross-links between `/import`, workspace correspondence, `/cases`, `/drafts`, and `/settings/writing-style`
- improved operational state labels
- clearer AI-unavailable and persistence-unavailable states
- dashboard reflects the real workflow path
- manual QA / smoke-test checklist added to deployment notes
- copy remains disabled unless red-team verdict is `pass` or `pass_with_caution` and `safe_to_copy` is true
- no send button

Notes:

- Sprint 011 does not add new AI capability, new parsing capability, Outlook integration, email sending, automatic case creation/routing/status mutation, bulk/background processing, or multi-user roles.
- Every workflow surface must make the next safe action clear while preserving the rule that external communication remains manual and user-controlled.

## Sprint 012

In progress.

Focus:

- production readiness only;
- environment validation only;
- deployment/security documentation only;
- honest ready / disabled / fallback / misconfigured classification;
- no new workflow surface.

Delivered / in progress:

- server-side production readiness helper
- explicit production setup checklist
- Supabase migration checklist
- private evidence bucket checklist
- access-gate production checklist
- AI/OpenAI environment checklist
- backup/export plan notes
- updated deployment and security documentation
- Next.js middleware/proxy warning logged as deployment backlog unless a low-risk fix is later approved

Notes:

- Sprint 012 must fail closed in production when access-gate env vars are missing.
- Sprint 012 must not expose secrets, service role keys, or public file URLs.
- Sprint 012 does not add new AI capability, parsing capability, Outlook integration, email sending, live mailbox connection, automatic case creation, automatic routing, automatic status mutation, or multi-user roles.

## Sprint 013

Complete.

Delivered:

- removed legacy Staff-OS routes
- neutralized old route wording
- confirmed the production route surface is NSML-only

Notes:

- No new product features were added.
- No new AI capability, parsing capability, Outlook integration, email sending, or auth changes were added.

## Sprint 014

In progress.

Focus:

- deployment execution support only
- Vercel + Supabase default deployment path
- deployment checklist and smoke-test guidance
- environment variable clarity
- no product feature changes

Notes:

- Keep secrets in deployment environment variables only.
- Keep deployment support honest: ready, intentionally disabled, development fallback, or production misconfigured / fail closed.
- No new AI capability, parsing capability, Outlook integration, email sending, live mailbox connection, automatic routing, automatic case/status mutation, or multi-user roles.
