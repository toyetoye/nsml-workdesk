# UI Audit

Sprint 018 records the current NSML WorkDesk interface before any Figma-led refinement.

This is a documentation-only audit. It captures the present page structure, reusable patterns, workflow flow, long-page pain points, screenshot targets, and the constraints Figma and Codex must preserve.

Sprint 020B simplified the dashboard into a one-page overview and navigation hub, and the Playwright `ui:audit` confirmed that the dashboard now fits within one viewport.

## Scope

Pages audited:

- `/dashboard`
- `/import`
- `/assurance`
- `/cases`
- `/drafts`
- `/settings/writing-style`
- `/vessels/lng-portharcourt-ii`
- `/vessels/lpg-alfred-temile`
- `/vessels/lpg-alfred-temile-10`
- `/projects`
- `/other`

Related protected surfaces:

- `/evidence`
- `/settings` redirect to `/settings/writing-style`
- workspace correspondence views rendered through `WorkspacePage`

## Current product shape

NSML WorkDesk is an operational workdesk for:

- capturing imported material;
- structuring evidence and correspondence;
- linking items to cases and assurance records;
- deciding next actions;
- drafting responses;
- red-team reviewing drafts;
- copying reviewed drafts manually when safe.

The app is single-user, protected, and advisory-first. No send action exists.

## Sprint 021 navigation model

The current navigation model is overview-first:

- the main sidebar is a collapsible tree of major work areas;
- overview pages stay compact and click-through oriented;
- child views or section tabs hold the detailed work;
- the active child item is exclusive;
- the overview child is active only on overview/default views;
- mobile bottom navigation stays top-level only while page-level chips handle child views.

Sprint 021A and Sprint 021B tightened the child-view focus further:

- overview content now renders only on overview/default views;
- selected child views show only the active work surface instead of repeating the full parent overview;
- import manual intake and assurance signal forms now use responsive desktop grids rather than long narrow columns;
- long text fields remain full width;
- the assurance Signals/New Signal and import Manual Intake / selected intake detail surfaces now use the available width more effectively;
- the sidebar active state is exclusive, so overview and child pills no longer appear active together.

## Workflow map

The current workflow across the app should read as:

Capture -> Structure -> Link -> Decide -> Draft -> Review -> Copy

That flow appears in different forms on different pages:

- `/import` starts with capture and intake.
- `/assurance` turns broad signals into structured support items and logs.
- `/cases` is where evidence and correspondence become case work.
- `/drafts` is where AI draft output is reviewed and copy-gated.
- `/settings/writing-style` tunes how drafts sound, but not what they are allowed to claim.
- workspace correspondence pages show route-specific thread context and keep the next safe action obvious.

## Route inventory and current page structure

### `/dashboard`

Current structure:

- compact sticky page header
- high-level overview cards
- clickable module cards
- small top attention strip
- no workflow checklist or detailed queue on the dashboard
- no recent import detail or vessel snapshot blocks on the dashboard
- CoS Assistant hidden from the dashboard surface

Observed intent:

- show a one-page overview and navigation hub
- guide the user into import, assurance, cases, drafts, vessels, and writing style
- keep the first viewport focused on high-level counts, module cards, and top attention items
- keep detailed workbench content inside the module pages
### `/import`

Current structure:

- sticky page header
- workflow checklist
- manual intake / capture section
- bulk evidence intake section
- evidence storage section
- parsed thread review section
- route / link guidance

Observed intent:

- capture first, then structure, then route/link
- keep manual pasted intake visible
- keep bulk import, evidence storage, and parsed thread review available but not dominant

Observed 021A/021B update:

- the overview content appears only on the overview/default view;
- the manual intake and selected detail areas use a wider responsive layout;
- child views now present focused work surfaces instead of stacked overview-plus-detail content.

### `/assurance`

Current structure:

- sticky page header
- workflow checklist
- assurance workbench with tabbed modes:
  - Assurance Signals
  - Vessel Support Items
  - Vessel Engagement Log
  - Weekly Evidence Pack

Observed intent:

- keep fact / reported / inference / assumption distinctions visible
- move from broad signal to request specifics to support item to engagement log to weekly pack

Observed 021A/021B update:

- the overview content appears only on the overview/default view;
- the Signals child view no longer shows duplicate overview content underneath it;
- the New Signal area uses more width and reads as a focused work surface rather than a narrow rail;
- the sidebar now shows Signals active only when `view=signals`.

### `/cases`

Current structure:

