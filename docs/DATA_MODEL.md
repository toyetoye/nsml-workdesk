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

## Future Relationships

Vessel -> Cases -> Evidence Items -> Draft Responses -> Red Team Reviews -> Final Approved Copy

Project -> Cases -> Tasks -> Decisions -> Evidence Items

Import Batch -> Emails / EMLs / Files -> Parsed Records -> Cases / Threads / Evidence

Import Intake Prototype -> Session State -> Intake List / Detail View -> Simulated Workspace Assignment -> Later Case Link

Email Thread -> Messages -> Attachments -> Evidence Items

## Vessel Classification Safeguards

LPG ALFRED TEMILE and LPG ALFRED TEMILE 10 must be treated as separate workspaces unless manually changed later.

AT10 should map to LPG ALFRED TEMILE 10 by default.

Alfred Temile without 10 should not be blindly merged with AT10 if context is unclear.
