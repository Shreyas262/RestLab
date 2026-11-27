# Tech Stack

**Status:** Accepted · **Last reviewed:** 2026-11-27

## 1. Core Technologies

| Area            | Technology   | Decision                                                         |
| --------------- | ------------ | ---------------------------------------------------------------- |
| Runtime         | Node.js      | 20.9 or later (Next.js 16 requirement). Developed on Node 24     |
| Framework       | Next.js      | 16.4, App Router, React Compiler, Cache Components (ADR-016)     |
| UI library      | React        | 19.3, as paired with the Next.js release                         |
| Language        | TypeScript   | 5.9, strict mode                                                 |
| Styling         | Tailwind CSS | v4 through `@tailwindcss/postcss` (ADR-003)                      |
| Components      | shadcn/ui    | Radix base, `radix-nova` style, neutral base color, Lucide icons |
| Package manager | npm          | Use `package-lock.json` for dependency consistency               |

Installed versions are the source of truth; check `package.json`. The current state of installation is in `PROGRESS.md`.

### Dependencies brought in by shadcn/ui

`shadcn init` (CLI 4.23.0, run in M0) installed `radix-ui`, `cn` (shadcn's replacement for `clsx` and `tailwind-merge`), `class-variance-authority`, `lucide-react`, `tw-animate-css`, and `shadcn` (provides `shadcn/tailwind.css`). It also added the Geist font through `next/font/google`, which is downloaded at build time and self-hosted. Later components may add more, such as `react-resizable-panels` for the resizable layout. Each `init` or `add` that installs packages needs approval like any other dependency. Review the package list the CLI prints before accepting it.

## 2. Application Architecture

- Use React Server Components by default.
- Use Client Components for interactive UI and browser-specific functionality.
- Use Next.js Route Handlers for backend proxy execution.
- Keep domain logic independent of React components and framework-specific UI code.

## 3. Forms and Validation

| Technology          | Responsibility                     |
| ------------------- | ---------------------------------- |
| React Hook Form     | Form state and submission          |
| Zod                 | Schema definition and validation   |
| @hookform/resolvers | Integrate Zod with React Hook Form |

Use shared validation schemas where appropriate to maintain consistent request validation.

## 4. HTTP and API Integration

- Use the native Fetch API for browser-direct execution.
- Use Fetch within Next.js Route Handlers for backend proxy execution, on the Node.js runtime. The upstream transport may change to `node:https` if needed to close DNS rebinding (`DECISIONS.md` OD-2).
- Avoid additional HTTP client dependencies unless a demonstrated requirement justifies them.
- Normalize responses into the application's response model.
- Handle network errors, HTTP error responses, and response-processing errors separately.
- Explicitly control caching for user-triggered API requests. Do not unintentionally reuse cached responses.

## 5. State Management

- Use React component state for local UI state.
- Use Context only when state genuinely needs to be shared across component boundaries.
- Do not use Redux Toolkit for the MVP.
- Saved templates are the only request data kept in the browser: IndexedDB through a small in-house wrapper, with optional Web Crypto encryption and no library (ADR-026, ADR-027). The theme preference cookie is the only other stored value (ADR-018).
- Keep request configuration and execution state organized around the agreed domain model.

Reconsider external state management only if application complexity demonstrates a need.

## 6. Response Visualization

- Provide formatted JSON and syntax highlighting.
- Support plain-text responses and appropriate fallbacks.
- Keep response rendering separate from response processing.

JSON highlighting is written in-house, with no highlighting library (ADR-015).

## 7. Testing

### MVP testing stack

Following the Next.js 16.4 Vitest guide (ADR-019):

- Vitest — test runner and unit tests.
- `@vitejs/plugin-react` — Vitest integration. The `@/` alias resolves through Vite's native `resolve.tsconfigPaths` (ADR-019 note).
- React Testing Library (`@testing-library/react`, `@testing-library/dom`) — component tests.
- jsdom — DOM environment for component tests only.
- `@testing-library/user-event` — realistic keyboard and pointer interactions, needed to test keyboard operability (added in M3).
- `fake-indexeddb` — an in-memory IndexedDB for testing template storage in Node (ADR-026, added in M5).

Optional, approved separately when first needed: `@testing-library/jest-dom` for DOM matchers.

### Future scope

- Playwright — end-to-end testing.

Introduce Playwright when the core application workflows are sufficiently established to justify browser-level automation.

## 8. Code Quality

- ESLint — linting, including import-direction rules (ADR-021).
- TypeScript strict mode — static type checking (`npm run typecheck`).
- Prettier — formatting (`npm run format:check`).
- Follow consistent project formatting and naming conventions.
- Avoid unnecessary dependencies and abstractions.

## 9. Dependency Principles

1. Prefer platform and framework capabilities before adding libraries.
2. Add dependencies only when they provide meaningful value.
3. Avoid overlapping libraries with duplicate responsibilities.
4. Review maintenance, compatibility, bundle impact, and security before adoption.
5. Keep dependencies compatible with the selected Next.js and React versions.
6. Commit `package-lock.json` to version control.

## 10. Version Policy

- Start with the latest stable Next.js release.
- Use its compatible React version.
- Avoid experimental or canary releases unless a specific requirement justifies them.
- Verify official documentation before adopting version-sensitive APIs or implementation patterns.
- Record significant dependency upgrades and breaking changes.

## 11. Official References

- Next.js: https://nextjs.org/docs. The version-matched copy ships in `node_modules/next/dist/docs/` and takes precedence when it differs from the website.
- Next.js Route Handlers: https://nextjs.org/docs/app/getting-started/route-handlers
- Next.js Fetch: https://nextjs.org/docs/app/api-reference/functions/fetch
- shadcn/ui: https://ui.shadcn.com/docs
- React Hook Form: https://react-hook-form.com/get-started
- Zod: https://zod.dev
- React Hook Form Resolvers: https://github.com/react-hook-form/resolvers
- Tailwind CSS: https://tailwindcss.com/docs
- Prettier: https://prettier.io/docs
- Vitest: https://vitest.dev/guide/
- Playwright: https://playwright.dev/docs/intro
