# NSML WorkDesk

Private NSML operations workdesk for managing vessel correspondence, cases, evidence, decisions, and reviewed draft responses.

## Purpose

The platform allows the user to manually paste emails, upload EMLs, upload documents, upload screenshots, and archive work items without directly connecting Outlook.

The system will eventually help:

- structure vessel and project work;
- highlight urgent and pending matters;
- organise evidence;
- create operational cases;
- draft email responses in the user's writing style;
- red-team review every draft;
- preserve decision trails.

## Confirmed v1 constraints

- Single user only.
- Deployed online.
- Manual import only.
- No Outlook connection.
- No automatic email sending.
- AI drafts must be reviewed before being marked ready.
- Final replies are copied manually into Outlook by the user.

## Deployment readiness

NSML WorkDesk is designed to fail closed in production if the access-gate environment variables are missing.

Required production environment variables:

- `NSML_APP_PASSWORD`
- `NSML_SESSION_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `NSML_AI_PROVIDER`
- `NSML_AI_MODEL`

Optional explicit disable flags:

- `NSML_SUPABASE_DISABLED`
- `NSML_AI_DISABLED`

Quick preflight:

```bash
npm run deploy:check
```

Production checklist:

- access gate configured and protected routes remain gated;
- Supabase configured or intentionally disabled, with migrations applied when enabled;
- private evidence bucket `nsml-evidence-files` exists, `NSML_EVIDENCE_BUCKET` points to it, and it remains private;
- AI configured or intentionally disabled;
- no public file URLs;
- no client-side Supabase writes or exposed service role keys;
- no send button anywhere;
- red-team copy gate remains active;
- fallback states remain honest and visible.

Deployment target:

- Default first deployment path: Vercel for the Next.js app and Supabase for database/storage.
- Keep all secrets in deployment environment variables only; do not commit them.

The Next.js middleware warning about the `middleware` file convention is currently tracked as deployment/backlog work unless a low-risk fix is approved later.

## Deployment execution support

Before first deployment:

1. Create the Supabase project.
2. Apply migrations in order.
3. Confirm seeded workspaces are present.
4. Confirm the private evidence bucket `nsml-evidence-files` exists and is private.
5. Configure the Vercel project.
6. Add production environment variables.
7. Deploy the app.
8. Run the smoke tests in `docs/DEPLOYMENT.md`.

## Current sprint

Sprint 014: deployment execution support.
