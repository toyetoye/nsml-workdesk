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
