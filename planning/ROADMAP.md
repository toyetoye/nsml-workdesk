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
