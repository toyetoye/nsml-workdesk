# Risks

## R001 - Scope creep

Risk: Builder may add Outlook, AI, database, or email sending too early.

Mitigation: Strict sprint boundaries.

## R002 - Vessel confusion

Risk: LPG ALFRED TEMILE and LPG ALFRED TEMILE 10 may be confused.

Mitigation: Treat as separate workspaces; AT10 maps to LPG ALFRED TEMILE 10.

## R003 - Liability wording

Risk: AI drafts may create commercial or technical exposure.

Mitigation: Mandatory red-team review and user approval.

## R004 - Data sensitivity

Risk: NSML correspondence may be confidential.

Mitigation: Private deployment, no public file links, no direct Outlook connection in v1.

## R005 - Dashboard noise

Risk: Dashboard may show counts without useful explanation.

Mitigation: Every alert must include why it matters and suggested next action.

## R006 - Import staging confusion

Risk: Imported correspondence could be mistaken as permanently stored in `/import`.

Mitigation: Treat `/import` as staging/unclassified intake only; once classified, show threads in the relevant vessel, project, or other workspace and later link them to cases.

## R007 - Mock-to-real confusion

Risk: Sprint 000 mock correspondence surfaces could be mistaken for real parsing, email, or workflow automation.

Mitigation: Keep all Sprint 000 correspondence surfaces clearly labeled as mock-only and avoid database, API, Outlook, or AI functionality until a later approved sprint.

## R008 - KPI-only dashboard drift

Risk: The dashboard could collapse into counts without operational context.

Mitigation: Every queue item must explain why it matters, who is waiting, and the suggested next action.

## R009 - Filter complexity

Risk: Dashboard filters could become harder to scan if too many states are shown at once.

Mitigation: Keep filtering client-side, use compact queue cards, and preserve the shell spacing so the CoS Assistant rail does not crowd the command centre.

## R010 - Session reset confusion

Risk: Sprint 002 intake items disappear on refresh because the prototype uses session-only React state.

Mitigation: Label the intake surface clearly as a prototype and avoid implying persistence until a later sprint.

## R011 - Simulated routing confusion

Risk: Route-to-workspace controls could be mistaken for real routing or workflow automation.

Mitigation: Keep the simulated nature explicit in the UI and in the planning docs until backend routing is approved.

## R012 - Import desk scope drift

Risk: `/import` could be treated as permanent storage rather than a staging desk for pasted emails, notes, and future files.

Mitigation: Reinforce that `/import` is capture/staging only; classification, routing, parsing, and case creation stay out of scope for Sprint 002.

## R013 - Case-data sprawl

Risk: The case workbench could become too dense if list, detail, evidence, correspondence, and timeline are not clearly separated.

Mitigation: Keep the list compact, keep the detail pane structured, and place decision, next action, evidence, and correspondence in distinct sections.

## R014 - Prototype linkage confusion

Risk: Session-only case creation or the create-from-intake placeholder could be mistaken for a real import-to-case bridge.

Mitigation: Label the controls as placeholders and keep the docs explicit that import-to-case connection is not active yet.

## R015 - Case evidence misunderstanding

Risk: Users could confuse cases with evidence rather than treating cases as the operational unit.

Mitigation: Keep the product rule visible in planning and UI copy: `/import` captures material, `/cases` manages the work, and evidence stays attached to the case.

## R016 - Unsafe Supabase access

Risk: Direct client-side Supabase writes or queries could expose sensitive NSML material or create brittle runtime behavior.

Mitigation: Keep persistence behind server-side repository utilities, use a no-op fallback when environment variables are missing, and avoid client components talking to Supabase directly.

## R017 - Missing environment variables

Risk: The app could crash or become unavailable when Supabase env vars are not configured.

Mitigation: Make the persistence layer optional and keep mock/session behavior available as the default fallback.

## R018 - Public access without gate

Risk: The deployed app could be exposed without passing the access gate if the protection is not enforced consistently.

Mitigation: Protect the shell with middleware and a server-side guard, and fail closed in production when access-gate env vars are missing.

## R019 - Unsafe write path

Risk: Intake or case writes could bypass the server repository boundary and talk to Supabase directly.

Mitigation: Keep all write operations behind server actions or safe server utilities and leave client components on fallback/session state.

## R020 - Private upload trust gap

Risk: Evidence uploads could be mistaken for parsed, validated, or publicly viewable content even though Sprint 006 only stores private binaries plus metadata.

Mitigation: Keep the UI explicit about storage state, metadata-only handling, and the lack of file parsing, previews, or public URLs.

## R021 - Malware exposure

Risk: Broader file ingestion without scanning could introduce virus or malware risk.

Mitigation: Treat virus/malware scanning as a required future control before less-controlled ingestion or wider file acceptance.

## R022 - Unsafe EML rendering

Risk: Parsed email HTML could be rendered unsafely or could pull remote content automatically.

Mitigation: Never render raw email HTML, reduce HTML to safe text only, and never auto-fetch remote email resources.

## R023 - Parsing fallback ambiguity

Risk: Users could assume parsing worked when Supabase/storage is missing and the system falls back.

Mitigation: Show clear parsing-disabled or fallback messaging and keep parse status visible as non-destructive metadata state.

## R024 - Unsupported archive overreach

Risk: Archive ingestion could drift into broad ZIP/extraction logic before the parsing spine is ready.

Mitigation: Keep archive extraction optional and deferred; only expand it after a safe, explicit proposal.

## R025 - False thread merge

Risk: Over-aggressive threading could incorrectly merge distinct correspondence into a single thread.

Mitigation: Use exact header matching first, fall back conservatively, and keep uncertain matches separate as possible related only.

## R026 - Correspondence UX confusion

Risk: Parsed threads could still feel like a flat message list or a mail client instead of operational correspondence.

Mitigation: Keep the thread console explicit with timeline, attachments, parse state, case linkage, and workspace-scoped views.

## R027 - AI context bleed

Risk: AI triage could accidentally include unrelated vessels, projects, or the whole evidence library and produce advice without traceability.

Mitigation: Keep AI server-side, selected-context-only, and strictly tied to source type and source IDs with evidence_used shown in the result.

## R028 - Advisory-to-action confusion

Risk: Users could mistake AI recommendations for automatic changes to workspace, case, or status.

Mitigation: Keep AI output advisory only, display suggestions without applying them automatically, and preserve explicit user approval for any downstream action.
