# Testing

## Current State
**No formal test suite exists** in this project. There are no test directories, no test configuration files, and no test runner configured in `package.json`.

## What Exists

### Manual/Ad-hoc Testing
- `scripts/test-rk9.ts` — A standalone script that tests the RK9 tournament scraper. Not a unit test; it's an integration validation script run manually via `tsx`.

### Type-Level Validation
- TypeScript strict mode provides compile-time type checking
- Comprehensive type definitions in `src/types/` enforce structural contracts
- However, several `@ts-ignore` comments in `src/services/pokeapi.ts` and `src/hooks/useNuzlockeAnalysis.ts` bypass type safety

### Build-Time Validation
- `npm run lint` — ESLint with Next.js defaults
- `npm run build` — TypeScript compilation + Next.js build serves as a comprehensive type-check

## Test Infrastructure
| Component | Status |
|-----------|--------|
| Unit test framework | ❌ Not configured |
| Component testing | ❌ Not configured |
| E2E testing | ❌ Not configured (Playwright is installed but only used for scraping) |
| CI/CD | ❌ Not configured |
| Test coverage | ❌ Not tracked |

## Testability Assessment

### Highly Testable (Pure Logic)
- `src/lib/typeLogic.ts` — Pure functions for type effectiveness calculations
- `src/lib/utils/pokemon-normalizer.ts` — Pure name normalization utilities
- `src/lib/utils/competitive-analysis.ts` — Pure competitive analysis algorithms
- `src/lib/utils/nuzlockeEngine.ts` — Self-contained simulation engine (35K lines)
- `src/app/api/competitive/route.ts` — Deterministic data processing

### Moderately Testable (Hooks)
- `src/hooks/useGlobalSearch.ts` — Would need Fuse.js mock
- `src/hooks/useNuzlockeAnalysis.ts` — Complex but self-contained simulation pipeline
- `src/services/pokeapi.ts` — Would need PokeAPI response mocks

### Hard to Test (Complex UI)
- `src/components/pokedex/viewports/EvolutionChart.tsx` (52K) — SVG rendering + complex tree traversal
- `src/app/[lang]/(hub)/competitive/CompetitiveClient.tsx` (35K) — Heavy interactive UI

## Recommendations
1. **Quick win:** Add unit tests for `typeLogic.ts` — small, pure functions, high value
2. **High value:** Test `nuzlockeEngine.ts` — complex simulation with many edge cases
3. **Infrastructure:** Add Vitest (Next.js 13 compatible) + React Testing Library
4. **E2E potential:** Playwright is already a dependency — could be repurposed from scraping to E2E tests
