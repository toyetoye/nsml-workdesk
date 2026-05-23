# Data Model

## Sprint 000

Use mock data only.

## Sprint 002 Intake Prototype

The import surface uses session-only React state for intake items during the current browser session.

Prototype intake objects should include:

- subject/title
- source type
- workspace assignment
- status
- sender/source
- received or created date-time
- body/content
- tags/topic
- route note or simulated workspace assignment note
- linked case placeholder
- created-from label

Prototype intake collections should support:

- recent intake or batch lists
- selected item detail views
- simulated route-to-workspace updates
- disabled case creation placeholders

No localStorage, persistence layer, backend routing, or real storage should be assumed for the Sprint 002 intake prototype.

## Sprint 003 Case Prototype

The cases surface uses session-only React state for seeded and newly created cases during the current browser session.

Prototype case objects should include:

- caseId
- title
- summary
- workspaceKey
- workspaceLabel
- vessel/project/other
- status
- priority
- category
- openedDate
- age
- dueLabel
- owner
- waitingOn
- nextAction
- riskNote
- linkedThreads
- linkedEvidence
- timelineEvents
- decisionRequired
- tags
- sourceIntakeRef
- workspaceHref

Prototype evidence objects should include:

- evidenceId
- title
- type
- source
- date
- linkedCaseId
- description
- status

Prototype case collections should support:

- compact case lists
- selected case detail panes
- session-only Create Case drawers or forms
- linked evidence cards
- linked correspondence tied to the selected case
- timeline or activity rails
- placeholder attach evidence actions
- placeholder create-from-intake references

No persistence, localStorage, backend import connection, real file storage, or real case storage should be assumed for the Sprint 003 case prototype.

## Sprint 004 Persistence Foundation

The persistence layer introduces typed database-backed records and safe repository helpers for the main work objects.

Primary persisted tables and records should include:

- `workspaces`
- `import_batches`
- `intake_items`
- `cases`
- `evidence_items`
- `correspondence_threads`
- `correspondence_messages`
- `case_evidence_links`
- `case_correspondence_links`
- `timeline_events`
- `decisions`
- `draft_responses_placeholder`
- `audit_logs`

Workspace records should capture confirmed workspace slugs and labels.

Import batch records should group intake activity and intake items.

Intake items should preserve pasted or staged source metadata, workspace assignment, status, sender/source, received or created time, body/content, tags, and routing notes.

Case records should preserve operational case metadata, status, priority, category, owner, waiting party, age/due indicators, next action, and decision state.

Evidence records should preserve metadata only for now, including the evidence type, source, date, linked case, description, and status.

Correspondence thread and message records should preserve subject, sender, recipients, cc, timestamps, message order, and links to cases.

Timeline event records should preserve activity order, event type, label, note, and timestamp for the active case.

Link tables should preserve case-to-evidence and case-to-correspondence relationships.

Decision, draft placeholder, and audit log tables provide foundation records for later workflow stages.

The app must continue to work when Supabase is not configured. In that case, repository helpers fall back to mock/session-compatible behavior and do not crash.

## Sprint 006 Private Evidence Storage

The evidence model gains private storage metadata and upload-state tracking for file evidence.

Evidence records should now also capture:

- original filename
- stored path or key
- MIME type
- file size
- source type
- workspace assignment
- linked intake item placeholder
- linked case placeholder
- uploaded or created date
- evidence status
- description or note
- storage state

Storage state should distinguish at least:

- staged
- uploaded
- metadata-only
- fallback-prototype

The private evidence bucket should be represented as `nsml-evidence-files` in storage configuration and deployment notes.

Evidence remains metadata-first in this sprint. The system must not claim to understand, parse, summarise, or validate file contents yet.

`/import` is the private evidence upload and staging area.
`/cases` is where the evidence record can be attached to the working case.

No public file URLs, no file preview, no direct client-side Supabase Storage writes, and no file parsing are assumed for this sprint.

## Sprint 007 EML Ingestion

The evidence and correspondence models gain parse-state tracking and source-linkage fields for server-side EML ingestion.

Evidence records should now also capture:

- parse status
- parse error
- parsed thread reference
- parsed message reference
- parsed timestamp

Correspondence thread records should now also capture:

- source evidence reference
- parse status
- parse error
- original filename
- message-id header
- in-reply-to
- references
- bcc
- safe body text
- sanitized or text-only HTML placeholder
- attachment metadata
- parsed timestamp

Correspondence message records should now also capture:

- source evidence reference
- recipients
- cc recipients
- bcc recipients
- subject
- message-id header
- in-reply-to
- references
- safe body text
- sanitized or text-only HTML placeholder
- attachment metadata
- parsed timestamp

Parse state should be represented with:

- not parsed
- parsing
- parsed
- failed
- unsupported

Evidence-to-thread linkage should preserve the original EML as the source artifact while making the parsed correspondence traceable back to the source evidence record.

Routing should remain deterministic and metadata-driven:

- case workspace wins if evidence is linked to a case;
- assigned workspace is used if no case link exists;
- Import/Staging or unclassified is used when workspace is unclear.

