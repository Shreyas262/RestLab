# Decisions

**Status:** Living document · **Last reviewed:** 2026-11-27

## 1. Purpose

This file records significant architectural and project decisions as Architecture Decision Records (ADRs). It captures what was decided, why, and what follows from it, so later work does not reopen settled questions without a reason. It also holds the single register of decisions that are still open (§5).

Related documents: `ARCHITECTURE.md`, `SYSTEM_DESIGN.md`, `TECH_STACK.md`, `API_INTEGRATION.md`.

## 2. How to Use This File

- One ADR per decision. Number sequentially. Never renumber.
- **Status:** Proposed, Accepted, or Superseded by ADR-NNN.
- Do not edit an accepted ADR to change its decision. Write a new ADR that supersedes it and update the old one's status. Factual corrections to context are allowed as a dated note.
- Keep each record short. Link to other documents rather than copying them.
- When an open item in §5 is decided, write the ADR and remove the item from §5.

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

| ADR | Title                                                        | Status   |
| --- | ------------------------------------------------------------ | -------- |
| 001 | Use a `src/` directory                                       | Accepted |
| 002 | Keep documentation in root `docs/`                           | Accepted |
| 003 | Integrate Tailwind through `@tailwindcss/postcss`            | Accepted |
| 004 | Enable React Compiler; no manual memoization by default      | Accepted |
| 005 | Hybrid execution with explicit strategy selection            | Accepted |
| 006 | One request model with shared Zod schemas                    | Accepted |
| 007 | Preserve raw response; derive parsed data separately         | Accepted |
| 008 | Separate error categories; HTTP errors are responses         | Accepted |
| 009 | Proxy envelope separates proxy status from upstream status   | Accepted |
| 010 | Execution state machine with per-execution abort             | Accepted |
| 011 | Minimal dependencies: native Fetch, no Redux                 | Accepted |
| 012 | Layered structure with enforced dependency direction         | Accepted |
| 013 | Enforce server-only code with `import "server-only"`         | Accepted |
| 014 | Response size is the decoded body bytes read                 | Accepted |
| 015 | In-house JSON highlighting, no library                       | Accepted |
| 016 | Keep Cache Components and Partial Prefetching enabled        | Accepted |
| 017 | Optional body for DELETE; GET never sends a body             | Accepted |
| 018 | Theme toggle with a preference cookie                        | Accepted |
| 019 | Vitest with jsdom for component tests                        | Accepted |
| 020 | Browser-direct by default; strategy selector ships with M6   | Accepted |
| 021 | Enforce import direction with ESLint `no-restricted-imports` | Accepted |
| 022 | Continuous integration with GitHub Actions                   | Accepted |

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
- Context: Documentation is the single source of truth for the project. The docs were briefly under `src/docs/`.
- Decision: Documentation lives in `docs/` at the repository root and is tracked in Git.
- Consequences: Docs are not part of the application source tree.
- Alternatives considered: Keeping `src/docs/`.

## ADR-003: Integrate Tailwind through `@tailwindcss/postcss`

- Status: Accepted
- Date: 2026-11-20
- Context: `package.json` listed `@tailwindcss/turbopack`. The official Next.js and Tailwind installation guides use `@tailwindcss/postcss` with a `postcss.config.mjs`. The project rule is to follow official documentation for version-sensitive setup.
- Decision: Follow the official guides. Use `@tailwindcss/postcss`.
- Consequences: Remove `@tailwindcss/turbopack` and the `turbopack.rules` entry in `next.config.ts`, install `@tailwindcss/postcss` and `postcss`, and add `postcss.config.mjs`. Check the guide again at the time of the change, since the installed versions are recent.
- Alternatives considered: Keeping `@tailwindcss/turbopack`.
- Note (2026-11-24): `@tailwindcss/turbopack` is an official Tailwind Labs package (repository `tailwindlabs/tailwindcss`), so the original reason "not in the official guides" was imprecise. The decision stands because the Next.js 16.4.6 CSS guide (`node_modules/next/dist/docs/01-app/01-getting-started/11-css.md`) documents `@tailwindcss/postcss`.

## ADR-004: Enable React Compiler; no manual memoization by default

