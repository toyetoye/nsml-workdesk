# Architecture

## Recommended Stack

- Next.js frontend/app framework
- Supabase Postgres for database foundation and later sprint persistence
- Supabase Storage or S3-compatible storage, later sprint
- OpenAI API for structured AI workflows, later sprint
- Single-user authentication, deployment sprint

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

## Future Architecture Notes

AI must work through structured outputs.
AI drafts must pass red-team review.
Original evidence must be preserved unchanged.
AI outputs must remain separate from original evidence.
