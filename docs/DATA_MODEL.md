# Data Model

## Sprint 000

Use mock data only.

## Sprint 002 Intake Prototype

The import surface uses session-only React state for intake items during the current browser session.

Prototype intake objects should include:

- subject/title
- source type
- workspace assignment
- status
- sender/source
- received or created date-time
- body/content
- tags/topic
- route note or simulated workspace assignment note
- linked case placeholder
- created-from label

Prototype intake collections should support:

- recent intake or batch lists
- selected item detail views
- simulated route-to-workspace updates
- disabled case creation placeholders

No localStorage, persistence layer, backend routing, or real storage should be assumed for the Sprint 002 intake prototype.

## Sprint 003 Case Prototype

The cases surface uses session-only React state for seeded and newly created cases during the current browser session.

Prototype case objects should include:

- caseId
- title
- summary
- workspaceKey
- workspaceLabel
- vessel/project/other
- status
- priority
- category
- openedDate
- age
- dueLabel
- owner
- waitingOn
- nextAction
- riskNote
- linkedThreads
- linkedEvidence
- timelineEvents
- decisionRequired
- tags
- sourceIntakeRef
- workspaceHref

Prototype evidence objects should include:

- evidenceId
- title
- type
- source
- date
- linkedCaseId
- description
- status

Prototype case collections should support:

- compact case lists
- selected case detail panes
- session-only Create Case drawers or forms
- linked evidence cards
- linked correspondence tied to the selected case
- timeline or activity rails
- placeholder attach evidence actions
- placeholder create-from-intake references

No persistence, localStorage, backend import connection, real file storage, or real case storage should be assumed for the Sprint 003 case prototype.

## Sprint 004 Persistence Foundation

The persistence layer introduces typed database-backed records and safe repository helpers for the main work objects.

Primary persisted tables and records should include:

- `workspaces`
- `import_batches`
- `intake_items`
- `cases`
- `evidence_items`
- `correspondence_threads`
- `correspondence_messages`
- `case_evidence_links`
- `case_correspondence_links`
- `timeline_events`
- `decisions`
- `draft_responses_placeholder`
- `audit_logs`

Workspace records should capture confirmed workspace slugs and labels.

Import batch records should group intake activity and intake items.

Intake items should preserve pasted or staged source metadata, workspace assignment, status, sender/source, received or created time, body/content, tags, and routing notes.

Case records should preserve operational case metadata, status, priority, category, owner, waiting party, age/due indicators, next action, and decision state.

Evidence records should preserve metadata only for now, including the evidence type, source, date, linked case, description, and status.

Correspondence thread and message records should preserve subject, sender, recipients, cc, timestamps, message order, and links to cases.

Timeline event records should preserve activity order, event type, label, note, and timestamp for the active case.

Link tables should preserve case-to-evidence and case-to-correspondence relationships.

Decision, draft placeholder, and audit log tables provide foundation records for later workflow stages.

The app must continue to work when Supabase is not configured. In that case, repository helpers fall back to mock/session-compatible behavior and do not crash.

## Sprint 006 Private Evidence Storage

The evidence model gains private storage metadata and upload-state tracking for file evidence.

Evidence records should now also capture:

- original filename
- stored path or key
- MIME type
- file size
- source type
- workspace assignment
- linked intake item placeholder
- linked case placeholder
- uploaded or created date
- evidence status
- description or note
- storage state

Storage state should distinguish at least:

- staged
- uploaded
- metadata-only
- fallback-prototype

The private evidence bucket should be represented as `nsml-evidence-files` in storage configuration and deployment notes.

Evidence remains metadata-first in this sprint. The system must not claim to understand, parse, summarise, or validate file contents yet.

`/import` is the private evidence upload and staging area.
`/cases` is where the evidence record can be attached to the working case.

No public file URLs, no file preview, no direct client-side Supabase Storage writes, and no file parsing are assumed for this sprint.

## Sprint 007 EML Ingestion

The evidence and correspondence models gain parse-state tracking and source-linkage fields for server-side EML ingestion.

