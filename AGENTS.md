# AGENTS.md

Instructions for AI assistants and coding agents working in this repository. Read this file first, then the documents it points to.

## Project

RestLab is a browser-based REST API playground built with Next.js. Users configure an HTTP request, run it (directly from the browser or through a Next.js backend proxy), and inspect the response. It is a portfolio project built by one developer who is also using it to learn. Repository: https://github.com/Shreyas262/RestLab

## Source of truth

The `docs/` directory is the single source of truth. Do not duplicate its content here or elsewhere.

| Need | Read |
|---|---|
| Product scope and MVP boundaries | `docs/REQUIREMENTS.md`, `docs/PROJECT_OVERVIEW.md` |
| Logical design | `docs/SYSTEM_DESIGN.md` |
| Code structure and dependency rules | `docs/ARCHITECTURE.md` |
| Why things were decided | `docs/DECISIONS.md` |
| HTTP, proxy contract, SSRF rules | `docs/API_INTEGRATION.md` |
| Technology choices | `docs/TECH_STACK.md` |
| UI behavior | `docs/UI_UX_GUIDELINES.md` |
| Testing | `docs/TESTING_STRATEGY.md` |
| Plan and current status | `docs/PROJECT_PLAN.md`, `docs/PROGRESS.md` |

If a document is missing or looks out of date, say so. Do not assume that something described in the docs already exists in the code. Inspect the code.

## How to work with the developer

- The developer owns the project. Default to explaining, reviewing, and giving hints. Write or change code only when explicitly asked.
- Explain trade-offs. Challenge decisions that look wrong, and say why.
- Do not restart product discovery or silently change finalized decisions. Propose changes, and record accepted ones in `docs/DECISIONS.md`.
- Keep responses concise and technically precise. One document or one task at a time.
- Do not claim files were changed, committed, or pushed unless that actually happened.

## Before any feature work

1. Read `docs/PROGRESS.md`, `docs/ARCHITECTURE.md`, and `docs/DECISIONS.md`.
2. Inspect the existing code and dependencies for the area involved.
3. Agree on scope and acceptance criteria.
4. Check official documentation for anything version-sensitive. Do not rely on remembered conventions.
5. Wait for the developer to be ready before implementing.

At the end of a feature, produce `HANDOFF.md`: objective, status, files changed, decisions, concepts learned, dependency changes, tests and results, outstanding issues, docs to update, context for the next conversation.

## Stack

Next.js (App Router), React with the React Compiler, TypeScript in strict mode, Tailwind CSS v4, shadcn/ui, React Hook Form with Zod, native Fetch, Vitest and React Testing Library. Package manager: npm. Check `package.json` for what is actually installed.

Next.js, React, and Tailwind versions in this project are recent. Consult the official documentation (https://nextjs.org/docs, https://tailwindcss.com/docs) before using any API or setup pattern.

## Commands

Currently available: `npm run dev`, `npm run build`, `npm run start`, `npm run lint`.

Planned (not yet present): `test`, `typecheck`, `format:check`. See `docs/PROJECT_PLAN.md`, milestone M0.

## Code structure rules

Full detail is in `docs/ARCHITECTURE.md`. The essentials:

- Application code lives under `src/`. `src/app/` is for routing only.
- `domain/` is plain TypeScript. It imports no React, Next.js, or other layers.
- Both execution strategies return the same result type. UI code does not depend on which strategy ran.
- `server/` code must never reach the client bundle.
- Components render state. They do not make execution or normalization decisions.
- Prefer Server Components. Use Client Components only for interactivity and browser-specific code.
- Do not add manual `useMemo`, `useCallback`, or `memo` without measured need (React Compiler is enabled).

## Behavior rules that must not be broken

- An HTTP 4xx or 5xx is a valid response, not a network failure. Its status, headers, and body must stay available.
- A parse failure must not discard the raw body or metadata.
- Read a response body once. Preserve the raw text and derive parsed data separately.
- Never switch execution strategy silently after a failure.
- Never render response content as HTML. No `dangerouslySetInnerHTML` with response data.
- User-triggered requests must not be served from cache.
- Do not store request data: no history, persistence, or browser storage in the MVP.

## Security rules

The proxy accepts user-provided URLs and is an SSRF risk. Do not weaken or bypass the controls in `docs/API_INTEGRATION.md` §6. Do not build an unrestricted relay. Do not log header values or request and response bodies. Error messages must not expose internal details.

## Dependencies

Add a dependency only for a demonstrated need, and record significant choices in `docs/DECISIONS.md`. Do not add an HTTP client library or Redux for the MVP. Choose the syntax-highlighting library only after evaluating bundle size, performance, and maintenance.

## Documentation upkeep

When behavior, structure, or decisions change, update the affected document in `docs/` in the same piece of work, and add a line to `CHANGELOG.md`. Keep `docs/PROGRESS.md` current.
