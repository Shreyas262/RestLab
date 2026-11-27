# AGENTS.md

Rules for AI agents working in this repository. Read this file first. Follow it exactly.

## Project

RestLab is a browser-based REST API playground built with Next.js. Users configure an HTTP request, run it directly from the browser or through a Next.js backend proxy, and inspect the response.

Documentation in `docs/` is the single source of truth. Do not duplicate it here.

| Need                                | Read                                               |
| ----------------------------------- | -------------------------------------------------- |
| Scope and MVP boundaries            | `docs/REQUIREMENTS.md`, `docs/PROJECT_OVERVIEW.md` |
| Logical design                      | `docs/SYSTEM_DESIGN.md`                            |
| Code structure and dependency rules | `docs/ARCHITECTURE.md`                             |
| Past decisions and reasons          | `docs/DECISIONS.md`                                |
| HTTP, proxy contract, SSRF rules    | `docs/API_INTEGRATION.md`                          |
| Stack                               | `docs/TECH_STACK.md`                               |
| UI behavior                         | `docs/UI_UX_GUIDELINES.md`                         |
| Testing                             | `docs/TESTING_STRATEGY.md`                         |
| Plan and status                     | `docs/PROJECT_PLAN.md`, `docs/PROGRESS.md`         |
| Direction beyond the MVP            | `docs/ROADMAP.md`                                  |
| History of changes                  | `docs/CHANGELOG.md`                                |
| Open decisions                      | `docs/DECISIONS.md` §5                             |

Do not assume the code matches the docs. Inspect the code. If a document is missing or out of date, say so.

## Workflow

Every task follows these steps in order. No exceptions.

1. **Understand.** Read the relevant docs and code. Ask one question only if something blocking is unclear.
2. **Plan.** Present a short plan: what will change, which files, which commands, any new dependency, and any risk.
3. **Get approval.** Stop and wait for an explicit go-ahead. Do not edit files, install packages, or run state-changing commands before it. Reading files and running read-only commands is allowed.
4. **Execute.** Do only what the approved plan says. If the plan needs to change, stop, say why, and get approval again.
5. **Verify.** Run the relevant checks (lint, type check, tests, build) and report the real results. Never claim something works without running it. If a check could not be run, say so.
6. **Explain.** Summarize what changed and why: files touched, behavior affected, anything left undone.

## Git

- Never commit or push. Leave all changes uncommitted; the project owner reviews and commits them.
- At the end of a task, list the changed files and suggest a commit message for the owner to use.
- Never open or update a pull request without explicit approval each time. Before asking, show the proposed PR title and description.
- Do not mention any AI tool, assistant, or model name in commit messages, PR titles, or PR descriptions. Do not add `Co-authored-by` lines or any AI attribution or generated-by notes.
- Write commit messages in the imperative mood with a short, specific subject. Follow the existing history style. One logical change per commit.
- Never force-push, rewrite history, delete branches, change git configuration, or skip hooks.
- Never commit to a protected branch unless told to. Do not stage unrelated changes.

## Scope and safety

- Change only what the approved task requires. No drive-by refactors, renames, or formatting changes in untouched files.
- Do not delete or overwrite files, or run destructive commands, without approval.
- Never add, remove, or upgrade a dependency without approval. Justify the need first.
- Never read, print, or commit secrets, tokens, `.env` files, or credentials. Never hardcode them.
- Do not run commands that reach external services beyond what the task needs.
- Do not edit generated files, lockfiles, or build output by hand. Use the tool that generates them.
- If something unexpected shows up (failing tests you did not cause, uncommitted changes you did not make), report it and ask before touching it.

## Responses

- Be brief and direct. No preamble, no restating the request, no filler.
- Do not paste large files or long command output. Quote only the relevant lines.
- Report only what the person needs: the plan, the result, the problem, or the question.
- State uncertainty plainly. Do not guess and present the guess as fact.

## Stack

Next.js (App Router), React with the React Compiler, TypeScript in strict mode, Tailwind CSS v4, shadcn/ui, React Hook Form with Zod, native Fetch, Vitest and React Testing Library. Package manager: npm. Check `package.json` for what is actually installed.

Versions are recent. Before using any version-sensitive API or setup pattern, check the official documentation (https://nextjs.org/docs, https://react.dev, https://tailwindcss.com/docs). Do not rely on remembered conventions.

The developer works on Windows. Do not introduce Unix-only commands into scripts or documentation.

## Commands

Available: `npm run dev`, `npm run build`, `npm run start`, `npm run lint`, `npm run typecheck`, `npm run format`, `npm run format:check`, `npm run test`, `npm run test:watch`.

Check `package.json` before running anything, and do not assume a script exists.

## Code rules

Details are in `docs/ARCHITECTURE.md`. The essentials:

- Application code lives under `src/`. `src/app/` is for routing only.
- `domain/` is plain TypeScript. It imports no React, no Next.js, and nothing from other layers.
- Both execution strategies return the same result type. UI code must not depend on which strategy ran.
- `server/` code must never reach the client bundle.
- Components render state. They do not make execution or normalization decisions.
- Prefer Server Components. Use Client Components only for interactivity and browser-specific code.
- React Compiler is enabled. Do not add `useMemo`, `useCallback`, or `memo` without measured need.
- TypeScript strict mode. No `any` and no unchecked type assertions without a stated reason.
- Do not add comments that restate the code. Comment only the reason for non-obvious decisions.
- Prefer the platform and framework before adding a library.

## Behavior that must not be broken

- An HTTP 4xx or 5xx is a valid response, not a network failure. Keep its status, headers, and body available.
- A parse failure must not discard the raw body or metadata.
- Read a response body once. Preserve the raw text and derive parsed data separately.
- Never switch execution strategy silently after a failure.
- Never render response content as HTML. No `dangerouslySetInnerHTML` with response data.
- User-triggered requests must not be served from cache.
- No request history in the MVP. Request data is stored only when the user saves a template: in IndexedDB, plain or passphrase-encrypted as the user chose (ADR-026, ADR-027). Never in `localStorage`, cookies, or on the server. The theme preference cookie is the only other stored value (ADR-018).

## Security

The proxy accepts user-provided URLs and is an SSRF risk. Do not weaken or bypass the controls in `docs/API_INTEGRATION.md` section 6. Do not build an unrestricted relay. Do not log header values or request and response bodies. Error messages must not expose internal details.

## Tests

- New behavior needs tests. Bug fixes start with a failing test.
- Tests never call live external APIs. Mock `fetch` and DNS.
- Do not weaken, skip, or delete a test to make a check pass. Report the failure instead.

## Documentation

When behavior, structure, or a decision changes, include the doc update in the plan, and make it as part of the same task once approved. Record significant decisions in `docs/DECISIONS.md`. Keep `docs/PROGRESS.md` and `docs/CHANGELOG.md` current.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
