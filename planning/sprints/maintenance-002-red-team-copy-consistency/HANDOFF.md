# Maintenance 002 - Handoff

Status: Draft maintenance candidate, not approved, merged or deployed. Base: 1b15fbc56c64d47f0bc060cf7d2d43cd8f84d2eb.

This patch preserves advisory-only red-team review while requiring all three structured copy-permission signals to agree. Both browser surfaces and the server fail closed when signals disagree; no autonomous correspondence capability is added.

17 synthetic predicate scenarios passed on Node 22.16.0 in an isolated environment. Full checkout validation remains pending. Existing stored reviews may have lost contradictory original fields; they require fresh review rather than retrospective trust. Version-bound approval, source-evidence changes, and required-user-check completion remain outside this isolated maintenance and tracked under existing WD-008.
