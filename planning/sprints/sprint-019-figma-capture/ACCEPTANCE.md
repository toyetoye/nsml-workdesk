# Sprint 019 Acceptance Criteria

Sprint 019 is complete when the repo contains a concrete Figma capture and import plan for the current live UI, with no application code changes.

## Required outputs

- `docs/FIGMA_CAPTURE_PLAN.md`
- optional updates to `docs/UI_SCREENSHOT_CHECKLIST.md` if needed for clarity

## Completion criteria

The capture plan must:

- name the Figma file: `NSML WorkDesk UI Refinement`;
- define the Figma page structure:
  - `01 Current Screens`
  - `02 Refined Screens`
  - `03 Components`
  - `04 Implementation Notes`
- define the first capture set:
  - `/dashboard`
  - `/import`
  - `/assurance`
- define the frame naming convention for those pages;
- prefer local logged-in capture from the protected app;
- define the fallback order if that path fails;
- avoid token-capture mode unless separately approved;
- keep the login and production auth model intact;
- avoid exposing real data;
- avoid any app implementation changes.

## Handoff criteria

The plan must clearly explain:

- how current screenshots or captures should be arranged in Figma;
- what notes should be added beside each frame;
- how to mark pain points;
- how to mark safety constraints as non-negotiable;
- how later Codex changes should map back to existing shared components first.

## Safety criteria

The capture and import plan must explicitly state that Sprint 019 does not:

- implement UI changes;
- change functionality;
- change auth/security;
- add backend capability;
- add AI capability;
- add parsing capability;
- add Outlook or email integration;
- weaken production auth;
- weaken the red-team gate;
- weaken the copy gate;
- alter the live route surface.