- sticky page header
- workflow checklist
- case management workbench
- selected case list + selected case detail
- triage and draft controls
- evidence, correspondence, and timeline areas
- create case drawer

Observed intent:

- selected case should stay the visual center of gravity
- evidence/correspondence/timeline can recede when not active
- triage and drafting stay advisory and linked to the selected case

Observed IA update:

- overview content is reserved for the overview/default view;
- the child views are focused and do not repeat the full parent overview stack underneath them.

### `/drafts`

Current structure:

- sticky page header
- workflow checklist
- draft workbench with segmented status modes:
  - Pending Red-Team
  - Passed
  - Needs Evidence
  - Rejected
- draft cards with:
  - body
  - evidence basis
  - assumptions
  - missing information
  - liability cautions
  - source IDs
  - red-team result
  - copy gate

Observed intent:

- make red-team state visible fast
- make safe-to-copy state impossible to miss
- keep copy manual and explicitly reviewed

Observed IA update:

- overview content is reserved for the overview/default view;
- child status views focus the selected work surface and no longer keep the full overview content visible underneath.

### `/settings/writing-style`

Current structure:

- sticky page header
- writing style editor
- current summary panel
- safety guardrail panel
- workflow checklist

Observed intent:

- tune draft calibration
- show that style cannot override evidence or safety
- link the profile back to drafts, cases, import, and assurance

Observed IA update:

- the page remains an overview/settings surface rather than a detailed workbench;
- the layout stays compact and the detailed workflow remains in the relevant downstream pages.

### Workspace correspondence pages

Current structure:

- sticky page header
- workspace summary
- workflow checklist
- compact workspace cards
- correspondence viewer
- filters
- selected thread detail
- triage panel
- draft panel
- thread timeline
- attachments
- possible related threads

Routes:

- `/vessels/lng-portharcourt-ii`
- `/vessels/lpg-alfred-temile`
- `/vessels/lpg-alfred-temile-10`
- `/projects`
- `/other`

Observed intent:

- route-specific thread visibility
- conservative threading
- collapse guidance/reference panels where possible
- make the next safe action obvious without hiding the thread itself

Observed IA update:

- vessel root routes behave as overview pages;
- vessel correspondence, cases, evidence, drafts, and assurance/support live behind child views;
- overview content should not repeat under child views.

## Reusable UI patterns

Documented reusable patterns already in the app:

- `StickyPageHeader`
- `CollapsibleSection`
- `WorkflowChecklist`
- `PageSectionTabs`
- status badges
- cards
- action buttons
- warning / fallback banners
- next-best-action panels
- segmented status tabs / filter pills

## Long-page pain points

Sprint 017 and Sprint 020B reduced page length in different ways, but the remaining pain points are now concentrated in the module pages:

- pages still run long when all guidance, filters, and reference content are open together
- import still has multiple lanes that can compete for attention
- assurance needs tighter grouping so evidence guardrails stay strong without feeling heavy
- cases needs the selected case to remain dominant while evidence and correspondence recede
- drafts needs review state to be readable faster at a glance
- writing-style needs a tighter summary-to-edit flow
- workspace pages need a clearer split between active correspondence and supporting reference
- the sidebar tree and page-level tabs need to keep child activation exclusive and obvious
- child views should not repeat the full overview content beneath the active surface
- important forms should not be trapped in narrow single-column layouts when desktop width is available

## Safety and workflow constraints

Figma and later Codex implementation must not weaken:

- access gate
- red-team copy gate
- no-send posture
- evidence-level guardrails
- safe-to-copy rules
- AI advisory-only posture
- persistence fallback honesty
- manual external copy only

The UI should make the next safe action obvious within five seconds, but it must not automate that action.

## Screenshot capture checklist

Capture the current interface before design changes:

- desktop full-page views for all major routes
- populated or selected states where relevant
- collapsed and expanded states where relevant
- AI-disabled and persistence-fallback states where relevant
- red-team copy gate state on `/drafts`
- mobile-width pass for dashboard, import, cases, and drafts

See `docs/UI_SCREENSHOT_CHECKLIST.md` for the full capture matrix.

## Handoff notes for design review

The Figma review should focus on:

- reducing visible clutter
- strengthening hierarchy
- preserving the current visual language
- keeping safety labels visible
- making the primary action obvious on each page
- letting secondary/reference panels recede
- improving selected-state treatment
- keeping active work distinct from background context
- keeping overview-only pages short enough to read quickly while child views stay focused
- preserving responsive form width so long text fields remain readable and safe on mobile
