# Design System Notes

Sprint 018 captures the current design-system behaviour of NSML WorkDesk so Figma can refine the interface without changing the product model.

## Shared components

### StickyPageHeader

Role:

- sticky page-level header for major protected pages

Current behavior:

- page title and description
- optional current context line
- primary action
- secondary actions
- quick links to next workflow steps
- sticky positioning below the top bar

Observed usage:

- dashboard
- import
- assurance
- cases
- drafts
- writing-style
- workspace correspondence pages

### CollapsibleSection

Role:

- collapse secondary, reference, or guidance content while keeping it available

Current behavior:

- details / summary pattern
- default-open or collapsed
- optional badge in the summary row
- used to reduce page length without hiding important content

### WorkflowChecklist

Role:

- next-best-action guidance and workflow mapping

Current behavior:

- step-based guidance
- optional clickable action per step
- optional quick links
- optional note chip
- optional collapsible wrapper

### Status badges

Role:

- compact semantic state labels

Current usage:

- status, priority, evidence level, parse state, persistence state, AI state, red-team state, safe-to-copy state, and workflow state

### Cards

Role:

- grouped content containers for lists, stats, summaries, and active items

Current usage:

- dashboard blocks
- case list/detail containers
- assurance summaries
- draft cards
- bulk intake batches
- writing-style summary and safety panels

### Action buttons

Role:

- primary action, secondary action, and disabled action hierarchy

Current usage:

- primary action per page
- quieter secondary actions
- disabled placeholder buttons for future or blocked actions

### Warning / fallback banners

Role:

- honest state communication for AI, persistence, access gate, storage, and workflow safety

Current usage:

- AI unavailable
- persistence unavailable
- development fallback
- no-send posture
- copy-gate warnings
- evidence/storage fallback

### Next-best-action panels

Role:

- show one clear recommended next step without automating it

Current usage:

- dashboard
- import
- assurance
- cases
- drafts
- writing style
- workspace pages

### Segmented status tabs / filter pills

Role:

- let the user move through a focused subset of state without scrolling a long list

Current usage:

- draft status views
- workspace / status filters
- some queue and mode switchers

### Dashboard overview pattern

Role:

- keep the dashboard as a short overview and navigation surface rather than a workbench

Current behavior:

- high-level overview cards only
- clickable module cards
- small attention strip limited to highest-priority items
- no workflow checklist, detailed queues, recent import detail, vessel snapshots, or secondary status groups on the dashboard
- CoS Assistant rail hidden on the dashboard surface

### Navigation tree and section tabs

Role:

- give the shell a major-area / child-view structure without flattening the whole app into one list

Current behavior:

- collapsible parent sections in the sidebar
- route-aware auto-expansion for active parents
- exclusive active child highlighting
- page-level section tabs for overview/default and child views
- mobile bottom navigation remains top-level only
- child navigation stays inside the page surface rather than overloading the shell

## Visual tokens

These are the current visual behaviors that should be preserved and refined, not replaced.

### Spacing

- content spacing is moderate and consistent
- headers and sections typically use 4 to 6 units of spacing between major blocks
- cards often use 12 to 20 px of internal spacing

### Radius

- cards and panels use small to medium radius
- controls and pills are rounded, but not pill-shaped everywhere

### Borders

- light slate borders define panels, cards, and field groups
- dashed borders are used for empty states and placeholder surfaces
- warnings use tinted border treatment rather than heavy fills

### Padding

- page-level content uses compact but readable padding
- sticky headers keep enough space for title, context, and action rows without crowding

### Width

- primary app content is centered in a wide content area
- page descriptions and helper text typically max out at a readable line length
- sidebar and top bar establish the shell boundaries
- overview pages should stay compact
- child views should use available desktop width without becoming visually dense

### Sticky offset

- sticky page headers sit below the top bar
- the top bar itself is sticky at the top of the shell

### Z-index layering

- top bar must remain above page content
- page-level sticky headers must remain above the page body but below the global top bar

### Typography hierarchy

- page title
- section title
- helper description
- label / caption
- status text

The hierarchy should stay clear enough that the user can tell what matters first without reading every line.

### Status colours

Semantic colors currently represent:

- accent / success / safe
- warning / caution / needs attention
- danger / blocked / unsupported / unsafe
- neutral / informational / not yet selected

### Button hierarchy

- primary actions are filled and obvious
- secondary actions are lighter bordered controls
- disabled actions should still be visibly styled as controls

### Icon usage

- icons appear inside buttons, badges, and page sections when they help orientation
- icon use should remain supportive, not decorative

## Behaviour tokens

### Default-open versus collapsed sections

- default-open: only the most important active section should open by default
- collapsed: secondary/reference/guidance content should recede unless the user opens it

### Selected item / case / thread highlighting

- the selected item should be visually stronger than the list around it
- active context must be obvious in list views and detail views
- only one child item should be active at a time
- overview is active only on overview/default views

### AI configured versus AI unavailable

- AI controls should clearly show whether they are ready or unavailable
- unavailable AI should never look like a success state

### Persistence available versus session fallback

- persistence state should be visible and honest
- session-only fallback must be explicit

### Safe-to-copy versus not-safe-to-copy

- drafts that are not safe to copy must never look copy-ready
- reviewed drafts that are safe to copy should be obvious, but still manual

### Dashboard overview versus module detail

- dashboard content should stay high-level and click-through only
- detailed operational work belongs inside `/import`, `/assurance`, `/cases`, `/drafts`, and workspace pages
- dashboard cards should never become send, copy, AI action, or automatic workflow controls

### Overview versus child work surfaces

- parent routes act as overview pages
- child views show only the selected work surface
- overview content should not remain visible underneath child tabs
- forms should use responsive desktop grids where the content benefits from width
- long text fields should stay full width, while short structured fields can share columns

## Implementation guidance for later Codex work

- update shared components first
- keep the current workflow model unchanged
- do not alter access, red-team, or copy safety
- let Figma refine hierarchy and spacing before introducing new visual patterns
- prefer consolidation over creating page-specific one-off widgets
- keep the dashboard overview-only and move detailed work into the module pages
