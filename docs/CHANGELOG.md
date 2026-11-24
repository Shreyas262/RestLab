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

### Changed

- Documentation location settled as root `docs/`, with application code under `src/` (ADR-001, ADR-002).
- Tailwind integration planned to move from `@tailwindcss/turbopack` to `@tailwindcss/postcss` (ADR-003). Not yet applied to `package.json`. Rationale corrected on 2026-11-24.
- ADR-009 (proxy envelope) accepted; field names remain open.
- Documentation finalized on 2026-11-24: statuses updated to match the repository, error categories aligned, inspector tabs defined, headers model corrected to match Fetch, execution plan revised in `PROJECT_PLAN.md`.

### Notes

- No product features are implemented yet. The repository contains a stub Next.js app (`src/app`) and documentation.
