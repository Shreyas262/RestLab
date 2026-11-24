# Testing Strategy

**Status:** Accepted · **Last reviewed:** 2026-11-24
**Depends on:** `TECH_STACK.md` §7, `ARCHITECTURE.md` §12, `REQUIREMENTS.md`, `API_INTEGRATION.md`

## 1. Purpose

This document defines what RestLab tests, with which tools, at which layer, and what is required before a milestone counts as done. The aim is confidence in behavior that matters (error classification, normalization, proxy security) rather than a coverage number.

## 2. Principles

1. Test behavior, not implementation details.
2. Put logic where it is cheap to test. The layered structure keeps domain code free of React so it needs no rendering.
3. Tests never call live external APIs. Network behavior is mocked or faked.
4. Security-sensitive code gets tests before it is exposed.
5. Every functional requirement maps to at least one test.
6. A bug fix starts with a failing test.

## 3. Tooling

| Purpose                 | Tool                                     | Status                   |
| ----------------------- | ---------------------------------------- | ------------------------ |
| Test runner, unit tests | Vitest                                   | Present (`test`)         |
| Component tests         | React Testing Library in jsdom (ADR-019) | Present                  |
| End-to-end              | Playwright                               | Future scope             |
| Static checks           | TypeScript strict mode, ESLint           | Present (`strict: true`) |
| Formatting check        | Prettier                                 | Present (`format:check`) |

Scripts: `dev`, `build`, `start`, `lint`, `typecheck`, `format`, `format:check`, `test` (single run), `test:watch`.

Vitest environments: Node for domain, execution, and server tests; jsdom only for component tests. Vitest does not support async Server Components, so those are left to end-to-end tests.

## 4. Test Layers

### 4.1 Domain (`src/domain`)

Pure unit tests, no mocks needed.

- Request schemas: valid and invalid URLs, schemes, credentials in URLs, header names, JSON bodies, body types per method (GET never sends a body; DELETE body optional), duplicate parameters.
- URL building: parameter merging, encoding, disabled and empty-key rows skipped, preserved existing query strings.
- Response normalization and classification: JSON, text, empty, binary, missing content type, charset decoding.
- Parsing: valid JSON, malformed JSON (raw body and metadata kept), empty body.
- Error categories and failure codes: each maps to the correct category.
- JSON highlighter tokenizer: correct tokens for every JSON value type; output contains text only.
- Presets: every preset passes the request schema.

### 4.2 Execution (`src/execution`)

Unit tests with a fake `fetch`.

- Browser executor: a 200 response, 404 and 500 returned as responses (not failures), network rejection as `NETWORK_ERROR`, `TIMEOUT`, `CANCELLED`, `RESPONSE_TOO_LARGE`, `cache: "no-store"` set.
- Body is read exactly once.
- Size equals decoded bytes read.
- Proxy executor: maps the success envelope (including upstream 404) to a response; maps each failure code; maps a non-JSON reply from the endpoint to `INTERNAL_ERROR`.
- Both executors return the same result shape for equivalent inputs.

### 4.3 Server and proxy (`src/server`, Route Handler)

The highest-priority tests in the project. Written before the endpoint is reachable beyond local development.

- Destination policy matrix. Each row must be tested for both allow and block:
  - loopback, private, link-local (including `169.254.169.254`), unspecified, CGNAT, multicast, IPv6 equivalents, IPv4-mapped IPv6
  - alternative IPv4 notations (decimal, octal, hex, shortened)
  - credentials in URL, disallowed scheme, disallowed port
- Hostnames resolving to a blocked address, and to a mix of allowed and blocked addresses.
- DNS rebinding: a name that resolves to an allowed address at check time and a blocked one at connect time is refused.
- Redirects: to a blocked destination, to an allowed one, exceeding the hop limit.
- Timeout and oversized response handling.
- Incoming checks: wrong content type, cross-site `Sec-Fetch-Site` or `Origin`, oversized request.
- Header policy: nothing forwarded from the incoming request; hop-by-hop headers stripped; no header values in logs.
- Handler contract: invalid body returns `INVALID_REQUEST`; upstream errors return success envelopes; only `POST` accepted.
- Error messages leak no internal details.

