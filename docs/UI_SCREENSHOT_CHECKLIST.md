# UI Screenshot Checklist

Use this checklist to capture the current UI before any Figma-led refinement.

Capture desktop and mobile views in the live app. The goal is to document the current structure, states, and safety surfaces exactly as they exist now.

## Desktop capture list

Capture these pages:

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

## Mobile capture list

Capture these pages at mobile width:

- `/dashboard`
- `/import`
- `/cases`
- `/drafts`

## Required states

For each relevant page, capture the following where it applies:

- default loaded state
- populated / selected state
- key expanded state
- key collapsed state
- AI-disabled state
- persistence-fallback state
- red-team copy gate state on `/drafts`

## Page-specific capture notes

### `/dashboard`

- default overview
- populated queue blocks
- collapsed workflow checklist
- sticky header visible

### `/import`

- default capture and intake view
- bulk evidence intake section
- parsed thread review section
- route / link section
- AI and persistence fallback banners if present

### `/assurance`

- default signals view
- support items view
- engagements view
- weekly evidence pack view
- expanded and collapsed guidance panels

### `/cases`

- selected case list + detail
- evidence section expanded
- correspondence section expanded
- timeline section expanded
- create case drawer
- AI-disabled state when relevant

### `/drafts`

- pending red-team view
- passed view
- needs evidence view
- rejected view
- draft card showing red-team verdict
- copy gate visible and disabled when not safe
- copy gate visible and enabled only when safe

### `/settings/writing-style`

- default profile view
- summary panel
- safety guardrails panel
- persisted profile or session-only fallback state

### Workspace correspondence pages

Capture at least one representative view for each:

- `/vessels/lng-portharcourt-ii`
- `/vessels/lpg-alfred-temile`
- `/vessels/lpg-alfred-temile-10`
- `/projects`
- `/other`

Show:

- selected thread
- active filters
- collapsed guidance panel
- triage panel
- draft panel

## Screenshot hygiene

- capture full-page desktop views where possible
- keep the active viewport readable
- do not crop away page headers or safety banners
- label images with route and state
- include notes for anything intentionally collapsed

