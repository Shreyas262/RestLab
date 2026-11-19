# Project Plan

**Status:** Draft v0.1 — 20 November 2026
**Depends on:** `ROADMAP.md`, `ARCHITECTURE.md`, `TESTING_STRATEGY.md`

## 1. Purpose

This plan breaks the MVP into milestones. Each milestone is sized to fit one feature conversation: it has a goal, deliverables, acceptance criteria, and the documents to update. Dates are intentionally omitted. Status is tracked in `PROGRESS.md`.

## 2. Working Method

- One milestone per feature conversation. Each begins with a review of `AGENTS.md`, `ARCHITECTURE.md`, `DECISIONS.md`, and `PROGRESS.md`, then agreement on scope and acceptance criteria before implementation.
- Official documentation is checked before version-sensitive implementation work.
- Each milestone ends with a `HANDOFF.md` (objective, status, files changed, decisions, concepts learned, dependency changes, test results, outstanding issues, docs to update, context for next).
- A milestone is done only when its acceptance criteria and the Definition of Done in `TESTING_STRATEGY.md` §8 are met.
- Milestone order below is a proposal and can be changed through discussion.

## 3. Milestones

### M0: Foundation

**Goal.** A repository ready for feature work.

**Deliverables**
- Replace `@tailwindcss/turbopack` with `@tailwindcss/postcss` and add the PostCSS config (ADR-003).
- Install React Hook Form, Zod, `@hookform/resolvers`.
- Initialize shadcn/ui.
- Install Vitest and React Testing Library; configure test environments.
- Install and configure Prettier.
- Confirm TypeScript strict mode.
- Add scripts: `test`, `test:watch`, `typecheck`, `format:check`.
- Confirm the React Compiler is enabled and lint covers its rules.
- Create `src/` folder skeleton per `ARCHITECTURE.md` §5.
- Fill `AGENTS.md` and `README.md`.

**Acceptance.** `dev`, `build`, `lint`, `typecheck`, and `test` all run cleanly on the skeleton.

### M1: Domain Core

**Goal.** The request and response domain, fully tested, with no UI.

**Deliverables**
- Request model and Zod schemas (ADR-006), URL building, header and body rules.
- Normalized response model, content-type classification, parsing, error categories (ADR-007, ADR-008).
- Execution result contract.

**Acceptance.** Domain tests in `TESTING_STRATEGY.md` §4.1 pass. No React or Next.js imports in `domain/`.

### M2: Browser Execution and State

**Goal.** Send a request from code and get a normalized result.

**Deliverables**
- Browser executor with timeout, abort, and no-store caching.
- Shared normalization applied to real fetch responses.
- Execution state machine hook (ADR-010).

**Acceptance.** Execution tests in §4.2 pass for the browser executor. HTTP errors are returned as responses, and network failures as failures.

### M3: Request Editor

**Goal.** Users can configure a request.

**Deliverables**
- URL input, method selector, Send button, execution strategy selector.
- Params, Headers, and Body tabs with add, edit, and remove.
- Validation feedback; Send disabled while executing.

**Acceptance.** Editor component tests pass. Fully keyboard operable with labeled controls.

### M4: Response Inspector

**Goal.** Users can inspect any outcome.

**Deliverables**
- Overview, Body, and Metadata tabs.
- JSON formatting and highlighting (library chosen after evaluation, recorded in an ADR), plain-text and fallback rendering, copy with feedback.
- Distinct displays for initial, loading, success, HTTP error, execution failure, and processing error.

**Acceptance.** Inspector component tests pass. Empty, malformed, and unsupported responses display usefully. Response content is never injected as HTML.

### M5: Presets

**Goal.** Quick starting points for common cases.

**Deliverables**
- Generic method-based templates.
- Public API examples (JSONPlaceholder, DummyJSON) verified against current documentation.
- Loading a preset fills the editor and everything stays editable.

**Acceptance.** All presets pass the request schema. Manual run of each example against its real API.

### M6: Backend Proxy

**Goal.** Safe proxy execution.

**Deliverables**
- `POST /api/execute` Route Handler and proxy executor (ADR-009 finalized).
- Destination policy, redirect handling, timeout, and size limits (`API_INTEGRATION.md` §6).
- Decision and ADR on pinning the validated address (`API_INTEGRATION.md` §8).

**Acceptance.** The full test matrix in `TESTING_STRATEGY.md` §4.3 passes before the endpoint is reachable beyond local development. Upstream errors arrive as responses, never as proxy failures.

### M7: Responsive Layout and Accessibility

**Goal.** A polished, usable interface across screen sizes.

**Deliverables**
- Resizable split layout on desktop; stacked layout on tablet and mobile.
- Focus indicators, contrast, and accessible loading and error announcements.
- No horizontal overflow with wide JSON and headers.

**Acceptance.** Manual checks in `TESTING_STRATEGY.md` §7 pass.

### M8: MVP Hardening

**Goal.** Meet the acceptance criteria in `REQUIREMENTS.md` §8.

**Deliverables**
- Large-response behavior and thresholds.
- Review of error messages for leaked detail.
- Documentation brought in line with the implementation.
- Rate limiting decision for the proxy based on deployment target.

**Acceptance.** Every criterion in `REQUIREMENTS.md` §8 is met and demonstrable.

## 4. Dependencies Between Milestones

M0 before everything. M1 before M2, M3, M4, M5, M6. M2 before M3 and M4 can be integrated. M6 depends on M1 and M2. M7 follows M3 and M4. M8 is last.

M3, M4, and M5 can proceed in either order once M1 and M2 are done.

## 5. Risks

| Risk | Mitigation |
|---|---|
| SSRF protection incomplete or bypassable | Test matrix first, proxy kept private until M6 acceptance, security review before public exposure |
| DNS rebinding cannot be closed with native Fetch | Early spike and ADR in M6; evaluate the dependency trade-off |
| CORS limits browser-direct usefulness | Clear UI hints; user-chosen proxy strategy; documented limits |
| Public example APIs change or go down | Presets treated as starting points; manual verification step; no live APIs in automated tests |
| Large responses freeze the UI | Thresholds and plain-text fallback in M8; lazy-load the highlighter |
| Version drift in Next.js, React, or Tailwind | Check official documentation before version-sensitive work; record upgrades |
| First production-level project: scope creep | Follow the roadmap; record scope changes before implementing them |

## 6. Out of Plan

Post-MVP items in `ROADMAP.md` §5 and §6 are not scheduled here.
