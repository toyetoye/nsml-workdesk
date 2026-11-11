# Maintenance 003 — JSX lint baseline

Status: Small maintenance candidate for human review. Not an approved feature sprint or deployment.
Base: main at `1b15fbc56c64d47f0bc060cf7d2d43cd8f84d2eb` (checked 2026-11-11).

## Objective

Clear the two existing `react/no-unescaped-entities` errors reported in the WorkDesk Scout instruction on the Morning screen, without changing the text shown to users. This addresses the residual lint blocker already recorded under WD-003 in draft PR #1's prioritized backlog; it does not add a duplicate backlog item or change the backlog's ordering.

## Strict scope

Replace two literal quotation marks in a single JSX text paragraph with JSX-safe `&quot;` entities. Do not change correspondence capture, permissions, vessel routing, evidence, AI reviews, operational status, case closure, configuration, integrations, or deployment. Do not clean unrelated lint warnings under this candidate. No new domain rule or product decision is implied.

No live data, mailboxes, credentials, sensitive audit content, or production security testing is needed. Human approval is required before merge or deployment.