Parsed correspondence records must not imply raw HTML rendering or remote asset loading.

## Sprint 008 Correspondence Threading

Correspondence records gain thread-level organization fields and conservative relationship markers for operational use.

Thread-level correspondence should preserve:

- exact `message-id`, `in-reply-to`, and `references` linkage;
- a normalized subject for conservative fallback;
- sender and date metadata for safe relationship checks;
- possible-related thread markers when a hard merge is not safe;
- attachment count and attachment metadata at both thread and message level;
- source evidence linkage visibility;
- linked or unlinked case visibility;
- parse state and parse error visibility.

Thread grouping should remain conservative:

- exact header matches take priority;
- `references` should be treated as the strongest chain signal;
- subject-only matching is not enough for a hard merge;
- uncertain matches must stay separate and may only be surfaced as possible related threads.

The UI should continue to distinguish:

- `/import` staging or unclassified correspondence;
- workspace-scoped vessel, project, and general correspondence;
- archive planning placeholders without extraction;
- operational thread timeline view rather than a flat message dump.

## Sprint 009A AI Triage

The AI triage layer stores structured advisory results for selected source material.

Triage records should preserve:

- source type;
- source IDs;
- source label;
- source snapshot or trace payload;
- evidence_used references;
- suggested workspace, case title, and status;
- urgency level;
- missing information;
- recommended follow-up questions;
- suggested tags;
- should-create-case / should-prepare-draft-later flags;
- confidence;
- caution notes;
- provider and model metadata when persisted;
- persisted or session-only state.

Triage results must remain traceable to the selected intake item, thread, or case and any directly linked evidence or correspondence used in the request.

AI output must not mutate the source records automatically; any application of recommendations remains a later user-approved action.

## Sprint 009B Draft Generation

The draft generation layer stores structured advisory draft results for selected source material.

Draft records should preserve:

- draft_id;
- source type;
- source IDs;
- source label;
- source snapshot or trace payload;
- triage audit log ID when a triage result is used;
- triage source type and triage source IDs;
- intended recipient placeholder;
- subject placeholder;
- draft body;
- draft purpose;
- tone mode;
- evidence basis;
- assumptions;
- missing information;
- liability cautions;
- recommended attachments;
- status limited to `pending_red_team`, `needs_evidence`, or `blocked`;
- confidence;
- created_at;
- `must_be_red_teamed` always true;
- persisted or session-only state.

Draft results must remain traceable to the selected intake item, thread, or case and any directly linked evidence or correspondence used in the request.

Draft output must not mutate the source records automatically; any application of recommendations remains a later user-approved action after red-team review.

## Sprint 009C Red-Team Review

The red-team layer stores structured review results for generated drafts.

Red-team review records should preserve:

- review_id;
- draft_id;
- source_ids_reviewed;
- verdict;
- readiness_status;
- summary;
- unsupported_claims;
- liability_risks;
- technical_risks;
- tone_risks;
- missing_information;
- evidence_gaps;
- confidentiality_concerns;
- recommended_revisions;
- required_user_checks;
- safe_to_copy;
- confidence;
- reviewed_at;
- persisted or session-only state.

Red-team review records must preserve the same source references used for the draft so the trace from source -> draft -> red-team review stays visible.

Only `pass` and `pass_with_caution` may set `safe_to_copy` true. `revise`, `reject`, and `needs_more_evidence` must keep it false.

The review UI must show source IDs reviewed and the review findings before copy can be enabled.

## Sprint 010 Writing Style Profile

The writing-style layer stores structured profile data that is used as bounded guidance for draft calibration.

Writing style profile records should preserve:

- profile_id;
- profile_name;
- default_greeting;
- default_closing;
- preferred_tone;
- preferred_brevity;
- use_kindly;
- use_please_note;
- technical_directness;
- caution_level;
- stakeholder_tone_notes;
- preferred_phrases;
- phrases_to_avoid;
- liability_sensitive_wording_rules;
- draft_mode_guidance;
- is_active;
- persisted or session-only state;
- created_at;
- updated_at.

Stakeholder tone notes should support at least:

- vessel / captain / chief engineer;
- owner / charterer;
- class / surveyor;
- vendor / procurement;
- management.

Draft mode guidance should support at least:

- holding_statement;
- normal_technical_reply;
- firm_but_polite;
- management_summary;
- vessel_instruction;
- vendor_clarification;
- owner_charterer_sensitive.

Draft records should preserve style trace payload metadata so the selected writing style profile used for generation remains visible alongside the draft record.

The writing-style profile must remain a bounded calibration layer. It must not override evidence, missing information, liability controls, or red-team review.

## Sprint 015 Assurance Tracker

The assurance layer stores structured governance and action-tracking records that remain evidence-backed and neutral.

Assurance signal records should preserve:

