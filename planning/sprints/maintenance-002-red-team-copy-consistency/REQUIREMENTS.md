# Maintenance 002 - Red-team copy consistency

Status: Proposed narrow maintenance candidate, not approved for merge or deployment. Base: 1b15fbc56c64d47f0bc060cf7d2d43cd8f84d2eb.

Manual copy is permitted only if the structured red-team verdict is pass or pass_with_caution, safe_to_copy is explicitly true, and readiness_status is ready_to_copy. Contradictory, missing, invalid or negative values fail closed. Enforce the rule in server normalization and both client copy surfaces. No sending, mailbox access, case close-out, data/schema change, live AI calls, or new feature sprint. Owner review required.
