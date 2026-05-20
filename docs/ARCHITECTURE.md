# Architecture

## Recommended Stack

- Next.js frontend/app framework
- Supabase Postgres for database, later sprint
- Supabase Storage or S3-compatible storage, later sprint
- OpenAI API for structured AI workflows, later sprint
- Single-user authentication, deployment sprint

## Current Sprint 000 Architecture

Sprint 000 is UI shell only.

No database is required yet.
No AI is required yet.
No external email integration is required.
No file parsing is required.

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
- DraftReviewPanel
- StatusBadge
- EvidenceList

## Future Architecture Notes

AI must work through structured outputs.
AI drafts must pass red-team review.
Original evidence must be preserved unchanged.
AI outputs must remain separate from original evidence.
