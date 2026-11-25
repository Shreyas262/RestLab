# Progress

**Last updated:** 2026-11-25
**Current milestone:** M1 Domain Core, in progress (parts 1 and 2 of 3 done)

This file is the current-status snapshot. Update it at the end of every milestone, and whenever a task changes the status below. Plans live in `PROJECT_PLAN.md`; history lives in `CHANGELOG.md`; open decisions live in `DECISIONS.md` §5.

## 1. Summary

RestLab has a Next.js application shell, the full M0 toolchain, and a finalized documentation set. No product features are implemented. M0 (Foundation) is complete. M1 (Domain Core) is in progress: part 1 (errors and request) and part 2 (response) are done; part 3 (execution contract) remains.

## 2. Documentation Status

| Document                                                                                                                 | Status                                          |
| ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| `PROJECT_OVERVIEW`, `REQUIREMENTS`, `SYSTEM_DESIGN`, `ARCHITECTURE`, `API_INTEGRATION`, `TECH_STACK`, `UI_UX_GUIDELINES` | Accepted, reviewed 2026-11-24                   |
| `TESTING_STRATEGY`, `ROADMAP`, `PROJECT_PLAN`                                                                            | Accepted, reviewed 2026-11-24                   |
| `DECISIONS`                                                                                                              | ADR-001 to ADR-022; OD-1 to OD-9 and OD-11 open |
| `PROGRESS`, `CHANGELOG`                                                                                                  | Living documents                                |
| Root `AGENTS.md`                                                                                                         | Present                                         |
| `README.md`                                                                                                              | Purpose, requirements, setup, scripts           |

## 3. Implementation Status

| Area                                        | Status                                                                                                                      |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `src/app` (layout, page, globals)           | Root layout with `<html>`/`<body>` and metadata; placeholder page; Tailwind imported                                        |
| Domain, execution, server, and feature code | `domain/errors`, `domain/request`, and `domain/response` done with tests; contract and the rest not started                 |
| Tests                                       | 155 passing: page, error codes, request validation, URL building and preparation, forbidden headers, response normalization |

## 4. Tooling Status

| Item                                                         | State                                                                      |
| ------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Next.js 16.4.6, React 19.3.0, TypeScript 5.9, Tailwind 4.3.3 | Installed                                                                  |
| React Compiler                                               | Installed and enabled                                                      |
| Cache Components, Partial Prefetching                        | Enabled (ADR-016)                                                          |
| TypeScript strict mode                                       | Enabled                                                                    |
| ESLint                                                       | Passes; layer import-direction rules enforced (ADR-021)                    |
| Tailwind integration                                         | `@tailwindcss/postcss` 4.3.3 with `postcss.config.mjs` (ADR-003)           |
| Path alias `@/*`                                             | Points at `./src/*` (ADR-001)                                              |
| React Hook Form, Zod, `@hookform/resolvers`                  | 7.92.0, 4.6.7, 7.0.9                                                       |
| shadcn/ui                                                    | Initialized (Radix, `radix-nova`); no components added yet                 |
| Vitest, React Testing Library, jsdom                         | Vitest 5.1.1 with `unit` (Node) and `dom` (jsdom) projects (ADR-019)       |
| Prettier                                                     | 3.10.1 with `eslint-config-prettier`; LF line endings via `.gitattributes` |
| Scripts `typecheck`, `format`, `format:check`                | Present                                                                    |
| Scripts `test`, `test:watch`                                 | Present                                                                    |
| Continuous integration                                       | GitHub Actions on push and PR to `main` (ADR-022)                          |

## 5. Recent Decisions

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

1. Project owner reviews and commits M1 part 2.
2. M1 part 3: `ExecutionResult` and proxy envelope types in `execution/contract`; close OD-1.