- id;
- date_time;
- signal_title;
- signal_type;
- source_type;
- source_name_optional;
- audience;
- related_vessel_optional;
- related_department;
- summary;
- exact_comment_optional;
- evidence_level;
- confidence;
- operational_risk;
- reputational_risk;
- governance_risk;
- required_action;
- action_owner;
- due_date;
- status;
- evidence_links;
- notes;
- linked_case_id;
- created_at;
- updated_at.

Vessel support item records should preserve:

- id;
- vessel;
- issue_title;
- issue_description;
- date_raised;
- raised_by;
- category;
- priority;
- risk_level;
- superintendent_owner;
- vessel_owner;
- office_support_required;
- current_status;
- blocker_type;
- last_action_taken;
- last_contact_date;
- next_action;
- due_date;
- close_out_evidence;
- status;
- evidence_links;
- linked_case_id;
- source_signal_id;
- created_at;
- updated_at.

Vessel engagement log records should preserve:

- id;
- vessel;
- date_time;
- engagement_type;
- attendees;
- topics_discussed;
- actions_agreed;
- owner;
- due_date;
- follow_up_required;
- evidence_link;
- linked_case_id;
- linked_signal_id;
- linked_support_item_id;
- created_at;
- updated_at.

Assurance records must preserve the distinction between fact, reported statement, inference, and assumption. `Fact` requires evidence links or equivalent source support. If a Fact is submitted without evidence support, the save path must downgrade it to Reported rather than storing unsupported allegations as fact.

The weekly evidence pack should remain a deterministic structured view that composes existing assurance, support, and engagement records. It must not be AI-generated.

## Sprint 016 Bulk Outlook Evidence Intake

The bulk evidence intake layer stores batch-level archive records and per-item extraction / parse records for exported Outlook evidence.

Bulk evidence batch records should preserve:

- batch_id;
- batch_mode;
- workspace_assignment;
- source_label;
- status;
- total_files;
- eml_files_found;
- parsed_successfully;
- skipped;
- failed;
- unsupported;
- warnings;
- notes;
- linked_case_id;
- linked_assurance_signal_id;
- linked_support_item_id;
- original_archive_evidence_id;
- created_at;
- updated_at.

Bulk evidence batch item records should preserve:

- batch_item_id;
- batch_id;
- source_kind;
- file_name;
- source_path_in_archive;
- file_size_bytes;
- status;
- note;
- evidence_id;
- thread_id;
- message_id;
- parse_status;
- parse_error;
- created_at;
- updated_at.

Bulk evidence batch modes should support:

- selected-eml-files;
- zip-of-emls;
- pst-preservation;
- manual-email-fallback.

Bulk evidence batch status should support:

- staged;
- processing;
- completed;
- completed_with_warnings;
- failed.

Bulk evidence batch item status should support:

- parsed;
- skipped;
- failed;
- unsupported.

Batch records may link to a case, assurance signal, or vessel support item where safe, but they must not imply automatic workflow mutation.

The original ZIP may be preserved as evidence where safe, and extracted `.eml` files may be preserved or metadata-linked as evidence where safe.

PST uploads are preservation evidence only and must not be modeled as parsed correspondence in this sprint.

Imported email content is evidence of message content only; conclusions drawn from it must still be classified as Fact, Reported, Inference, or Assumption.

## Sprint 005 Access Gate and Safe Persistence Wiring

The access gate uses a single-user app-password flow with a signed HTTP-only session cookie.

Access gate records and helpers should support:

- login session creation;
- session verification;
- logout / cookie clearing;
- development fallback state;
- production fail-closed handling when env vars are missing.

The intake and case surfaces now use server actions plus repository helpers for write operations when safe.

Write-flow records should support:

- intake item submissions;
- case submissions;
- persisted save results with an explicit persisted-or-fallback distinction.

Client-side state remains the visible fallback when Supabase is not configured.

## Future Primary Objects

- Workspace
- Vessel
- Project
- Case
- Import Batch
- Email Thread
- Email Message
- Evidence Item
- Attachment
- Contact
- Organisation
- Task
- Decision
- Draft Response
- Red Team Review
- Alert
- Timeline Event
- Tag
- Audit Log
- Intake Prototype Item
- Intake Prototype Batch
- Case Record
- Evidence Record

## Future Relationships

Vessel -> Cases -> Evidence Items -> Draft Responses -> Red Team Reviews -> Final Approved Copy

Project -> Cases -> Tasks -> Decisions -> Evidence Items

Import Batch -> Emails / EMLs / Files -> Parsed Records -> Cases / Threads / Evidence

Import Intake Prototype -> Session State -> Intake List / Detail View -> Simulated Workspace Assignment -> Later Case Link

Case Prototype -> Session State -> Case List / Detail View -> Evidence / Correspondence / Timeline -> Later Import Link

Email Thread -> Messages -> Attachments -> Evidence Items

## Vessel Classification Safeguards

LPG ALFRED TEMILE and LPG ALFRED TEMILE 10 must be treated as separate workspaces unless manually changed later.

AT10 should map to LPG ALFRED TEMILE 10 by default.

Alfred Temile without 10 should not be blindly merged with AT10 if context is unclear.
