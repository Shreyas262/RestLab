# Progress

**Last updated:** 2026-11-25
**Current milestone:** M0 Foundation, in progress (task 1 of 4 done)

This file is the current-status snapshot. Update it at the end of every milestone, and whenever a task changes the status below. Plans live in `PROJECT_PLAN.md`; history lives in `CHANGELOG.md`; open decisions live in `DECISIONS.md` §5.

## 1. Summary

RestLab has a minimal Next.js application shell and a finalized documentation set. No product features are implemented. M0 (Foundation) is in progress: task 1 (app shell and config) is done.

## 2. Documentation Status

| Document                                                                                                                   | Status                               |
| -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `PROJECT_OVERVIEW`, `REQUIREMENTS`, `SYSTEM_DESIGN`, `ARCHITECTURE`, `API_INTEGRATION`, `TECH_STACK`, `UI_UX_GUIDELINES` | Accepted, reviewed 2026-11-24        |
| `TESTING_STRATEGY`, `ROADMAP`, `PROJECT_PLAN`                                                                              | Accepted, reviewed 2026-11-24        |
| `DECISIONS`                                                                                                                | ADR-001 to ADR-021; OD-1 to OD-11 open |
| `PROGRESS`, `CHANGELOG`                                                                                                    | Living documents                     |
| Root `AGENTS.md`                                                                                                           | Present                              |
| `README.md`                                                                                                                | Empty; written in M0                 |

## 3. Implementation Status

| Area                                       | Status                                                                 |
| ------------------------------------------ | ---------------------------------------------------------------------- |
| `src/app` (layout, page, globals)          | Root layout with `<html>`/`<body>` and metadata; placeholder page; Tailwind imported |
| Domain, execution, server, and feature code | Not started                                                           |
| Tests                                      | Not started                                                            |

## 4. Tooling Status

| Item                                                        | State                                                               |
| ----------------------------------------------------------- | ------------------------------------------------------------------- |
| Next.js 16.4.6, React 19.3.0, TypeScript 5.9, Tailwind 4.3.3 | Installed                                                           |
| React Compiler                                              | Installed and enabled                                               |
| Cache Components, Partial Prefetching                       | Enabled (ADR-016)                                                   |
| TypeScript strict mode                                      | Enabled                                                             |
| ESLint                                                      | Installed; `npm run lint` passes                                    |
| Tailwind integration                                        | `@tailwindcss/postcss` 4.3.3 with `postcss.config.mjs` (ADR-003)    |
| Path alias `@/*`                                            | Points at `./src/*` (ADR-001)                                       |
| React Hook Form, Zod, `@hookform/resolvers`                 | Not installed                                                       |
| shadcn/ui                                                   | Not initialized                                                     |
| Vitest, React Testing Library, jsdom                        | Not installed                                                       |
| Prettier                                                    | Not installed                                                       |
| Scripts `test`, `typecheck`, `format:check`                 | Missing                                                             |

## 5. Recent Decisions

- Documentation finalized (2026-11-24): ADR-013 to ADR-021 added, ADR-009 accepted, one open-decisions register.
- Theme toggle with a preference cookie (ADR-018).
- Optional DELETE body (ADR-017); in-house JSON highlighting (ADR-015).
- Browser-direct by default; strategy selector ships with the proxy in M6 (ADR-020).

## 6. Blockers

None.

## 7. Next Actions

1. Project owner reviews and commits M0 task 1.
2. Start M0, task 2: formatting and scripts (`PROJECT_PLAN.md` §3).
