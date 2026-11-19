# Changelog

All notable changes to RestLab are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning will follow [Semantic Versioning](https://semver.org/) once releases begin.

Each feature conversation should add its entries under "Unreleased" and note them in `HANDOFF.md`.

## [Unreleased]

### Added

- Project documentation in `docs/`: `PROJECT_OVERVIEW.md`, `REQUIREMENTS.md`, `SYSTEM_DESIGN.md`, `TECH_STACK.md`, `UI_UX_GUIDELINES.md`.
- `ARCHITECTURE.md`: layers, dependency rules, proposed folder structure, execution flows.
- `DECISIONS.md`: ADR-001 to ADR-012.
- `API_INTEGRATION.md`: request construction, response handling, proxy contract and SSRF controls.
- `TESTING_STRATEGY.md`, `ROADMAP.md`, `PROJECT_PLAN.md`, `PROGRESS.md`.
- Root `AGENTS.md` with repository-specific agent instructions.

### Changed

- Documentation location settled as root `docs/`, with application code under `src/` (ADR-001, ADR-002).
- Tailwind integration planned to move from `@tailwindcss/turbopack` to `@tailwindcss/postcss` (ADR-003). Not yet applied to `package.json`.

### Notes

- No product features are implemented yet. The repository contains the initial Next.js scaffold (`src/app`) and documentation.