Evidence records should now also capture:

- parse status
- parse error
- parsed thread reference
- parsed message reference
- parsed timestamp

Correspondence thread records should now also capture:

- source evidence reference
- parse status
- parse error
- original filename
- message-id header
- in-reply-to
- references
- bcc
- safe body text
- sanitized or text-only HTML placeholder
- attachment metadata
- parsed timestamp

Correspondence message records should now also capture:

- source evidence reference
- recipients
- cc recipients
- bcc recipients
- subject
- message-id header
- in-reply-to
- references
- safe body text
- sanitized or text-only HTML placeholder
- attachment metadata
- parsed timestamp

Parse state should be represented with:

- not parsed
- parsing
- parsed
- failed
- unsupported

Evidence-to-thread linkage should preserve the original EML as the source artifact while making the parsed correspondence traceable back to the source evidence record.

Routing should remain deterministic and metadata-driven:

- case workspace wins if evidence is linked to a case;
- assigned workspace is used if no case link exists;
- Import/Staging or unclassified is used when workspace is unclear.

Parsed correspondence records must not imply raw HTML rendering or remote asset loading.

## Sprint 008 Correspondence Threading

Correspondence records gain thread-level organization fields and conservative relationship markers for operational use.

Thread-level correspondence should preserve:

- exact `message-id`, `in-reply-to`, and `references` linkage;
- a normalized subject for conservative fallback;
- sender and date metadata for safe relationship checks;
- possible-related thread markers when a hard merge is not safe;
- attachment count and attachment metadata at both thread and message level;
- source evidence linkage visibility;
- linked or unlinked case visibility;
- parse state and parse error visibility.

Thread grouping should remain conservative:

- exact header matches take priority;
- `references` should be treated as the strongest chain signal;
- subject-only matching is not enough for a hard merge;
- uncertain matches must stay separate and may only be surfaced as possible related threads.

The UI should continue to distinguish:

- `/import` staging or unclassified correspondence;
- workspace-scoped vessel, project, and general correspondence;
- archive planning placeholders without extraction;
- operational thread timeline view rather than a flat message dump.

## Sprint 005 Access Gate and Safe Persistence Wiring

The access gate uses a single-user app-password flow with a signed HTTP-only session cookie.

Access gate records and helpers should support:

- login session creation;
- session verification;
- logout / cookie clearing;
- development fallback state;
- production fail-closed handling when env vars are missing.

The intake and case surfaces now use server actions plus repository helpers for write operations when safe.

Write-flow records should support:

- intake item submissions;
- case submissions;
- persisted save results with an explicit persisted-or-fallback distinction.

Client-side state remains the visible fallback when Supabase is not configured.

## Future Primary Objects

- Workspace
- Vessel
- Project
- Case
- Import Batch
- Email Thread
- Email Message
- Evidence Item
- Attachment
- Contact
- Organisation
- Task
- Decision
- Draft Response
- Red Team Review
- Alert
- Timeline Event
- Tag
- Audit Log
- Intake Prototype Item
- Intake Prototype Batch
- Case Record
- Evidence Record

## Future Relationships

Vessel -> Cases -> Evidence Items -> Draft Responses -> Red Team Reviews -> Final Approved Copy

Project -> Cases -> Tasks -> Decisions -> Evidence Items

Import Batch -> Emails / EMLs / Files -> Parsed Records -> Cases / Threads / Evidence

Import Intake Prototype -> Session State -> Intake List / Detail View -> Simulated Workspace Assignment -> Later Case Link

Case Prototype -> Session State -> Case List / Detail View -> Evidence / Correspondence / Timeline -> Later Import Link

Email Thread -> Messages -> Attachments -> Evidence Items

## Vessel Classification Safeguards

LPG ALFRED TEMILE and LPG ALFRED TEMILE 10 must be treated as separate workspaces unless manually changed later.

AT10 should map to LPG ALFRED TEMILE 10 by default.

Alfred Temile without 10 should not be blindly merged with AT10 if context is unclear.
