# Figma Capture and Import Plan

Sprint 019 prepares NSML WorkDesk for a Figma/Codex visual refinement pass by capturing the current protected UI as editable Figma frames.

This is a capture and handoff plan only. It does not change app code, workflow, safety, or route behavior.

## Figma file

Use the Figma file name:

- `NSML WorkDesk UI Refinement`

## Figma page structure

Organize the file into these pages:

1. `01 Current Screens`
2. `02 Refined Screens`
3. `03 Components`
4. `04 Implementation Notes`

## Capture method

Preferred capture path:

1. Capture the live app from a local logged-in session.
2. Use the authenticated browser view of the protected app.
3. Import the capture into Figma as editable frames.
4. Annotate the frames with the constraints and pain points from Sprint 018.

Fallback order if the preferred path fails:

1. local logged-in screenshot capture
2. full-page screenshots or PNGs already prepared by the user
3. manual screenshot import into Figma

Do not remove login.
Do not expose production pages without auth.
Do not use token capture mode unless separately approved.

## First capture set

Capture these pages first:

- `/dashboard`
- `/import`
- `/assurance`

Recommended frame names:

- `dashboard / default`
- `dashboard / populated`
- `import / default`
- `import / bulk`
- `import / parsed`
- `assurance / default`
- `assurance / signals`
- `assurance / weekly pack`

## Required states per page

### `/dashboard`

Capture:

- default loaded state
- populated / queue state
- collapsed workflow checklist

Notes to include beside the frame:

- operations command-centre framing
- fewer but more actionable blocks
- next safe action should be obvious

### `/import`

Capture:

- default capture and intake view
- bulk evidence intake section
- parsed thread review section
- route / link section
- AI-disabled or persistence-fallback state where relevant

Notes to include beside the frame:

- capture first
- structure second
- route / link third
- manual intake remains central

### `/assurance`

Capture:

- default signals view
- support items view
- engagements view
- weekly evidence pack view
- expanded / collapsed guidance panels

Notes to include beside the frame:

- neutral wording must stay visible
- evidence-level guardrails must stay visible
- broad signal -> specifics -> support item -> engagement -> weekly pack

## Screenshot / frame organization

### `01 Current Screens`

Place the current captured pages here.

Recommended order:

1. dashboard
2. import
3. assurance

Each route should have a small group of frames showing the important states:

- default
- populated / selected
- expanded / collapsed where useful

### `02 Refined Screens`

Leave this page empty until Figma has produced approved refinements.

Use it later for:

- revised page comps
- before / after comparisons
- approved hierarchy changes

### `03 Components`

Use this page for:

- sticky headers
- workflow checklist patterns
- status badges
- cards
- buttons
- warning banners
- next-best-action panels

### `04 Implementation Notes`

Use this page for:

- page-level pain points
- safety constraints
- component reuse rules
- spacing / hierarchy comments
- what Codex should implement later and what it must not change

## How to mark pain points

Add a brief callout beside each current-state frame describing:

- what is too long
- what is competing for attention
- what is unclear
- what should recede

Keep pain-point notes short and specific. Examples:

- "Too much guidance visible above the fold."
- "Selected case needs stronger visual priority."
- "Reference panels should recede."
- "Red-team state should read faster."

## Non-negotiable safety constraints

Mark these as protected in the notes layer:

- access gate stays intact
- red-team gate stays intact
- copy gate stays intact
- no-send posture stays intact
- evidence-level guardrails stay intact
- AI remains advisory only
- persistence fallback stays honest
- no backend, AI, parsing, Outlook, or email feature changes

## How to hand refined frames back to Codex later

When Figma has approved the direction:

1. Map the approved changes back onto existing shared components first.
2. Prefer `StickyPageHeader`, `CollapsibleSection`, `WorkflowChecklist`, status badges, cards, and buttons.
3. Update structure before style.
4. Preserve safety labels, warnings, and gate states.
5. Verify the route surface and workflow remain unchanged after implementation.

## Checklist summary

Capture and import:

- authenticated live-page screenshots
- the first three priority pages
- current-state frames with explicit notes
- one notes section per page for pain points and constraints

Do not:

- change app code
- change auth
- change workflow
- change safety behavior
- introduce token capture without approval

