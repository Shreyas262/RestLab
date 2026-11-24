# RestLab

A browser-based REST API playground. Configure an HTTP request, run it directly from the browser or through a Next.js backend proxy, and inspect the response.

Status: in development. See [`docs/PROGRESS.md`](docs/PROGRESS.md).

## Requirements

- Node.js 20.9 or later (developed on Node 24)
- npm

## Setup

```sh
git clone https://github.com/Shreyas262/RestLab.git
cd RestLab
npm install
npm run dev
```

Then open http://localhost:3000.

## Scripts

| Script                 | What it does                                           |
| ---------------------- | ------------------------------------------------------ |
| `npm run dev`          | Start the development server                           |
| `npm run build`        | Create a production build                              |
| `npm run start`        | Serve the production build                             |
| `npm run lint`         | Run ESLint, including the layer import-direction rules |
| `npm run typecheck`    | Type-check with TypeScript (`tsc --noEmit`)            |
| `npm run format`       | Format all files with Prettier                         |
| `npm run format:check` | Check formatting without changing files                |
| `npm run test`         | Run all tests once with Vitest                         |
| `npm run test:watch`   | Run tests in watch mode                                |

## Stack

Next.js (App Router), React with the React Compiler, TypeScript (strict), Tailwind CSS v4, shadcn/ui on Radix, React Hook Form with Zod, Vitest and React Testing Library. Details in [`docs/TECH_STACK.md`](docs/TECH_STACK.md).

## Documentation

The documents in [`docs/`](docs/) are the source of truth:

- [`REQUIREMENTS.md`](docs/REQUIREMENTS.md) and [`PROJECT_OVERVIEW.md`](docs/PROJECT_OVERVIEW.md): scope
- [`ARCHITECTURE.md`](docs/ARCHITECTURE.md): code structure and dependency rules
- [`API_INTEGRATION.md`](docs/API_INTEGRATION.md): HTTP handling, proxy contract, SSRF controls
- [`DECISIONS.md`](docs/DECISIONS.md): architecture decisions and open questions
- [`PROJECT_PLAN.md`](docs/PROJECT_PLAN.md) and [`PROGRESS.md`](docs/PROGRESS.md): plan and status
- [`CHANGELOG.md`](docs/CHANGELOG.md): history of changes

Contributor and agent rules are in [`AGENTS.md`](AGENTS.md).
