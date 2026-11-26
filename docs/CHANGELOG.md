# Changelog

All notable changes to RestLab are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning will follow [Semantic Versioning](https://semver.org/) once releases begin.

Each task that changes behavior, structure, dependencies, or documentation adds its entries under "Unreleased".

## [Unreleased]

### Added

- Project documentation in `docs/`: `PROJECT_OVERVIEW.md`, `REQUIREMENTS.md`, `SYSTEM_DESIGN.md`, `TECH_STACK.md`, `UI_UX_GUIDELINES.md`.
- `ARCHITECTURE.md`: layers, dependency rules, folder structure, execution flows.
- `DECISIONS.md`: ADR-001 to ADR-012.
- `API_INTEGRATION.md`: request construction, response handling, proxy contract and SSRF controls.
- `TESTING_STRATEGY.md`, `ROADMAP.md`, `PROJECT_PLAN.md`, `PROGRESS.md`.
- Root `AGENTS.md` with repository-specific agent instructions.
- ADR-013 to ADR-021: server-only enforcement, response size definition, in-house JSON highlighting, Cache Components flags, DELETE body, theme toggle with cookie, Vitest with jsdom, default execution strategy, ESLint import rules.
- Requirements for execution strategy selection, cancellation, timeout, row enable toggles, and light and dark themes (FR-08).
- Shared failure codes for both executors and proposed proxy origin and content-type checks (`API_INTEGRATION.md`).
- Single open-decisions register (`DECISIONS.md` §5).
- `postcss.config.mjs` and dev dependencies `@tailwindcss/postcss` 4.3.3 and `postcss` 8.5.33 (ADR-003).
- Prettier 3.10.1 with `.prettierrc.json` (defaults) and `.prettierignore`; `eslint-config-prettier` 10.1.8 turns off conflicting ESLint style rules.
- Scripts `typecheck`, `format`, and `format:check`.
- Vitest 5.1.1 with `@vitejs/plugin-react` 6.3.0, jsdom 31.0.1, `@testing-library/react` 16.3.3, and `@testing-library/dom` 10.4.2. `vitest.config.mts` defines a `unit` project (Node, `*.test.ts`) and a `dom` project (jsdom, `*.test.tsx`), with `src/test/setup.ts` for Testing Library cleanup (ADR-019).
- Scripts `test` (single run) and `test:watch`.
- First test: `src/app/page.test.tsx` renders the home page heading.
- `react-hook-form` 7.92.0, `zod` 4.6.7, and `@hookform/resolvers` 7.0.9.
- shadcn/ui initialized (Radix base, `radix-nova` style): `components.json`, `src/lib/utils.ts`, theme variables in `globals.css`, Geist font in the root layout. Added `radix-ui`, `cn`, `class-variance-authority`, `lucide-react`, `tw-animate-css`, and `shadcn`.
- Layer folders `src/domain`, `src/execution`, `src/server`, `src/features`.
- ESLint `no-restricted-imports` rules enforcing the layer import direction (ADR-021).
- `README.md` with purpose, requirements, setup, and scripts.
- GitHub Actions CI (`.github/workflows/ci.yml`) running format check, lint, type check, tests, and build on pushes and pull requests to `main` (ADR-022).
- ADR-022; OD-10 resolved.
- `src/domain/errors`: the shared failure codes with user-safe messages, processing error codes (`JSON_PARSE_ERROR`, `DECODE_ERROR`), and the validation issue type.
- `src/domain/request`: Zod request schema as the single request model (ADR-006), `validateRequest`, `buildFinalUrl`, `prepareRequest` (derived `Content-Type`, no GET body), and forbidden-header detection from the MDN list.
- Request fixtures in `src/test/fixtures/requests.ts` and unit tests for errors and request handling.
- `src/domain/response`: the `NormalizedResponse` model (ADR-007), content-type parsing and classification (JSON, text, binary, empty), charset decoding that replaces invalid bytes with U+FFFD and reports `DECODE_ERROR` only for an unknown charset, JSON parsing that keeps the raw body on failure, and `normalizeResponse`. It builds a normalized response from received status, headers, and body bytes, with size taken from the bytes read (ADR-014). Unit tests cover each part.
- `src/execution/contract`: the `ExecutionResult` union with `responseResult` and `failureResult` constructors, the `Executor` type, and the `ProxyEnvelope` types with the failure-code-to-proxy-status map. Unit tests cover the constructors and the map.
- `src/execution/browser-executor.ts`: the browser-direct executor. It sends the prepared request with `cache: "no-store"`, combines cancellation with a 15 s timeout, reads the body once while counting bytes against a 5 MB limit, and normalizes the result. Rejections map to `NETWORK_ERROR`, `TIMEOUT`, or `CANCELLED`; HTTP 4xx and 5xx are returned as responses. `src/execution/limits.ts` holds the two limits. Unit tests use a mocked `fetch`.
- OD-3 first half decided: 15 s timeout and 5 MB response size limit.
- `.gitattributes` enforcing LF line endings, so `format:check` passes on Windows checkouts with `core.autocrlf`.
- Root layout with `<html lang="en">`, `<body>`, global CSS import, and page metadata; placeholder home page.

### Changed

- Documentation location settled as root `docs/`, with application code under `src/` (ADR-001, ADR-002).
- Tailwind integration moved from `@tailwindcss/turbopack` to `@tailwindcss/postcss` (ADR-003); the `turbopack.rules` CSS entry was removed from `next.config.ts`. Rationale corrected on 2026-11-24.
- Path alias `@/*` now points at `./src/*` (ADR-001).
- `@types/node` raised from `^20` to `^22`, required by Vitest 5.
- `ARCHITECTURE.md` §4 allows `app → lib`.
- `ARCHITECTURE.md`: repository state lists the domain and execution files; the planned `execution/normalize` module is dropped because executors use `normalizeResponse` from `domain/response`.
- `API_INTEGRATION.md` §2.1 and §2.3: query values are encoded with `encodeURIComponent` (`%20` for spaces); header values containing CR, LF, or NUL fail validation.
- `vite-tsconfig-paths` replaced by Vite's native `resolve.tsconfigPaths` (ADR-019 note).
- ADR-009 (proxy envelope) accepted; field names remain open.
- ADR-009 field names fixed and OD-1 resolved; `API_INTEGRATION.md` §6.2 and `ARCHITECTURE.md` §6.4 name the fields.
- Documentation finalized on 2026-11-24: statuses updated to match the repository, error categories aligned, inspector tabs defined, headers model corrected to match Fetch, execution plan revised in `PROJECT_PLAN.md`.

- Existing files formatted with Prettier.

### Removed

- Dev dependency `@tailwindcss/turbopack`.

### Notes

- No product features are implemented yet. The repository contains a stub Next.js app (`src/app`) and documentation.
