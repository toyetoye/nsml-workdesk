# Maintenance 003 — Blueprint

Base: `1b15fbc56c64d47f0bc060cf7d2d43cd8f84d2eb`.

Only the JSX instructional paragraph in `src/app/(protected)/morning/MorningClient.tsx` changes. Escape the opening and closing quotation marks surrounding the example Scout question using `&quot;`. The browser-rendered text is intended to remain identical. No state, event handler, API, type, database, or integration behavior changes.

Validate with repository-wide ESLint, TypeScript `--noEmit`, production build, and `git diff --check` in a fresh isolated checkout. Compare against the two pre-existing lint errors and 17 warnings. Keep PR #1's and PR #2's synthetic suites on their separate unmerged branches; do not imply this patch incorporates those candidates.

No independent feature implementation or product approval is included.
