# Security and Privacy

NSML WorkDesk may contain sensitive operational correspondence.

## Security rules

- Do not expose files publicly.
- Do not expose API keys client-side.
- Do not connect Outlook in v1.
- Do not send email automatically.
- Preserve original evidence unchanged.
- Keep AI outputs separate from source evidence.
- Log user-approved final responses separately from drafts.
- User remains final approver.
- Keep persistence behind safe server-side repository utilities.
- Do not let client components write directly to Supabase.
- Make the app fall back safely when Supabase environment variables are missing.
- Protect the app with a single-user gate using a signed HTTP-only session cookie.
- Fail closed in production if the access-gate environment variables are missing.
- Keep evidence uploads private and server-side only.
- Do not expose public file URLs for evidence.
- Do not let client components write directly to Supabase Storage.
- Do not claim to understand, parse, summarize, or validate file contents until a later parsing/AI sprint.
- Email HTML must never be rendered raw.
- Remote email resources must not be fetched automatically.
- Treat virus/malware scanning as a future control before broader or less-controlled file ingestion.
- Threading must remain deterministic and conservative; uncertain relationships should stay separate instead of being force-merged.
- Placeholder case-link and create-case actions must not imply automatic case creation or linking.
- AI calls must be server-side only.
- AI requests must be selected-context-only and must not include unrelated vessels, projects, or the whole evidence library.
- AI output must remain advisory only and must not automatically mutate records.
- AI triage must preserve traceability to source type, source IDs, and evidence_used.
