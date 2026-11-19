# Testing Strategy

**Status:** Draft v0.1 — 20 November 2026
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

| Purpose | Tool | Status |
|---|---|---|
| Test runner, unit tests | Vitest | MVP, not yet installed |
| Component tests | React Testing Library | MVP, not yet installed |
| End-to-end | Playwright | Future scope |
| Static checks | TypeScript strict mode, ESLint | ESLint present, strict mode to confirm |
| Formatting check | Prettier | Not yet installed |

Planned scripts (not yet present): `test`, `test:watch`, `typecheck`, `format:check`. Current scripts: `dev`, `build`, `start`, `lint`.

Vitest environments: plain Node for domain, execution, and server tests. A DOM environment only for component tests. Environment details are an implementation decision.

## 4. Test Layers

### 4.1 Domain (`src/domain`)

Pure unit tests, no mocks needed.

- Request schemas: valid and invalid URLs, schemes, header names, JSON bodies, method/body combinations, duplicate parameters.
- URL building: parameter merging, encoding, preserved existing query strings.
- Response normalization and classification: JSON, text, empty, binary, missing content type.
- Parsing: valid JSON, malformed JSON (raw body and metadata kept), empty body.
- Error categories: each maps to the correct category.
- Presets: every preset passes the request schema.

### 4.2 Execution (`src/execution`)

Unit tests with a fake `fetch`.

- Browser executor: a 200 response, 404 and 500 returned as responses (not failures), network rejection as failure, timeout, abort, no-store caching option set.
- Body is read exactly once.
- Size measured from bytes read, "unavailable" when not measurable.
- Proxy executor: maps the success envelope (including upstream 404) to a response; maps each failure code; handles a non-JSON reply from the endpoint.
- Both executors return the same result shape for equivalent inputs.

### 4.3 Server and proxy (`src/server`, route handler)

The highest-priority tests in the project. Written before the endpoint is reachable beyond local development.

- Destination policy matrix. Each row must be tested for both allow and block:
  - loopback, private, link-local (including `169.254.169.254`), unspecified, CGNAT, multicast, IPv6 equivalents, IPv4-mapped IPv6
  - alternative IPv4 notations (decimal, octal, hex, shortened)
  - credentials in URL, disallowed scheme, disallowed port
- Hostnames resolving to a blocked address, and to a mix of allowed and blocked addresses.
- Redirects: to a blocked destination, to an allowed one, exceeding the hop limit.
- Timeout and oversized response handling.
- Header policy: nothing forwarded from the incoming request; hop-by-hop headers stripped; no header values in logs.
- Handler contract: invalid body returns `INVALID_REQUEST`; upstream errors return success envelopes; only `POST` accepted.
- Error messages leak no internal details.

DNS resolution is replaced by a controllable fake in tests.

### 4.4 Components and features (`src/features`)

React Testing Library. Query by role and label, as users do, which doubles as an accessibility check.

- Request editor: add, edit, remove parameter and header rows; method change affects body availability; validation messages appear; Send disabled while executing.
- Execution states: initial, executing, success, HTTP error, execution failure, processing error each render distinctly and not by color alone.
- No permanent loading state after failure or abort.
- Response inspector: three tabs, keyboard operable; Body tab for JSON, text, empty, binary, and unparseable; copy action gives feedback.
- A stale response from an aborted request does not overwrite newer state.
- Presets: loading one fills the editor; every field remains editable.

### 4.5 End-to-end (future)

Playwright once the core flows are stable. Network is stubbed at the browser or server boundary, not live.

Candidate flows: configure and send with each method; HTTP error handling; strategy selection; preset use; responsive layouts at desktop, tablet, and mobile widths; keyboard-only operation.

## 5. Requirements Traceability

| Requirement | Primary test layers |
|---|---|
| FR-01 Request configuration | Domain, components |
| FR-02 Method support | Domain, execution |
| FR-03 Presets | Domain, components |
| FR-04 Execution | Execution, components |
| FR-05 Response inspection | Domain, components |
| FR-06 Error handling | Domain, execution, server, components |
| FR-07 Application state | Components |
| NFR-04 Reliability | Execution, components |
| NFR-05 Security | Server, components (safe rendering) |
| NFR-06 Accessibility | Components, end-to-end, manual |

Keep this table current when requirements change. Test names should reference the requirement they cover.

## 6. Conventions

- Tests sit next to the code they cover and are named `*.test.ts` or `*.test.tsx`.
- Shared fixtures (sample responses, request configs) live in one test-support location. Fixtures represent realistic API output, including large, malformed, and empty payloads.
- No snapshot tests for large rendered output. Assert on specific content.
- No arbitrary time delays. Use fake timers for timeout and duration tests.
- Mock only at boundaries (`fetch`, DNS). Do not mock domain functions to test other domain functions.

## 7. Manual Checks

Not all qualities are automated. Before the MVP is considered complete:

- Keyboard-only pass through the full workflow.
- Screen reader spot check of loading and error announcements.
- Contrast check in the final theme.
- Resize and device check at desktop, tablet, and mobile widths.
- Behavior against the real example APIs, once each, to confirm presets still work. This is a manual check, not part of the automated suite.

## 8. Definition of Done for a Feature

1. Tests for the new behavior written and passing.
2. Existing tests pass.
3. `lint` and `typecheck` pass.
4. Requirements traceability updated if scope changed.
5. Documentation updates listed in `HANDOFF.md`.

## 9. Open Items

- Coverage reporting: decide whether to track it as information only. No numeric target for the MVP.
- Continuous integration: define which scripts run on each push.
- DOM environment choice for component tests.
- Whether to add automated accessibility checks to component or end-to-end tests.