DNS resolution and the upstream transport are injected, and replaced by controllable fakes in tests (`ARCHITECTURE.md` §6.5).

### 4.4 Components and features (`src/features`)

React Testing Library. Query by role and label, as users do, which doubles as an accessibility check.

- Request editor: add, edit, remove, enable, and disable parameter and header rows; final URL preview; body disabled for GET with content kept; validation messages appear; Send becomes Cancel while executing.
- Execution states: initial, executing, success, HTTP error, execution failure, cancelled, processing error each render distinctly and not by color alone.
- No permanent loading state after failure, timeout, or cancel.
- A result from an aborted request does not overwrite newer state.
- Response inspector: three tabs, keyboard operable; Body tab for JSON, text, empty, binary, and unparseable; copy action gives feedback.
- Strategy selector (M6): default is browser-direct; CORS hint after `NETWORK_ERROR`; strategy never changes on its own.
- Presets: loading one fills the editor; every field remains editable.
- Theme toggle: switches theme and writes the preference cookie.

### 4.5 End-to-end (future)

Playwright once the core flows are stable. Network is stubbed at the browser or server boundary, not live.

Candidate flows: configure and send with each method; HTTP error handling; strategy selection; preset use; theme persistence across reloads; responsive layouts at desktop, tablet, and mobile widths; keyboard-only operation.

## 5. Requirements Traceability

| Requirement                 | Primary test layers                   |
| --------------------------- | ------------------------------------- |
| FR-01 Request configuration | Domain, components                    |
| FR-02 Method support        | Domain, execution                     |
| FR-03 Presets               | Domain, components                    |
| FR-04 Execution             | Execution, components                 |
| FR-05 Response inspection   | Domain, components                    |
| FR-06 Error handling        | Domain, execution, server, components |
| FR-07 Application state     | Components                            |
| FR-08 Theme                 | Components, manual                    |
| NFR-04 Reliability          | Execution, components                 |
| NFR-05 Security             | Server, components (safe rendering)   |
| NFR-06 Accessibility        | Components, end-to-end, manual        |

Keep this table current when requirements change. Test names should reference the requirement they cover.

## 6. Conventions

- Tests sit next to the code they cover and are named `*.test.ts` or `*.test.tsx`.
- The extension selects the environment (Vitest projects in `vitest.config.mts`): `*.test.ts` runs in Node, `*.test.tsx` runs in jsdom with `src/test/setup.ts`. Hook and component tests use `.tsx`.
- Test files import `describe`, `test`, and `expect` from `vitest`; globals are off.
- Shared fixtures (sample responses, request configs) live in `src/test/`. Fixtures represent realistic API output, including large, malformed, and empty payloads.
- No snapshot tests for large rendered output. Assert on specific content.
- No arbitrary time delays. Use fake timers for timeout and duration tests.
- Mock only at boundaries (`fetch`, DNS, upstream transport). Do not mock domain functions to test other domain functions.

## 7. Manual Checks

Not all qualities are automated. Before the MVP is considered complete:

- Keyboard-only pass through the full workflow.
- Screen reader spot check of loading and error announcements.
- Contrast check in both light and dark themes.
- No flash of the wrong theme on reload.
- Resize and device check at desktop, tablet, and mobile widths.
- Behavior against the real example APIs, once each, to confirm presets still work. This is a manual check, not part of the automated suite.

## 8. Definition of Done for a Milestone or Feature

1. Tests for the new behavior written and passing.
2. Existing tests pass.
3. `lint`, `typecheck`, `format:check`, and `build` pass.
4. Requirements traceability updated if scope changed.
5. Affected documentation updated, including `PROGRESS.md` and `CHANGELOG.md`.
6. Changes left uncommitted for the project owner to review and commit.

## 9. Open Items

Tracked in `DECISIONS.md` §5 (OD-10 continuous integration, OD-11 coverage and automated accessibility checks).