- Status: Accepted
- Date: 2026-11-20
- Context: `babel-plugin-react-compiler` is installed and `reactCompiler: true` is set in `next.config.ts`.
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
- Consequences: A parse failure never discards the raw body or metadata. Some headers are not visible in browser-direct mode and are shown as a limitation, not as empty data. Size measurement is defined in ADR-014.
- Alternatives considered: Passing the Fetch `Response` through the application; parsing before storing.

## ADR-008: Separate error categories; HTTP errors are responses

- Status: Accepted
- Date: 2026-11-20
- Context: A 404 or 500 is a valid HTTP response. Network failures, validation problems, and parsing problems are different situations that the user needs to tell apart.
- Decision: Keep four categories distinct: validation, execution, response-processing, and HTTP error response. HTTP error responses are normal responses, not failures. Validation errors never produce an execution result.
- Consequences: Types must keep these categories separate. The UI shows distinct states for each. Error messages must not expose internal details. See `ARCHITECTURE.md` §11.
- Alternatives considered: A single error type covering all failures.

## ADR-009: Proxy envelope separates proxy status from upstream status

- Status: Accepted
- Date: 2026-11-20; accepted 2026-11-24; field names fixed 2026-11-26
- Context: If the proxy returned the upstream status as its own transport status, an upstream 404 would be indistinguishable from a missing proxy route, which breaks ADR-008.
- Decision: A successful proxy call returns HTTP 200 with a normalized response, including upstream 4xx and 5xx. Proxy-level problems return a separate failure shape carrying a failure code from the shared set in `API_INTEGRATION.md` §5. The proxy executor maps both into the same execution result as the browser executor.
- Consequences: Defines the proxy contract the client and server must both follow. Exact field names are fixed when the types are written in M1.
- Alternatives considered: Passing the upstream status through as the proxy's HTTP status.
- Note (2026-11-26, closes OD-1): The envelope is `{ ok: true, response }` or `{ ok: false, error }`, where `error` is a `Failure` (`code`, `message`). The client-side `ExecutionResult` is `{ kind: "response", response }` or `{ kind: "failure", failure, strategy }`. Different discriminants keep the wire format and the internal result from being confused. Types live in `src/execution/contract`.

## ADR-010: Execution state machine with per-execution abort

- Status: Accepted
- Date: 2026-11-20
- Context: Requirements call for loading feedback, prevention of duplicate submissions, cancellation, and no permanent loading state after failures. Overlapping requests could otherwise let a stale response overwrite newer state.
- Decision: Model execution as a small state machine (idle, executing, completed with a result) owned by one hook. Create an `AbortController` per execution. Disable Send while executing. Cancel and unmount abort the current execution.
- Consequences: A cancelled or superseded request cannot update state. Timeouts and aborts map to the `TIMEOUT` and `CANCELLED` failure codes. The state shape is easy to test without rendering components.
- Alternatives considered: Independent boolean flags for loading and error; disabling the button only.
- Note (2026-11-27): "Disable Send while executing" is implemented as one button that reads Cancel while executing (`UI_UX_GUIDELINES.md` §3), and the hook ignores any Send that arrives before the current execution settles. Cancel settles the state to `CANCELLED` at once, without waiting for the executor.

## ADR-011: Minimal dependencies: native Fetch, no Redux

- Status: Accepted
- Date: 2026-11-20
- Context: `TECH_STACK.md` requires dependencies to be justified by actual requirements. The MVP has no persistence and a small state surface.
- Decision: Use native Fetch in both the browser and the Route Handler. Use React state and Hook Form for state, with Context only if props cannot reasonably carry shared state. Do not use Redux or an HTTP client library for the MVP.
- Consequences: Timeouts, aborts, and body handling are written against Fetch directly. The DNS rebinding decision (OD-2) may require a non-Fetch upstream transport in the proxy; if so, it gets its own ADR that amends this one.
- Alternatives considered: Redux Toolkit; Axios or similar HTTP client.

## ADR-012: Layered structure with enforced dependency direction

- Status: Accepted
- Date: 2026-11-20
- Context: The design requires domain logic independent of React, both execution strategies sharing one result contract, and server-only code kept out of the client bundle.
- Decision: Keep `app/` for routing only. Place domain, execution, server, and feature code in separate folders under `src/`, with the import directions defined in `ARCHITECTURE.md` §4.
- Consequences: Domain code is unit-testable without React. Enforcement is defined in ADR-013 and ADR-021.
- Alternatives considered: Colocating logic inside route folders; a flat shared folder.

## ADR-013: Enforce server-only code with `import "server-only"`

