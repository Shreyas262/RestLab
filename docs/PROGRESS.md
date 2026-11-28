# Progress

**Last updated:** 2026-11-28
**Current milestone:** M5 Saved Templates and Guide, all tasks done; the manual acceptance checks in §7 are open

This file is the current-status snapshot. Update it at the end of every milestone, and whenever a task changes the status below. Plans live in `PROJECT_PLAN.md`; history lives in `CHANGELOG.md`; open decisions live in `DECISIONS.md` §5.

## 1. Summary

RestLab has a Next.js application shell, the full M0 toolchain, and a finalized documentation set. M0 (Foundation) and M1 (Domain Core) are complete: errors, request, response, and the execution contract are implemented and tested, with no UI. M2 (Browser Execution and State) is complete: the browser executor and the execution state hook are implemented and tested. M3 (Request Editor) is complete: method, URL, final URL preview, Send/Cancel, Params, Headers, and Body tabs with row enable toggles, validation next to each field, the forbidden-header warning. M4 (Response Inspector) is complete: a status line in words, and Overview, Body, and Metadata tabs. JSON is formatted from the raw text and highlighted up to 256 KB (ADR-023, ADR-025), raster images are previewed (ADR-024), and empty, binary, malformed, and undecodable bodies each have their own display. Copy buttons give inline feedback. M5 replaces predefined presets with user-saved templates and adds a guide and public API directory (ADR-026 to ADR-028). Tasks 1 to 3 are done: the scope change is documented; the template model, IndexedDB store, and optional passphrase encryption are implemented; and the templates UI is in place: a saved-templates panel, Save and Save as new next to Send, the save dialog with the encryption choice and plain-text warning, unlock and lock, rename, delete with confirmation, and a Modified marker. Task 4 is done in two parts. 4a: OD-12 is decided (ADR-029), and the directory at `/apis` lists 81 free APIs checked on 2026-11-28, each with a "Try it" link that loads its sample into the editor without sending it. 4b: the guide at `/guide` has a table of contents and five prerendered topic pages, the header links the Playground, the Guide, and the Public APIs, and the empty response area links to the guide and the directory. M5 is complete apart from its manual acceptance checks.

## 2. Documentation Status

| Document                                                                                  | Status                                                       |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `REQUIREMENTS`, `ARCHITECTURE`, `API_INTEGRATION`, `UI_UX_GUIDELINES`, `TESTING_STRATEGY` | Accepted, reviewed 2026-11-27                                |
| `PROJECT_OVERVIEW`, `SYSTEM_DESIGN`, `TECH_STACK`, `ROADMAP`, `PROJECT_PLAN`              | Accepted, reviewed 2026-11-27                                |
| `DECISIONS`                                                                               | ADR-001 to ADR-029; OD-2 to OD-5, OD-8, OD-9, and OD-11 open |
| `PROGRESS`, `CHANGELOG`                                                                   | Living documents                                             |
| Root `AGENTS.md`                                                                          | Present                                                      |
| `README.md`                                                                               | Purpose, requirements, setup, scripts                        |

## 3. Implementation Status

