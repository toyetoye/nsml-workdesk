# Deployment

Deployment target: online private deployment.

Possible options:

- Vercel + Supabase
- Railway + Supabase
- Render + Supabase
- Private VPS

Deployment is not part of Sprint 000.

Production requirements:

- environment variables server-side only;
- authentication enabled;
- private uploads;
- audit logs;
- backup/export process.

## Sprint 004 Notes

Sprint 004 establishes the persistence foundation but does not require deployment changes.

Sprint 005 adds the access gate and safe repository wiring, but still does not require deployment execution.

The app must continue to run when Supabase is not configured, using mock/session-compatible fallback behavior.

No public file URLs, no client-side Supabase keys, and no direct client writes should be introduced in this sprint.

Production deployments must fail closed if the access-gate env vars are missing.

Production auth and private upload handling remain later-sprint concerns.

## Sprint 006 Notes

Sprint 006 adds private evidence storage foundation but still does not require deployment execution.

Evidence uploads must use the private Supabase Storage bucket `nsml-evidence-files` and remain server-side only.

Deployment should keep evidence files private, use metadata-only records when storage is unavailable, and avoid public file URLs.

No file preview or parsing should be enabled at deployment time for this sprint.

Virus/malware scanning should be treated as a required future deployment control before broader or less-controlled file ingestion.

## Sprint 007 Notes

Sprint 007 adds server-side EML ingestion foundation but still does not require deployment execution.

Parsed email ingestion must remain server-side only and preserve the original EML as private evidence.

Deployment should keep parsed correspondence traceable back to source evidence, avoid public file URLs, and never render raw email HTML.

Remote email assets must not be fetched automatically.

When Supabase/storage is unavailable, parsing should be disabled or fall back clearly without crashing the app.

Production deployments should continue to keep the access gate, private evidence storage, and repository-backed persistence boundaries intact.
