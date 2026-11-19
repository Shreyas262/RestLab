# Roadmap

**Status:** Draft v0.1 — 20 November 2026
**Depends on:** `PROJECT_OVERVIEW.md`, `REQUIREMENTS.md`

## 1. Purpose

This roadmap describes the intended direction of RestLab in phases. It sets order and intent, not dates. Detailed milestones and acceptance criteria live in `PROJECT_PLAN.md`; current status lives in `PROGRESS.md`.

RestLab is a portfolio project that may later become a public developer tool. There is no commitment to building a SaaS product, so nothing below assumes accounts or hosting infrastructure.

## 2. Guiding Constraints

- Simplicity over feature count. RestLab simplifies API experimentation rather than matching full API platforms.
- Each phase should leave the application in a usable, documented state.
- Anything beyond the MVP is evaluated against actual need before it is scheduled.
- Scope changes are recorded in `REQUIREMENTS.md` and `DECISIONS.md` first.

## 3. Phase 1: Foundation

Make the repository ready for feature work.

- Tooling and dependencies from `TECH_STACK.md` installed and configured.
- Repository documentation complete, including `AGENTS.md` and `README.md`.
- Scripts for linting, type checking, formatting, and testing.

## 4. Phase 2: MVP

Everything listed under "MVP Scope" in `REQUIREMENTS.md`:

- Request configuration (URL, method, parameters, headers, JSON and plain-text body).
- Request execution with browser-direct and backend proxy strategies.
- Response inspection (Overview, Body, Metadata) with JSON formatting and highlighting, and copy.
- Generic presets and public API examples.
- Distinct handling of validation, execution, HTTP, and processing outcomes.
- Responsive layout and accessibility baseline.
- A proxy with the security controls in `API_INTEGRATION.md` §6 in place.

## 5. Phase 3: Hardening and Quality

Raise confidence before sharing the tool more widely.

- End-to-end tests with Playwright.
- Accessibility review beyond the baseline.
- Performance work on large responses.
- Proxy abuse protections appropriate to the chosen deployment (rate limits, quotas).
- Public deployment and a polished README.

## 6. Phase 4: Candidate Enhancements

Listed in `PROJECT_OVERVIEW.md` §8 and not yet scheduled. Order depends on actual need.

| Enhancement | Notes |
|---|---|
| Request history | Introduces persistence. Needs a storage decision. The request model is already designed to be serializable |
| Saved requests | Builds on history and persistence |
| Collections and folders | Builds on saved requests |
| Authentication support | Requires care with credential handling in the browser and proxy |
| Environment variables | Substitution in URLs, headers, and bodies |
| cURL import and export | Depends on the request model staying stable |
| Response search and filtering | Particularly useful for large JSON |
| OpenAPI integration | Largest of the group |

## 7. Explicitly Out of Scope for Now

User accounts, cloud synchronization, and collaborative workspaces (`REQUIREMENTS.md` §5). These are not planned. Reconsider only if the project's direction changes, through a recorded decision.

## 8. Revisiting the Roadmap

Review after each milestone. Reordering, adding, or removing items is expected. Record meaningful changes in `CHANGELOG.md`.
