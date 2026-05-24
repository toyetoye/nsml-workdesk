# Sprint 018 Acceptance Criteria

Sprint 018 is complete when the repo includes documentation that clearly hand off the current UI to Figma and Codex for a later visual refinement pass.

## Required outputs

- `docs/UI_AUDIT.md`
- `docs/FIGMA_DESIGN_BRIEF.md`
- `docs/DESIGN_SYSTEM_NOTES.md`
- `docs/UI_SCREENSHOT_CHECKLIST.md`

## Completion criteria

The documentation must:

- document all current major routes;
- document current page structure;
- document reusable UI patterns;
- map the workflow as Capture -> Structure -> Link -> Decide -> Draft -> Review -> Copy;
- identify page pain points for Figma refinement;
- preserve safety constraints and route constraints;
- define the screenshot capture checklist for desktop and mobile;
- define how Figma output should later map back to the existing shared components.

## Safety criteria

The handoff documents must explicitly state that Figma and later Codex implementation must not:

- change the workflow model;
- change the access gate;
- change the red-team gate;
- weaken copy safety;
- hide warnings or fallback states;
- add backend capability;
- add AI capability;
- add parsing capability;
- add Outlook or email integration.

## Handoff criteria

The design brief must make clear that:

- this is refinement of the current product, not a redesign;
- the next safe action should be obvious within five seconds;
- one clear primary action per page is preferred;
- secondary and reference panels should recede;
- approved Figma changes should map back onto `StickyPageHeader`, `CollapsibleSection`, `WorkflowChecklist`, status badges, cards, and buttons first.

