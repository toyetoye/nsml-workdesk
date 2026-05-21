# Project State

## Current phase

Sprint 002 complete.

## Active sprint

Sprint 003 - Cases and evidence.

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

## Next action

Start the next approved sprint.
