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
