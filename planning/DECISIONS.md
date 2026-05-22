# Decisions

## D001 - Separate app

Decision: Build NSML WorkDesk as a separate app.

Reason: The workflow is sensitive and specific enough to deserve a focused product.

## D002 - Manual import first

Decision: Do not connect Outlook in v1.

Reason: User wants to avoid direct Outlook connection. Manual paste/upload provides control and reduces privacy risk.

## D003 - No automatic email sending

Decision: The app will not send emails automatically.

Reason: User must approve and manually copy final replies into Outlook.

## D004 - Red-team review required

Decision: Every AI-generated email draft must be reviewed by a red-team agent before being marked ready.

Reason: Prevent unsupported claims, liability exposure, wrong tone, or unsafe recommendations.

## D005 - Vessel separation

Decision: LNG PORTHARCOURT II, LPG ALFRED TEMILE, and LPG ALFRED TEMILE 10 are treated as separate workspaces.

Reason: Avoid accidental merging or misclassification.

## D006 - Import staging first

Decision: Imported emails enter through `/import` first, then move into the relevant vessel, project, or other workspace after classification.

Reason: `/import` is the intake and staging area, not the permanent home for all imported correspondence. This preserves classification flow and keeps workspace correspondence organized.

## D007 - Workspace correspondence surfaces

Decision: Workspace-level correspondence should be shown inside the relevant vessel, project, or other workspace, with cases acting as later link targets.

Reason: The product should support operations from the workspace where the issue belongs, while keeping imported correspondence traceable back to intake and then to cases.

## D008 - Dashboard as command centre

Decision: The dashboard must act as a command centre with work queues, status cards, filters, and drill-down links rather than as a pure KPI board.

Reason: The user needs to see why each item matters, what is waiting, and what to do next.

## D009 - Mock filtering only

Decision: Sprint 001 dashboard filtering is client-side only and uses mock data only.

Reason: This keeps the sprint within the approved shell scope while still making the dashboard useful for triage.

## D010 - Import capture desk

Decision: `/import` is the capture and staging desk for pasted emails, notes, and future files, while routing, persistence, parsing, and case creation remain later-sprint concerns.

Reason: Imported material should enter through a controlled intake surface first, then be classified into the relevant workspace before any case link is created.

## D011 - Session-only intake prototype

Decision: Sprint 002 intake state lives only in client-side React memory for the current session.

Reason: This keeps the prototype lightweight and avoids implying persistence, backend storage, or retention behavior that has not been approved yet.

## D012 - Case is the working unit

Decision: Cases are the operational working unit; emails, documents, screenshots, notes, EMLs, quotes, and reports are evidence attached to a case.

Reason: `/import` captures material, while `/cases` is where work is managed, decisions are made, and evidence is organized around the active case.

## D013 - Session-only case prototype

Decision: Sprint 003 case creation, selection, evidence display, and timeline state live only in client-side React memory for the current session.

Reason: This keeps the case prototype lightweight while avoiding implied persistence, import linkage, or backend workflow before the next approved sprint.

## D014 - Safe persistence foundation

Decision: Persistence must stay behind safe server-side repository utilities; client components must not write directly to Supabase.

Reason: The foundation should support future persistence without exposing secrets, unsafe client-side writes, or crashes when Supabase environment variables are missing.

## D015 - Single-user access gate

Decision: Use a simple app-password gate with a signed HTTP-only session cookie for deployed access.

Reason: The app needs a small, safe gate for online use without introducing multi-user account complexity or Supabase Auth scope creep.

## D016 - Server-side writes only

Decision: Intake and case writes must flow through server actions or safe server utilities before they reach the repository boundary.

Reason: Client components should not write to Supabase directly, and fallback behavior must remain explicit when persistence is unavailable.

## D017 - Private evidence storage foundation

Decision: Sprint 006 evidence uploads use a private Supabase Storage bucket named `nsml-evidence-files`, with server-side upload and metadata persistence only.

Reason: Evidence files must remain private and server-mediated, with durable storage separated from UI state and no public file URLs exposed.

## D018 - File contents remain opaque

Decision: Sprint 006 treats files as evidence metadata and private binary storage only; the system does not claim to parse, summarize, or validate file contents yet.

Reason: Parsing, AI interpretation, and validation belong to later controlled sprints after the storage foundation is proven safe.

## D019 - Server-side EML ingestion

Decision: Sprint 007 ingests uploaded `.eml` files server-side using `mailparser`, preserves the original EML as private evidence, and creates structured correspondence metadata and message records from the parsed content.

Reason: The product needs a safe path from uploaded email files to structured correspondence without exposing raw HTML, remote assets, or client-side file handling.

## D020 - Deterministic correspondence routing

Decision: Sprint 007 routes parsed correspondence deterministically without AI: a linked case workspace wins, otherwise the assigned workspace is used, and otherwise the item stays in Import/Staging or unclassified.

Reason: Correspondence must remain explainable and traceable while avoiding automatic classification or workflow guesses.
