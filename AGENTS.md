# NSML WorkDesk Agent Instructions

This repo is the source of truth for NSML WorkDesk.

Do not rely on chat history as project memory. Read the repo markdown files first.

## Product

NSML WorkDesk is a private single-user web platform for managing NSML-related vessel work, projects, correspondence, evidence, decisions, and draft responses.

It is not an Outlook clone. It is an operations command centre.

## Confirmed workspaces

1. LNG PORTHARCOURT II
2. LPG ALFRED TEMILE
3. LPG ALFRED TEMILE 10
4. Projects
5. Other / General Issues

Dashboard is the landing page.

## Hard boundaries

Do not build Outlook integration in v1.
Do not build automatic email sending.
Do not build multi-user collaboration.
Do not merge LPG ALFRED TEMILE and LPG ALFRED TEMILE 10.
Do not add AI workflows before the approved AI sprint.
Do not invent business rules.
Do not treat AI outputs as final without red-team review.

## Build method

Architect first. Builder second.
Each sprint must have requirements, blueprint, acceptance criteria, and handoff.
The builder must only build the approved sprint scope.
