# Tech Stack

## 1. Core Technologies

| Area            | Technology   | Decision                                           |
| --------------- | ------------ | -------------------------------------------------- |
| Framework       | Next.js      | Latest stable version, App Router                  |
| UI library      | React        | Version compatible with selected Next.js release   |
| Language        | TypeScript   | Strict mode                                        |
| Styling         | Tailwind CSS | Primary styling system                             |
| Components      | shadcn/ui    | Reusable, customizable UI components               |
| Package manager | npm          | Use `package-lock.json` for dependency consistency |

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
- Use Fetch within Next.js Route Handlers for backend proxy execution.
- Avoid additional HTTP client dependencies unless a demonstrated requirement justifies them.
- Normalize responses into the application's response model.
- Handle network errors, HTTP error responses, and response-processing errors separately.
- Explicitly control caching for user-triggered API requests. Do not unintentionally reuse cached responses.

## 5. State Management

- Use React component state for local UI state.
- Use Context only when state genuinely needs to be shared across component boundaries.
- Do not use Redux Toolkit for the MVP.
- Keep request configuration and execution state organized around the agreed domain model.

Reconsider external state management only if application complexity demonstrates a need.

## 6. Response Visualization

- Provide formatted JSON and syntax highlighting.
- Support plain-text responses and appropriate fallbacks.
- Keep response rendering separate from response processing.

The specific syntax-highlighting library remains an implementation decision. Evaluate bundle size, rendering performance, supported languages, and maintenance before selecting one.

## 7. Testing

### MVP testing stack

- Vitest — unit testing.
- React Testing Library — component testing.

### Future scope

- Playwright — end-to-end testing.

Introduce Playwright when the core application workflows are sufficiently established to justify browser-level automation.

## 8. Code Quality

- ESLint — linting.
- TypeScript strict mode — static type checking.
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

- Next.js: https://nextjs.org/docs
- Next.js Route Handlers: https://nextjs.org/docs/app/getting-started/route-handlers
- Next.js Fetch: https://nextjs.org/docs/app/api-reference/functions/fetch
- shadcn/ui: https://ui.shadcn.com/docs
- React Hook Form: https://react-hook-form.com/get-started
- Zod: https://zod.dev
- React Hook Form Resolvers: https://github.com/react-hook-form/resolvers
- Vitest: https://vitest.dev/guide/
- Playwright: https://playwright.dev/docs/intro
