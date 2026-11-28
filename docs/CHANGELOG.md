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
- `src/features/playground/hooks/use-execution.ts`: the execution state hook (ADR-010) with idle, executing, and completed states. It creates an `AbortController` per execution, ignores Send while executing, settles Cancel immediately as `CANCELLED`, aborts on unmount, and drops results from cancelled or unmounted executions. The executor is injectable and defaults to the browser executor. Hook tests use a controllable fake executor.
- shadcn/ui components `button`, `input`, `label`, `tabs`, `textarea`, `checkbox`, and `native-select` in `src/components/ui/`, formatted with Prettier. A native `<select>` is used for the method and body type instead of Radix Select.
- Dev dependency `@testing-library/user-event` 14.6.13 for keyboard and pointer interaction tests, with a smoke test in `src/components/ui/primitives.test.tsx`.
- `src/features/playground/playground.tsx`: the client boundary for the editor. It runs React Hook Form with `zodResolver(requestSchema)`, calls `useExecution` once, and passes state down as props. Default values are in `default-request.ts` (strategy fixed to browser-direct, ADR-020).
- Request bar with a labelled method select, URL input with its error shown next to the field (`aria-invalid`, `aria-describedby`), and one Send/Cancel button that keeps focus when its label changes. Enter in the URL field sends. Validation runs on the first Send, then on change.
- Final URL preview built with `buildFinalUrl`.
- Temporary result output: a status region with text for idle, executing, response (HTTP error labelled in words), processing error, failure with code, and a neutral cancelled state. The body is not shown until the M4 inspector.
- Test helpers `src/test/fake-executor.ts` and `src/test/fixtures/responses.ts`; playground, result output, and page tests.
- Params, Headers, and Body tabs in the request editor. Parameter and header rows can be added, edited, removed, enabled, and disabled, with numbered labels and errors under the field they concern. Adding a row focuses its name; removing one moves focus to the Add button.
- Forbidden-header warning on header rows in browser-direct mode. It does not block Send.
- Body editor with a None, JSON, or Text type and a `Content-Type` hint. For GET the controls are disabled and the content is kept but not sent (ADR-017). With None the editor is hidden and its content kept.
- After a failed Send, the editor switches to the tab holding the first error, and that tab is marked as having errors in text as well as with an icon.
- Tests for params, headers, body, and tab selection, with a shared `renderPlayground` helper in `src/features/playground/test-utils.tsx`.
- `.gitattributes` enforcing LF line endings, so `format:check` passes on Windows checkouts with `core.autocrlf`.
- ADR-023 to ADR-025; OD-6 and OD-7 resolved. FR-05 now includes previews of raster image responses.
- `image` body class for declared PNG, JPEG, GIF, WebP, AVIF, BMP, and ICO responses, with the bytes kept base64-encoded in `imageBase64` (ADR-024). SVG stays text.
- `src/domain/response/base64.ts` (`bytesToBase64`, `base64ToBytes`), `json-tokens.ts` (`tokenizeJson`, `formatJson`, `tokensToText`), and `display.ts` (`FORMAT_LIMIT_BYTES` of 256 KB, `isWithinFormatLimit`), with unit tests.
- Response inspector in `src/features/playground/components/response/`, replacing the temporary result output. A status line states the outcome in words and is the only live region. Overview shows the summary and the normalized response as highlighted JSON, without `parsedBody` and with image data replaced by a placeholder. Body shows formatted, highlighted JSON up to 256 KB and plain text above it with a note, raw text with the processing error for malformed JSON, text bodies including HTML as text, an image preview through an object URL that is revoked on unmount, and explicit messages for empty, binary, and undecodable bodies. Metadata lists status, status text, duration, decoded size, content type, strategy, outcome, a headers table, and the CORS header note in browser-direct mode. Copy buttons confirm inline with "Copied" or "Copy failed".
- `src/features/playground/response-view.ts`: byte and duration formatting, outcome wording, the Body tab decision (`bodyView`), and the Overview value (`overviewValue`), with unit tests. Component tests for each tab, the image preview, and the copy button.
- ADR-026 to ADR-028 and open item OD-12: user-saved templates in IndexedDB, optional passphrase encryption per template, and a guide with a public API directory instead of predefined examples.
- FR-09 (guide and public API directory) in `REQUIREMENTS.md`; M5 is now "Saved Templates and Guide" in `PROJECT_PLAN.md`.
- `src/domain/templates/`: stored-template schemas for plain and encrypted records (`model.ts`), name and passphrase rules, the 50-template limit, and template error codes with user-safe messages (`errors.ts`), with unit tests.
- `src/features/templates/template-store.ts`: an IndexedDB adapter that validates every record it reads, skips and counts damaged ones, refuses duplicate names, missing records, and a 51st template in the same transaction as the write, and maps quota errors to `STORAGE_FULL`. Tests run against `fake-indexeddb`.
- `src/features/templates/template-crypto.ts`: PBKDF2-SHA-256 key derivation (600,000 iterations, 16-byte salt) and AES-GCM encryption (12-byte IV, template id as additional data) through Web Crypto, with tests for the round trip, wrong passphrases, altered data, and moved ciphertext.
- Dev dependency `fake-indexeddb` 6.2.8 and the fixture `src/test/fixtures/templates.ts`.
- Templates UI in `src/features/templates/`: the `useTemplates` hook (store connection, list, unlocked keys in memory, injectable services), a saved-templates panel (sidebar on wide screens, collapsible on small ones) with load, rename in place, lock, and delete with confirmation, Save and Save as new next to Send, a save dialog with name, storage choice (no default), passphrase and confirmation, and the plain-text warning, an unlock dialog, a "Delete damaged records" action, and a loaded-template line with a "Modified" marker.
- `removeDamaged()` on the template store and the `LOCKED` template error code.
- shadcn/ui components `dialog` and `alert-dialog` (no new npm dependency; they use `radix-ui`).
- Test helper `src/test/template-services.ts` and tests for the hook and the templates UI in `src/features/playground/templates.test.tsx`.
- ADR-029; OD-12 resolved: "Try it" links to `/?sample=<id>`.
- Public API directory at `/apis`: 81 free APIs that work browser-direct, in 11 categories, each with its base URL, key requirement, browser-direct support, last-checked date (2026-11-28), sample request, documentation link, and a "Try it" link. Every sample and documentation link was checked against the live service on 2026-11-28. Data in `src/features/guide/public-apis.ts`, with tests that every sample passes `requestSchema`.
- Site header on every page with the RestLab name and links to the Playground and Public APIs; the current page is marked with `aria-current="page"`.
- `src/features/playground/sample-loader.tsx`: loads the sample named in the URL into the editor without sending it, then removes the parameter. It renders inside a Suspense boundary, so the rest of the playground stays prerendered.
- `src/test/next-navigation.ts` and a `next/navigation` mock in `src/test/setup.ts`; tests for the directory data, the directory page, the header, and loading samples.
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
- The home page renders the playground below the heading instead of a placeholder.
- `src/test/setup.ts` adds a no-op `ResizeObserver` when it is missing, because jsdom lacks it and Radix Checkbox needs it.
- Test names reference the requirements they cover: every top-level `describe`, and every `test` outside one, ends with its requirement IDs, for example `(FR-01)` (`TESTING_STRATEGY.md` §6).
- The existing "does not decode binary types" test uses `application/octet-stream`, because `image/png` is now an image.
- `API_INTEGRATION.md` §4.2 to §4.4, `ARCHITECTURE.md` §10, `UI_UX_GUIDELINES.md` §4, and `TESTING_STRATEGY.md` §4 describe image bodies, the display limit, and formatting from the raw text.
- `UI_UX_GUIDELINES.md` §4 describes the status line, the default tab, what Overview leaves out, and what copy copies.
- FR-03 is now saved request templates instead of predefined presets. FR-07, NFR-05, the MVP scope, the out-of-scope list, and the acceptance criteria follow. `SYSTEM_DESIGN.md` §9, `ARCHITECTURE.md` (§2, §4, §5, §6.7 to §6.9, §7, §9), `UI_UX_GUIDELINES.md` (§2 navigation and panel, §3 saved templates, new §11), `API_INTEGRATION.md` §6.5 and §7, `TESTING_STRATEGY.md`, `TECH_STACK.md` §5 and §7, `PROJECT_OVERVIEW.md`, `ROADMAP.md`, and the storage rule in `AGENTS.md` updated to match. ADR-006 and ADR-018 have dated notes.
- `requestShape` is exported from `src/domain/request/schema.ts` so stored templates can check structure without the field rules.
- The playground renders the templates panel beside the editor, and the request bar takes extra actions after Send. The page is wider (`max-w-7xl`).
- The playground keyboard test now checks the full order: the templates panel toggle, method, URL, Send, and Save. The playground tests use an in-memory template store.
- `UI_UX_GUIDELINES.md` §2 and §3 and `ARCHITECTURE.md` §2 and §6.7 describe the templates UI as built.
- Documentation brought in line with the code: `ARCHITECTURE.md` §2 repository state re-verified and the stale M0 notes removed; `ARCHITECTURE.md` §9 and an ADR-010 note describe Send turning into Cancel instead of being disabled; `API_INTEGRATION.md` §8 no longer lists the resolved OD-1; the outdated "no product features" note removed from this file.
- The home page heading is now visually hidden ("RestLab playground"), because the header shows the RestLab name. Loading a template and loading a sample share one path in the playground.
- `ARCHITECTURE.md` §2, §5, and §6.8, `UI_UX_GUIDELINES.md` §11, and `TESTING_STRATEGY.md` §6 describe the directory, the header, the sample loader, and the router mock.

### Removed

- Dev dependency `@tailwindcss/turbopack`.
- The temporary `execution-output` component and its test, replaced by the response inspector.
- Generic presets and the preset picker from the plan (ADR-026, ADR-028).
