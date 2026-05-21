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
