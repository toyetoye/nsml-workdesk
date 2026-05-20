# Data Model

## Sprint 000

Use mock data only.

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

## Future Relationships

Vessel -> Cases -> Evidence Items -> Draft Responses -> Red Team Reviews -> Final Approved Copy

Project -> Cases -> Tasks -> Decisions -> Evidence Items

Import Batch -> Emails / EMLs / Files -> Parsed Records -> Cases / Threads / Evidence

Email Thread -> Messages -> Attachments -> Evidence Items

## Vessel Classification Safeguards

LPG ALFRED TEMILE and LPG ALFRED TEMILE 10 must be treated as separate workspaces unless manually changed later.

AT10 should map to LPG ALFRED TEMILE 10 by default.

Alfred Temile without 10 should not be blindly merged with AT10 if context is unclear.
