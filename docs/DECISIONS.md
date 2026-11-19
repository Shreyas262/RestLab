# Decisions

**Status:** Draft v0.1 — 20 November 2026

## 1. Purpose

This file records significant architectural and project decisions as Architecture Decision Records (ADRs). It captures what was decided, why, and what follows from it, so later work does not reopen settled questions without a reason.

Related documents: `ARCHITECTURE.md`, `SYSTEM_DESIGN.md`, `TECH_STACK.md`.

## 2. How to Use This File

- One ADR per decision. Number sequentially. Never renumber.
- **Status:** Proposed, Accepted, or Superseded by ADR-NNN.
- Do not edit an accepted ADR to change its decision. Write a new ADR that supersedes it and update the old one's status.
- Keep each record short. Link to other documents rather than copying them.

Template:

```
## ADR-NNN: Title
- Status:
- Date:
- Context:
- Decision:
- Consequences:
- Alternatives considered:
```

## 3. Index

| ADR | Title                                                      | Status   |
| --- | ---------------------------------------------------------- | -------- |
| 001 | Use a `src/` directory                                     | Accepted |
| 002 | Keep documentation in root `docs/`                         | Accepted |
| 003 | Integrate Tailwind through `@tailwindcss/postcss`          | Accepted |
| 004 | Enable React Compiler; no manual memoization by default    | Accepted |
| 005 | Hybrid execution with explicit strategy selection          | Accepted |
| 006 | One request model with shared Zod schemas                  | Accepted |
| 007 | Preserve raw response; derive parsed data separately       | Accepted |
| 008 | Separate error categories; HTTP errors are responses       | Accepted |
| 009 | Proxy envelope separates proxy status from upstream status | Proposed |
| 010 | Execution state machine with per-execution abort           | Accepted |
| 011 | Minimal dependencies: native Fetch, no Redux               | Accepted |
| 012 | Layered structure with enforced dependency direction       | Accepted |

## 4. Records

## ADR-001: Use a `src/` directory

- Status: Accepted
- Date: 2026-11-20
- Context: Next.js treats `src/` as optional and is unopinionated about where application code lives. The repository already uses `src/app`.
- Decision: All application code lives under `src/`. Configuration and `docs/` stay at the repository root.
- Consequences: Import aliases and tooling paths must point at `src/`. Config files remain visually separate from application code.
- Alternatives considered: Root-level `app/` and shared folders.

## ADR-002: Keep documentation in root `docs/`

- Status: Accepted
- Date: 2026-11-20
- Context: The documentation strategy names `/docs` as the single source of truth. The docs were briefly under `src/docs/`.
- Decision: Documentation lives in `docs/` at the repository root.
- Consequences: Docs are not part of the application source tree. The documentation strategy needs no change.
- Alternatives considered: Keeping `src/docs/` and amending the strategy.

## ADR-003: Integrate Tailwind through `@tailwindcss/postcss`

- Status: Accepted
- Date: 2026-11-20
- Context: `package.json` listed `@tailwindcss/turbopack`. The official Next.js and Tailwind installation guides use `@tailwindcss/postcss` with a `postcss.config.mjs`. The project rule is to follow official documentation for version-sensitive setup.
- Decision: Follow the official guides. Use `@tailwindcss/postcss`.
- Consequences: Remove `@tailwindcss/turbopack`, install `@tailwindcss/postcss` and `postcss`, and add `postcss.config.mjs`. Check the guide again at the time of the change, since the installed versions are recent.
- Alternatives considered: Keeping `@tailwindcss/turbopack`, rejected because it is not in the official guides.

## ADR-004: Enable React Compiler; no manual memoization by default

- Status: Accepted
- Date: 2026-11-20
- Context: `babel-plugin-react-compiler` is installed and the project owner confirmed it is enabled.
- Decision: Rely on React Compiler for memoization. Do not add `useMemo`, `useCallback`, or `memo` unless profiling shows a need.
- Consequences: Components must follow the Rules of React so the compiler can optimize them. Any manual memoization added later needs a measured justification. Build or lint output should be checked for compiler bailouts on critical components.
- Alternatives considered: Manual memoization throughout.

## ADR-005: Hybrid execution with explicit strategy selection

- Status: Accepted
- Date: 2026-11-20
- Context: Browser-direct execution is simple but blocked by CORS for many APIs. A backend proxy avoids CORS but adds latency and SSRF risk. API source (predefined or user URL) does not determine which strategy works. See `SYSTEM_DESIGN.md` §3 and §5.
- Decision: Support both strategies. The user selects the strategy explicitly. The application never switches strategy silently after a failure.
- Consequences: The UI needs a strategy selector. Guidance (such as a CORS hint) may be shown but must not change the strategy on its own. The proxy must be hardened before it is exposed beyond development.
- Alternatives considered: Proxy-only; browser-only; automatic fallback from browser to proxy.

## ADR-006: One request model with shared Zod schemas

