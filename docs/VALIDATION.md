# Validation

## General validation principle

The system is correct only if outputs are traceable to evidence and the user remains the final approver.

## Sprint 000 validation

- App runs locally.
- Dashboard route exists.
- Five workspaces exist.
- Dashboard cards render mock counts.
- Placeholder pages exist.
- No Outlook connection exists.
- No email sending exists.
- No AI automation exists.


## Deployment preflight regression baseline

Run `npm run test:preflight` (or `node --test tests/deploy-check.test.mjs`) with Node.js 20 or newer. The suite needs no installed application dependencies, credentials, services, or network calls. It runs the real CLI in isolated temporary working directories with synthetic fixtures and removes them afterward.

Coverage: development fallback; missing production configuration; non-bypassable access configuration requirements; intentional disable; missing enabled-service settings; unexpected bucket/provider values; no fixture secret values in output; configuration-only readiness wording; environment precedence.

A passing result verifies the CLI's tested behavior only, not live authentication, credentials, RLS, evidence bucket privacy/existence, application readiness-helper parity, AI review quality, or end-to-end workflow safety. CI execution and live assurance remain separate backlog items. Keep lint, type checking, build, and applicable manual smoke tests separate in the handoff; do not label unrun checks as passed.
