# Figma Design Brief

Sprint 018 is a refinement brief, not a redesign brief.

The purpose of this document is to hand the current NSML WorkDesk UI to Figma so that the interface can be sharpened without changing the workflow, safety model, or route surface.

## Product goal

NSML WorkDesk is an operational workdesk for:

- capturing evidence and correspondence;
- structuring imported material;
- linking items to cases and assurance records;
- drafting responses;
- red-team reviewing drafts;
- copying reviewed drafts manually when safe.

The refinement goal is to make the product feel:

- shorter;
- clearer;
- more sequential;
- easier to scan;
- more natural to move through;
- calmer under load.

## Design principles

1. Keep the existing visual language.
2. Refine the current product rather than redesigning it.
3. Preserve the safety model exactly as it exists now.
4. Keep active work visible.
5. Let secondary and reference content recede.
6. Make the next safe action obvious within five seconds.
7. Make one clear primary action per page.
8. Keep warnings, fallback states, and guardrails visible.
9. Improve hierarchy before adding new visual flair.
10. Treat status and safety labels as core UI, not decorative UI.

## Workflow to preserve

Capture -> Structure -> Link -> Decide -> Draft -> Review -> Copy

Figma should reinforce this path, not replace it.

## Page-by-page refinement targets

### Dashboard

Target:

- read more like an operations command centre
- show fewer, more actionable blocks
- emphasise the next step rather than all status at once
- keep urgent queues and key action cards prominent

### Import

Target:

- sequence the flow more clearly:
  - Capture
  - Bulk Import
  - Review Parsed Threads
  - Route / Link
- keep manual intake central
- reduce visual competition between bulk intake, evidence storage, and correspondence review

### Assurance

Target:

- keep Assurance Signals first-class
- make broad signal -> specifics -> support item -> engagement log -> weekly pack read as a clean progression
- preserve evidence-level guardrails and neutral wording
- keep the weekly pack structured but not overpowering

### Cases

Target:

- keep the selected case as the visual centre of gravity
- compress evidence, correspondence, and timeline reference content
- keep triage and draft actions easy to find
- keep case status and next action highly visible

### Drafts

Target:

- make red-team state readable immediately
- keep Pending Red-Team / Passed / Needs Evidence / Rejected visually distinct
- show safe-to-copy state clearly
- keep copy manual and obviously gated

### Writing Style

Target:

- make the profile feel like a practical calibration panel
- tighten summary-to-edit flow
- make the guardrail between style and safety obvious
- keep the page compact rather than prompt-editor-like

### Workspace correspondence pages

Target:

- keep route-specific correspondence visible
- make the active thread easy to identify
- let guidance and reference panels recede
- keep triage/draft controls close to the thread state

## Visual hierarchy expectations

Figma should aim for:

- one dominant headline or header per page
- one primary action per page
- secondary actions visually quieter than the primary action
- reference panels visually quieter than active work
- stronger selected-state treatment for:
  - selected case
  - selected thread
  - active tab
  - active filter
  - active workflow step

## What must not change

Do not change:

- access gate behavior
- red-team gate behavior
- copy safety rules
- no-send posture
- evidence-level guardrails
- advisory-only AI posture
- persistence fallback honesty
- route surface
- workflow order
- meaning of status labels
- meaning of warnings / fallback messages

## Figma constraints

- preserve the existing design language
- do not turn the product into a different class of app
- do not introduce a new visual system unless absolutely necessary
- do not hide safety labels or warnings
- do not make background/reference content feel more important than active work
- do not add new backend, AI, parsing, Outlook, or email capability

## Handoff rule for Codex

Later Codex implementation must map approved Figma changes back onto the existing shared components first:

- `StickyPageHeader`
- `CollapsibleSection`
- `WorkflowChecklist`
- status badges
- cards
- primary / secondary action buttons

Structure should be updated before visual polish. Safety should never be traded for a cleaner layout.