- Status: Accepted
- Date: 2026-11-20
- Context: The UI edits URL, method, parameters, headers, and body in separate sections, but execution, presets, and validation need one consistent representation.
- Decision: Define one domain-level request model. Express its validation as Zod schemas used by React Hook Form on the client and re-applied by the Route Handler on the server.
- Consequences: Client validation is a convenience; server validation is the control. Presets are data conforming to the same model. Schemas live in the domain layer with no React or Next.js imports.
- Alternatives considered: Separate form and execution models; client-only validation.

## ADR-007: Preserve raw response; derive parsed data separately

- Status: Accepted
- Date: 2026-11-20
- Context: The native Fetch `Response` has a one-time-consumable body and is not a serializable domain object. Parsing can fail.
- Decision: Read the body once and store it raw. Derive parsed data separately and only when parsing succeeds. Use one normalized response shape for both strategies, produced by a shared normalization function.
- Consequences: A parse failure never discards the raw body or metadata. Size and some headers may be unmeasurable in browser-direct mode and must be shown as unavailable rather than zero.
- Alternatives considered: Passing the Fetch `Response` through the application; parsing before storing.

## ADR-008: Separate error categories; HTTP errors are responses

- Status: Accepted
- Date: 2026-11-20
- Context: A 404 or 500 is a valid HTTP response. Network failures, validation problems, and parsing problems are different situations that the user needs to tell apart.
- Decision: Keep four categories distinct: validation, execution, response-processing, and HTTP error response. HTTP error responses are normal responses, not failures. Validation errors never produce an execution result.
- Consequences: Types must keep these categories separate. The UI shows distinct states for each. Error messages must not expose internal details. See `ARCHITECTURE.md` §11.
- Alternatives considered: A single error type covering all failures.

## ADR-009: Proxy envelope separates proxy status from upstream status

- Status: Proposed
- Date: 2026-11-20
- Context: If the proxy returned the upstream status as its own transport status, an upstream 404 would be indistinguishable from a missing proxy route, which breaks ADR-008.
- Decision (proposed): A successful proxy call returns a normalized response, including upstream 4xx and 5xx. Proxy-level problems (invalid request, blocked destination, timeout, unreachable upstream) use a separate failure shape. The proxy executor maps both into the same execution result as the browser executor.
- Consequences: Defines the proxy contract the client and server must both follow. The exact field layout, status codes, and failure identifiers are still to be decided.
- Alternatives considered: Passing the upstream status through as the proxy's HTTP status.

## ADR-010: Execution state machine with per-execution abort

- Status: Accepted
- Date: 2026-11-20
- Context: Requirements call for loading feedback, prevention of duplicate submissions, and no permanent loading state after failures. Overlapping requests could otherwise let a stale response overwrite newer state.
- Decision: Model execution as a small state machine (idle, executing, completed with a result) owned by one hook. Create an `AbortController` per execution. Disable Send while executing.
- Consequences: A cancelled or superseded request cannot update state. Timeouts and aborts need to map to execution errors. The state shape is easy to test without rendering components.
- Alternatives considered: Independent boolean flags for loading and error; disabling the button only.

## ADR-011: Minimal dependencies: native Fetch, no Redux

- Status: Accepted
- Date: 2026-11-20
- Context: `TECH_STACK.md` requires dependencies to be justified by actual requirements. The MVP has no persistence and a small state surface.
- Decision: Use native Fetch in both the browser and the Route Handler. Use React state and Hook Form for state, with Context only if props cannot reasonably carry shared state. Do not use Redux or an HTTP client library for the MVP.
- Consequences: Timeouts, aborts, and body handling are written against Fetch directly. Revisit only if a demonstrated need appears.
- Alternatives considered: Redux Toolkit; Axios or similar HTTP client.

## ADR-012: Layered structure with enforced dependency direction

- Status: Accepted
- Date: 2026-11-20
- Context: The design requires domain logic independent of React, both execution strategies sharing one result contract, and server-only code kept out of the client bundle.
- Decision: Keep `app/` for routing only. Place domain, execution, server, and feature code in separate folders under `src/`, with the import directions defined in `ARCHITECTURE.md` §4.
- Consequences: Domain code is unit-testable without React. Violations of import direction should be caught by lint rules or review. The enforcement mechanism for server-only code is a pending decision.
- Alternatives considered: Colocating logic inside route folders; a flat shared folder.

## 5. Pending Decisions

These are open items from `ARCHITECTURE.md` §13 that will become ADRs when decided.

| Topic                    | Notes                                            |
| ------------------------ | ------------------------------------------------ |
| Server-only enforcement  | Build-time failure versus convention             |
| Proxy envelope contract  | Finalize ADR-009                                 |
| Proxy limits             | Timeout, maximum body size, redirect policy      |
| SSRF control set         | Destination rules, DNS rebinding handling        |
| Size measurement         | Browser versus server, headers versus bytes read |
| Syntax highlighter       | Bundle size, performance, maintenance            |
| Large-response threshold | Highlighting and display fallback                |
| Binary response handling | Display and size behavior                        |