- Status: Accepted
- Date: 2026-11-24
- Context: Proxy code must never reach the client bundle. The Next.js 16.4 docs (Server and Client Components) state that Next.js handles `server-only` imports internally and installing the package is optional.
- Decision: Every entry module in `src/server/` starts with `import "server-only"`. Do not install the `server-only` package unless lint flags the import as an extraneous dependency.
- Consequences: An accidental client import fails at build time. No new dependency.
- Alternatives considered: Convention and review only; installing the package up front.

## ADR-014: Response size is the decoded body bytes read

- Status: Accepted
- Date: 2026-11-24
- Context: `Content-Length` can be missing or describe compressed bytes. Both executors read the body as bytes anyway (ADR-007), so the count is always available when a response exists.
- Decision: Size is the number of decoded body bytes actually read. It is shown for every Response result and labelled as the decoded body size. Failure results have no size.
- Consequences: Size can differ from bytes on the wire. The same byte count drives the response-size limit.
- Alternatives considered: Using `Content-Length`; showing size only in proxy mode.

## ADR-015: In-house JSON highlighting, no library

- Status: Accepted
- Date: 2026-11-24
- Context: The MVP highlights JSON only. Highlighting libraries add bundle weight and usually need lazy loading. Some produce HTML strings, which conflicts with the rule against injecting HTML.
- Decision: Write a small tokenizer over the formatted JSON text that returns React elements (text inside styled spans). No highlighting library.
- Consequences: No dependency, no `dangerouslySetInnerHTML`, easy to test. Large bodies above the display threshold (OD-6) skip highlighting. Revisit if other languages need highlighting.
- Alternatives considered: Shiki, Prism-based libraries, highlight.js.

## ADR-016: Keep Cache Components and Partial Prefetching enabled

- Status: Accepted
- Date: 2026-11-24
- Context: `next.config.ts` sets `cacheComponents: true` and `partialPrefetching: true`. Partial Prefetching changes what `<Link>` prefetches and only works with Cache Components. RestLab has one page and no links.
- Decision: Keep both flags as configured.
- Consequences: Partial Prefetching has no effect today. With Cache Components, request-time data such as cookies must be read inside a `<Suspense>` boundary or in client code; this matters for the theme cookie (ADR-018). `GET` Route Handlers follow the page caching model; RestLab's proxy is `POST` only.
- Alternatives considered: Removing both flags to stay on the default model.

## ADR-017: Optional body for DELETE; GET never sends a body

- Status: Accepted
- Date: 2026-11-24
- Context: `fetch` rejects a GET with a body but allows one on DELETE. Some APIs expect a DELETE body; others ignore it.
- Decision: The body type is `none`, `json`, or `text`. POST, PUT, PATCH, and DELETE accept an optional body. For GET the body editor is disabled and any text is kept but not sent.
- Consequences: Switching methods never loses typed content. Validation does not block GET because of leftover body text.
- Alternatives considered: Never sending a DELETE body; failing validation for GET with a body.

## ADR-018: Theme toggle with a preference cookie

- Status: Accepted
- Date: 2026-11-24
- Context: A developer tool should offer light and dark themes, and users who dislike the default need a visible way to change it. The MVP stores no request data.
- Decision: Provide a theme toggle. The default follows the operating system preference. The user's explicit choice is stored in a single first-party cookie holding only the theme value. This is the only stored value in the MVP; the "no persistence" rule applies to request data.
- Consequences: The theme must be applied before first paint to avoid a flash of the wrong theme. How to read the cookie under Cache Components (ADR-016), and whether a library is warranted, is open item OD-8, decided in M7. The cookie is not `HttpOnly` if client code must read it, and is never used for anything else.
- Alternatives considered: System preference only, no toggle; `localStorage`.

## ADR-019: Vitest with jsdom for component tests

- Status: Accepted
- Date: 2026-11-24
- Context: The Next.js 16.4 Vitest guide uses `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@testing-library/dom`, and `vite-tsconfig-paths`. It notes Vitest does not support async Server Components.
- Decision: Follow the Next.js guide. Use the Node environment for domain, execution, and server tests, and jsdom for component tests.
- Consequences: Async Server Components are covered by end-to-end tests later, not by Vitest. Each package is still approved individually in M0.
- Alternatives considered: happy-dom; Jest.
- Note (2026-11-25): `vite-tsconfig-paths` is not used. Its dependency `tsconfck` is marked unmaintained, and Vite 8 resolves tsconfig paths natively with `resolve.tsconfigPaths: true`. The two environments are configured as Vitest projects in `vitest.config.mts`: `unit` (Node) runs `*.test.ts`, `dom` (jsdom) runs `*.test.tsx`. `@types/node` was raised to `^22` because Vitest 5 requires it.

