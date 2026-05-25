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

## D021 - Conservative threading

Decision: Sprint 008 threading must be deterministic and conservative. Exact `message-id`, `in-reply-to`, and `references` matching come first; normalized subject fallback is only used when sender/date proximity also looks safe; uncertain matches stay separate and may be surfaced only as possible related threads.

Reason: A false merge is worse than leaving related emails separate because it can blur evidence, case history, and operational accountability.

## D022 - Thread console UX

Decision: Sprint 008 should present correspondence as an operational thread console with visible parse state, source evidence linkage, linked/unlinked case state, attachment metadata, and placeholder case-linking actions.

Reason: Parsed email files need to be usable in daily operations, not just technically ingested.

## D023 - Advisory AI triage only

Decision: Sprint 009A adds AI as a server-side advisory triage layer that analyses only selected intake items, correspondence threads, or cases and returns structured output without mutating records automatically.

Reason: The app needs AI help to surface likely workspace, case, urgency, and follow-up signals, but the user must remain the final decision-maker and the result must stay traceable to the selected source material.

## D024 - Selected-context AI only

Decision: AI requests must include source type and source IDs and must only use the selected item/thread/case context plus directly linked evidence or correspondence.

Reason: The system must not send the whole evidence library or unrelated vessels and projects to the model, and every output must remain auditable back to the source material used.

## D025 - Draft generation is advisory and red-team gated

Decision: Sprint 009B adds AI draft generation as a server-side advisory layer that prepares draft wording from selected intake items, correspondence threads, or cases, but always keeps drafts in `pending_red_team`, `needs_evidence`, or `blocked` states and never marks them ready.

Reason: Drafts can help accelerate work, but they are not safe to send until red-team review exists. The user must remain the final approver, and no draft may be treated as ready or sent automatically.

## D026 - Red-team copy gate

Decision: Sprint 009C adds a server-side red-team review layer for generated drafts, and a draft may only become copyable when the review verdict is `pass` or `pass_with_caution` and `safe_to_copy` is true.

Reason: A generated draft is not safe to reuse externally until it passes red-team review or passes with caution. The system may prepare wording, but it must not approve, send, or mark a response ready on its own.

## D027 - Writing style as bounded calibration

Decision: Sprint 010 adds a persisted writing style profile that the draft builders use as bounded guidance for tone, greeting, closing, brevity, stakeholder framing, and phrase choice.

Reason: The user wants drafts to sound more like the user while remaining safe, evidence-based, and red-team controlled. Style can calibrate phrasing, but it must not override evidence, safety, missing information, liability controls, or review gates.

## D028 - Workflow hardening and next-best-action guidance

Decision: Sprint 011 hardens the end-to-end workflow with compact next-best-action guidance, clearer state labels, and cross-links between import, correspondence, cases, drafts, and writing-style surfaces.

Reason: The app already has the core capability surfaces. The next step is to make the path between them coherent, obvious, and safe without adding new workflow power or automation.

## D029 - Production readiness validation

Decision: Sprint 012 adds a small server-side deployment-readiness helper and deployment documentation updates for access-gate, Supabase, storage, and AI environment validation.

Reason: Production readiness should be explicit and honest. The app must fail closed when the access-gate env vars are missing, while still making intentional disable and development fallback states visible instead of vague.

## D030 - Route-surface hygiene

Decision: Sprint 013 removes the remaining legacy Staff-OS routes and neutralizes old route wording so the production route surface is NSML-only.

Reason: First deployment should not expose confusing or unnecessary legacy surfaces, and route hygiene is safer than leaving parked legacy pages reachable.

## D031 - Deployment execution support

Decision: Sprint 014 focuses on deployment execution support for the default Vercel + Supabase path, including checklist, env clarity, and smoke-test guidance, rather than adding product capability.

Reason: First deployment should be guided by explicit setup and verification steps, not by new workflow features or hidden assumptions about environment readiness.

## D032 - Assurance tracker is evidence-backed

Decision: Sprint 015 adds an assurance and governance signal tracker that must preserve the distinction between fact, reported statement, inference, and assumption, and must keep unverified governance language neutral unless evidence is attached.

Reason: The product needs a disciplined way to convert broad support feedback and governance signals into tracked actions without becoming a political diary or storing unsupported allegations as facts.

## D033 - Bulk Outlook evidence intake is export-only

Decision: Sprint 016 adds bulk Outlook evidence intake as server-side ZIP-of-EMLs ingestion with PST preservation-only handling, manual pasted email fallback guidance, and conservative batch limits, but it does not connect to Outlook or parse PST files in-app.

Reason: The product needs a practical way to bring in exported email evidence without live mailbox integration while preserving evidence safety, traceability, and the distinction between imported message content and downstream conclusions.

## D034 - Dashboard is overview and navigation only

Decision: Sprint 020B simplifies the dashboard into a one-page overview and navigation hub with high-level counts, clickable module cards, and a small attention strip, while keeping detailed workflows inside the relevant module pages.

Reason: The dashboard should help the user orient quickly and click through to the right place. Operational detail belongs in `/import`, `/assurance`, `/cases`, `/drafts`, and workspace pages, where the work can be handled without turning the dashboard into a workbench.

## D035 - Collapsible sidebar information architecture

Decision: Sprint 021 adds a collapsible sidebar tree with overview-first parent pages and child work surfaces reached through route-aware section tabs or scoped views.

Reason: The main sidebar should represent major work areas, while child navigation should keep the detailed work inside the relevant module instead of flattening everything into one long page.

## D036 - Overview-only parent views

Decision: Sprint 021A and Sprint 021B keep overview content visible only on overview/default views and keep selected child views focused on the active work surface.

Reason: Child views should behave like focused work surfaces rather than long stacked pages with repeated overview content underneath them.

## D037 - Exclusive child activation and responsive form width

Decision: Sprint 021B makes child navigation exclusive so only the active child item is highlighted, and it widens long forms/detail blocks with responsive grids where safe.

Reason: The selected view must be unambiguous, and forms should use available desktop width while remaining readable and safe on mobile.
