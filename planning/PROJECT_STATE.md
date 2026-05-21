# Project State

## Current phase

Sprint 005 complete.

## Active sprint

Sprint 006 - online deployment and hardening.

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
- Sprint 003 added a `/cases` case management workbench with a mock case list, selected case detail pane, session-only Create Case drawer/form, case status, priority, category, owner/waiting party, age and due indicators, a Decision Required / Next Action section, linked evidence cards, linked correspondence tied to the selected case, a timeline/activity rail, and placeholder Attach evidence and Create from intake item actions.
- Sprint 003 is mock-data only and uses session-only React state with seeded `caseRecords` and `evidenceRecords`, no persistence, no localStorage, no API routes, no database/Supabase, no AI/OpenAI, no import-to-case connection yet, no real file storage, no EML/PDF/OCR parsing, no Outlook integration, and no email sending.
- Sprint 004 added the Supabase persistence foundation with database migrations, seeded confirmed workspaces, RLS-enabled tables, typed persistence models, safe persistence config, a no-op/fallback persistence client, repository helpers, and neutralized old direct Supabase access paths.
- Sprint 004 converted `src/lib/supabase.ts` into a compatibility shim and changed `src/lib/memory.ts` so it no longer directly queries Supabase.
- Sprint 004 keeps the app usable without Supabase configured and preserves the current mock/session-based UI behavior.
- Sprint 004 does not add AI, file parsing, real file storage, Outlook integration, email sending, or auth.
- Sprint 005 added a single-user app-password gate with a signed HTTP-only session cookie, protected the main app shell, and wired intake and case writes through server-side actions into the repository layer.
- Sprint 005 keeps local development usable with a clear fallback when access-gate or Supabase environment variables are missing.
- Sprint 005 preserves mock/session fallback for intake and case workflows when persistence is unavailable.
- Sprint 005 does not add AI, file parsing, real file storage, Outlook integration, email sending, multi-user accounts, roles, or Supabase Auth.

## Next action

Start the next approved sprint.