## ADR-020: Browser-direct by default; strategy selector ships with M6

- Status: Accepted
- Date: 2026-11-24
- Context: ADR-005 requires an explicit strategy choice but no default was set. The proxy is built in M6, after the request editor (M3).
- Decision: Browser-direct is the default strategy. The strategy selector is added in M6 together with the proxy, so the UI never offers an option that does not work yet.
- Consequences: M3 to M5 run browser-direct only. JSONPlaceholder and DummyJSON examples work in browser-direct mode as long as they keep allowing cross-origin requests.
- Alternatives considered: Proxy by default; showing a disabled selector before M6.

## ADR-021: Enforce import direction with ESLint `no-restricted-imports`

- Status: Accepted
- Date: 2026-11-24
- Context: ADR-012 asks for the dependency direction in `ARCHITECTURE.md` §4 to be enforced, not only reviewed.
- Decision: Add per-folder `no-restricted-imports` rules to `eslint.config.mjs` that block imports against the allowed direction.
- Consequences: Violations fail `npm run lint`. No new dependency. The rules are updated whenever §4 changes.
- Alternatives considered: `eslint-plugin-boundaries` or `dependency-cruiser` (extra dependencies); review only.
- Note (2026-11-25): Implemented in `eslint.config.mjs` from an allowed-imports map that mirrors `ARCHITECTURE.md` §4. Regex patterns match both `@/layer/...` and relative `../layer/...` specifiers. An `app → lib` arrow was added to §4 because the root layout uses `cn`. `src/test/` is not restricted.

## ADR-022: Continuous integration with GitHub Actions

- Status: Accepted
- Date: 2026-11-25
- Context: OD-10 asked which checks run automatically. The repository is public on GitHub, and GitHub Actions needs no new dependency.
- Decision: `.github/workflows/ci.yml` runs on pushes and pull requests to `main`: `npm ci`, then `format:check`, `lint`, `typecheck`, `test`, and `build`, on `ubuntu-latest` with Node 24. Actions are pinned to major tags (`actions/checkout@v7`, `actions/setup-node@v7`). The token has `contents: read` only, and a newer run on the same ref cancels the older one.
- Consequences: Every check in `TESTING_STRATEGY.md` §8 item 3 runs on each push. The build downloads the Geist font from Google Fonts, so a Fonts outage can fail CI. Windows and other Node versions are not tested in CI.
- Alternatives considered: A Node 22 and 24 matrix; pinning actions to commit SHAs; no CI until M8.

## 5. Open Decisions Register

This is the only list of open decisions. Other documents link here.

| ID    | Decision                                              | Notes                                                                               | Decide in |
| ----- | ----------------------------------------------------- | ----------------------------------------------------------------------------------- | --------- |
| OD-2  | Pinning the validated address (DNS rebinding)         | `node:https` with custom `lookup` (no dependency, amends ADR-011) or `undici` Agent | M6 spike  |
| OD-3  | Limit values                                          | 15 s timeout and 5 MB size decided 2026-11-26; proposed: 3 redirects, ports 80/443  | M6        |
| OD-4  | Proxy request body and header limits                  | Values to set                                                                       | M6        |
| OD-5  | Proxy content-type and origin checks                  | Proposed in `API_INTEGRATION.md` §6.3                                               | M6        |
| OD-6  | Large-response display threshold                      | Above it, no formatting or highlighting                                             | M4        |
| OD-7  | Binary response display                               | MVP default: metadata and a "not displayed" message only                            | M4        |
| OD-8  | Theme implementation                                  | Cookie read on server vs pre-paint script; Cache Components impact; library or not  | M7        |
| OD-9  | Deployment target and rate limiting                   | Must be in place before the proxy is public                                         | M8        |
| OD-11 | Coverage reporting and automated accessibility checks | No numeric coverage target for the MVP                                              | M8        |

Resolved: OD-1 (envelope and result field names) by the ADR-009 note on 2026-11-26; OD-10 (continuous integration) by ADR-022 on 2026-11-25.