| Area                                        | Status                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app` (layout, pages, globals)          | Root layout with `<html>`/`<body>`, metadata, and the site header; `/` renders the playground; `/apis` renders the public API directory; `/guide` and `/guide/[topic]` render the guide; Tailwind imported                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Domain, execution, server, and feature code | `domain/errors`, `domain/request`, `domain/response` (including image bodies, JSON tokens and formatting, display limit), `execution/contract`, the browser executor, and `features/playground` (execution state hook, request bar, final URL preview, Params/Headers/Body tabs, response inspector), `domain/templates` (stored-template schemas, error codes), and `features/templates` (IndexedDB store, Web Crypto encryption, `useTemplates` hook, panel, save actions, and dialogs), `features/guide` (directory data, directory page with search, guide topics and pages, site header), and the playground sample loader done with tests; proxy executor not started |
| Tests                                       | 555 passing: guide topics and pages, public API directory data, search, and page, site header, Try it samples, template schemas, template store, template encryption, templates hook, saving, loading, unlocking, renaming, and deleting templates, page, playground, params, headers, body, tab selection, response inspector, Overview, Body, and Metadata tabs, image preview, copy button, response view helpers, error codes, request validation, URL building and preparation, forbidden headers, response normalization, JSON tokens and formatting, base64, display limit, execution contract, browser executor, execution state hook, UI primitives                |

## 4. Tooling Status

| Item                                                         | State                                                                                                                                          |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Next.js 16.4.6, React 19.3.0, TypeScript 5.9, Tailwind 4.3.3 | Installed                                                                                                                                      |
| React Compiler                                               | Installed and enabled                                                                                                                          |
| Cache Components, Partial Prefetching                        | Enabled (ADR-016)                                                                                                                              |
| TypeScript strict mode                                       | Enabled                                                                                                                                        |
| ESLint                                                       | Passes; layer import-direction rules enforced (ADR-021)                                                                                        |
| Tailwind integration                                         | `@tailwindcss/postcss` 4.3.3 with `postcss.config.mjs` (ADR-003)                                                                               |
| Path alias `@/*`                                             | Points at `./src/*` (ADR-001)                                                                                                                  |
| React Hook Form, Zod, `@hookform/resolvers`                  | 7.92.0, 4.6.7, 7.0.9                                                                                                                           |
| shadcn/ui                                                    | Initialized (Radix, `radix-nova`); `button`, `input`, `label`, `tabs`, `textarea`, `checkbox`, `native-select`, `dialog`, `alert-dialog` added |
| Vitest, React Testing Library, jsdom                         | Vitest 5.1.1 with `unit` (Node) and `dom` (jsdom) projects (ADR-019); `user-event` 14.6.13; `fake-indexeddb` 6.2.8                             |
| Prettier                                                     | 3.10.1 with `eslint-config-prettier`; LF line endings via `.gitattributes`                                                                     |
| Scripts `typecheck`, `format`, `format:check`                | Present                                                                                                                                        |
| Scripts `test`, `test:watch`                                 | Present                                                                                                                                        |
| Continuous integration                                       | GitHub Actions on push and PR to `main` (ADR-022)                                                                                              |

## 5. Recent Decisions

- Directory search: a Client Component filters the entries as the user types (name, description, category, base URL; every word must match). The page stays prerendered with the full list, and the query is not kept in the URL (ADR-028 note, 2026-11-28).
- Guide: topic pages at `/guide/<topic>`, prerendered with `generateStaticParams`, content as plain TSX with no MDX dependency; an unknown topic is not found. The "New here?" line sits outside the status live region. The guide describes the proxy strategy as planned, not available (2026-11-28).
- OD-12: "Try it" links to `/?sample=<id>`; a loader inside a Suspense boundary loads the sample and removes the parameter (ADR-029). The directory lists only APIs whose sample answered with CORS headers and whose documentation link loaded on 2026-11-28. REST Countries (now redirects to a file without CORS headers), ReqRes (now asks for a key), and services that failed or timed out during the check were left out. The Guide header link is added with the guide pages in 4b, so the header has no dead link (2026-11-28).
- Templates UI: Save next to Send updates a loaded template at once; the loaded template line shows "Modified" from React Hook Form's `isDirty`; locking the loaded template detaches the editor but keeps its content; only plain templates show their method in the list (2026-11-27).
- Predefined presets dropped. Users save their own templates in IndexedDB (ADR-026), each optionally encrypted with its own passphrase: PBKDF2-SHA-256 with 600,000 iterations and AES-GCM (ADR-027). Guide pages and a public API directory with "Try it" links replace the examples (ADR-028); OD-12 opened (2026-11-27).
- Inspector: only the status line is a live region; Body is the default tab and the selection survives new responses; Overview leaves out `parsedBody` and replaces image data with a placeholder; copy copies the text as shown (2026-11-27).
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
2. Manual check of the inspector in a real browser: a JSON API (for example `https://jsonplaceholder.typicode.com/posts/1`), an image URL, a 404, and an unreachable host.
3. Manual check of templates in a real browser: save plain and encrypted templates, reload, unlock with a wrong and the right passphrase, lock, rename, delete, and private browsing.
4. Manual check of the directory in a real browser: "Try it" on a few entries (JSON, image, the httpbin POST, and icanhazdadjoke with its Accept header), Send, then reload and Back. Search for a few terms (for example "weather", "pokemon", and one with no match) with the keyboard and a screen reader. M5 acceptance asks for every "Try it" sample to be run once against its real API.
5. Manual check of the guide in a real browser: the header and the empty response area links, the topic list and previous and next links with the keyboard, the layout at narrow widths, and an unknown topic such as `/guide/missing`.
6. Next milestone: M6 Backend Proxy (`PROJECT_PLAN.md`), starting with the OD-2 spike.
