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
