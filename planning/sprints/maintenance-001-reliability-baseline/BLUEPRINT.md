# Maintenance 001 - Blueprint

Use Node's built-in test runner and strict assertions. Each scenario executes the existing scripts/deploy-check.js in a fresh temporary directory. Remove relevant inherited configuration, use obviously synthetic fixture values, set a timeout, and clean up after each test. Test behavior and exit codes rather than importing a copied implementation.

Modify only CLI explanatory text; keep classifications and control flow unchanged. Add a test:preflight package script, update docs/VALIDATION.md, add planning/BACKLOG.md, append DECISIONS.md and PROJECT_STATE.md, and keep this four-file maintenance handoff. Do not change dependencies or the lockfile.

Risk: CLI tests do not exercise the Next.js runtime or guarantee that its separate readiness helper behaves identically. Treat parity, CI wiring, and private live verification as explicit follow-on work. Rollback is a revert of this isolated maintenance commit.
