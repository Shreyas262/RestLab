# Progress

**Last updated:** 2026-11-27
**Current milestone:** M4 Response Inspector, in progress (task 1 of 2 done)

This file is the current-status snapshot. Update it at the end of every milestone, and whenever a task changes the status below. Plans live in `PROJECT_PLAN.md`; history lives in `CHANGELOG.md`; open decisions live in `DECISIONS.md` §5.

## 1. Summary

RestLab has a Next.js application shell, the full M0 toolchain, and a finalized documentation set. M0 (Foundation) and M1 (Domain Core) are complete: errors, request, response, and the execution contract are implemented and tested, with no UI. M2 (Browser Execution and State) is complete: the browser executor and the execution state hook are implemented and tested. M3 (Request Editor) is complete: method, URL, final URL preview, Send/Cancel, Params, Headers, and Body tabs with row enable toggles, validation next to each field, the forbidden-header warning, and a temporary result summary. M4 task 1 is done: OD-6 and OD-7 are decided (ADR-023, ADR-024), and the domain has image classification with base64 bytes, a JSON tokenizer and formatter that keeps values as received (ADR-025), and the 256 KB display limit. Task 2, the inspector UI, is next.

## 2. Documentation Status

| Document                                                                                  | Status                                                       |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `REQUIREMENTS`, `ARCHITECTURE`, `API_INTEGRATION`, `UI_UX_GUIDELINES`, `TESTING_STRATEGY` | Accepted, reviewed 2026-11-27                                |
| `PROJECT_OVERVIEW`, `SYSTEM_DESIGN`, `TECH_STACK`, `ROADMAP`, `PROJECT_PLAN`              | Accepted, reviewed 2026-11-24                                |
| `DECISIONS`                                                                               | ADR-001 to ADR-025; OD-2 to OD-5, OD-8, OD-9, and OD-11 open |
| `PROGRESS`, `CHANGELOG`                                                                   | Living documents                                             |
| Root `AGENTS.md`                                                                          | Present                                                      |
| `README.md`                                                                               | Purpose, requirements, setup, scripts                        |

## 3. Implementation Status

| Area                                        | Status                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app` (layout, page, globals)           | Root layout with `<html>`/`<body>` and metadata; page renders the playground; Tailwind imported                                                                                                                                                                                                                                                       |
| Domain, execution, server, and feature code | `domain/errors`, `domain/request`, `domain/response` (including image bodies, JSON tokens and formatting, display limit), `execution/contract`, the browser executor, and `features/playground` (execution state hook, request bar, final URL preview, Params/Headers/Body tabs, temporary result output) done with tests; proxy executor not started |
| Tests                                       | 281 passing: page, playground, params, headers, body, tab selection, result output, error codes, request validation, URL building and preparation, forbidden headers, response normalization, JSON tokens and formatting, base64, display limit, execution contract, browser executor, execution state hook, UI primitives                            |

## 4. Tooling Status

| Item                                                         | State                                                                                                                |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Next.js 16.4.6, React 19.3.0, TypeScript 5.9, Tailwind 4.3.3 | Installed                                                                                                            |
| React Compiler                                               | Installed and enabled                                                                                                |
| Cache Components, Partial Prefetching                        | Enabled (ADR-016)                                                                                                    |
| TypeScript strict mode                                       | Enabled                                                                                                              |
| ESLint                                                       | Passes; layer import-direction rules enforced (ADR-021)                                                              |
| Tailwind integration                                         | `@tailwindcss/postcss` 4.3.3 with `postcss.config.mjs` (ADR-003)                                                     |
| Path alias `@/*`                                             | Points at `./src/*` (ADR-001)                                                                                        |
| React Hook Form, Zod, `@hookform/resolvers`                  | 7.92.0, 4.6.7, 7.0.9                                                                                                 |
| shadcn/ui                                                    | Initialized (Radix, `radix-nova`); `button`, `input`, `label`, `tabs`, `textarea`, `checkbox`, `native-select` added |
| Vitest, React Testing Library, jsdom                         | Vitest 5.1.1 with `unit` (Node) and `dom` (jsdom) projects (ADR-019); `user-event` 14.6.13                           |
| Prettier                                                     | 3.10.1 with `eslint-config-prettier`; LF line endings via `.gitattributes`                                           |
| Scripts `typecheck`, `format`, `format:check`                | Present                                                                                                              |
| Scripts `test`, `test:watch`                                 | Present                                                                                                              |
| Continuous integration                                       | GitHub Actions on push and PR to `main` (ADR-022)                                                                    |

## 5. Recent Decisions

- OD-6: JSON above 256 KB is shown as plain text (ADR-023). OD-7: raster images are previewed from base64 bytes, SVG stays text, other binary is not displayed (ADR-024). JSON is formatted from the raw text so values appear as received (ADR-025) (2026-11-27).
- Test names carry the requirement IDs they cover, on each top-level `describe` (`TESTING_STRATEGY.md` §6); documentation audited against the code (2026-11-27).
- After a failed Send, the editor switches to the tab holding the first error, because inactive tab panels are unmounted. GET body controls use the DOM `disabled` attribute so the kept content still submits. jsdom gets a no-op `ResizeObserver` stub for Radix (2026-11-27).
- Request form validates on the first Send, then re-validates on change; form errors are read with `useFormState` so React Compiler memoization cannot serve stale errors (2026-11-27).
- Native `<select>` (shadcn `native-select`) for the method and body type instead of Radix Select; generated shadcn files follow the project's Prettier style (2026-11-27).
- Cancel settles the execution state to `CANCELLED` immediately instead of waiting for the executor (ADR-010 implementation, 2026-11-27).
- OD-3 first half decided: 15 s timeout and 5 MB response size limit (2026-11-26).
- ADR-009 field names fixed; OD-1 resolved (2026-11-26).
- CI with GitHub Actions; OD-10 resolved (ADR-022, 2026-11-25).
- shadcn/ui initialized on Radix with the Nova preset; `cn` package replaces `clsx` and `tailwind-merge` (2026-11-25).
- Import-direction rules implemented; `app → lib` arrow added (ADR-021 note, 2026-11-25).
- Vite's native `resolve.tsconfigPaths` replaces `vite-tsconfig-paths`; `@types/node` raised to `^22` for Vitest 5 (ADR-019 note, 2026-11-25).
- Documentation finalized (2026-11-24): ADR-013 to ADR-021 added, ADR-009 accepted, one open-decisions register.
- Theme toggle with a preference cookie (ADR-018).
- Optional DELETE body (ADR-017); in-house JSON highlighting (ADR-015).
- Browser-direct by default; strategy selector ships with the proxy in M6 (ADR-020).

## 6. Blockers

None.

## 7. Next Actions

1. Manual keyboard check of the editor in a real browser (tabs, checkboxes, Send/Cancel).
2. M4 task 2: the response inspector UI (Overview, Body, Metadata, copy, image preview), replacing the temporary result output.
