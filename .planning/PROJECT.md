# SilphCo2

## What This Is

A bilingual (ES/EN) Pokémon companion web application built with Next.js and a cyberpunk glassmorphism design system. It serves as a knowledge hub combining a rich Pokédex with competitive Smogon analysis, a Nuzlocke battle simulation engine, an Academy narrative learning system, item databases, and utility tools. The app targets Pokémon trainers who want deep, data-driven insights across competitive and casual play.

## Core Value

The existing feature set must work flawlessly on any device, in both languages, and be safe to deploy to production. No broken layouts, no security holes, no runtime crashes from missing data.

## Requirements

### Validated

<!-- Shipped and confirmed valuable — inferred from existing codebase. -->

- ✓ Pokédex with detail views (stats, evolution, moves, locations, competitive, nuzlocke) — existing
- ✓ Competitive Smogon analysis dashboard with format browsing and meta breakdown — existing
- ✓ Nuzlocke battle simulation engine with game-specific boss matchups — existing
- ✓ Academy narrative module (Module 1) with visual signature scene system — existing
- ✓ Item database with stat calculators and usage data — existing
- ✓ Global fuzzy search across Pokémon, moves, items, and abilities — existing
- ✓ Bilingual routing with ES/EN locale detection and middleware redirect — existing
- ✓ Cyberpunk glassmorphism design system with Framer Motion animations — existing
- ✓ ETL pipeline (26 scripts) for Smogon data, movepool generation, and meta dashboards — existing
- ✓ Sidebar navigation with module grouping and route-aware highlighting — existing

### Active

<!-- v1.0 production hardening — feature freeze, no new features. -->

**Security & Framework**
- [ ] Upgrade Next.js to latest stable (14.x or 15.x) to resolve critical framework vulnerabilities (SSRF, cache poisoning, DoS)
- [ ] Resolve all npm audit vulnerabilities (minimatch ReDoS, postcss, zod) via manual upgrades and dependency overrides
- [ ] Validate and whitelist `fileId` parameter in `/api/competitive` route to prevent path traversal
- [ ] Add rate limiting to API routes (`/api/competitive`, `/api/formats`)
- [ ] Remove `Date.now()` cache-buster pattern in Smogon service to enable proper CDN/edge caching
- [ ] Ensure all API route patterns are compatible with Vercel's ephemeral serverless environment

**Performance**
- [ ] Optimize 33MB `movepool_dex.json` — chunk/lazy-load to eliminate client bundle bloat while preserving full queryability and ETL pipeline updatability
- [ ] Refactor ETL script (`scripts/generate-movepool-dex.ts`) to output optimized chunked structure
- [ ] Consolidate duplicate data files between `src/data/` and `public/data/` into single canonical locations
- [ ] Optimize N+1 API call pattern in `fetchPokemon` — parallelize independent PokeAPI requests
- [ ] Implement `next/image` optimization for Pokémon sprites with blur placeholders and lazy loading
- [ ] Replace in-memory `speedMapCache` in competitive API route with Vercel-compatible caching strategy

**Mobile Responsiveness**
- [ ] Implement responsive Pokédex detail layout — dedicated mobile structure for PokemonDetailView viewports (BIO, MOVES, TACTICS, NUZLOCKE)
- [ ] Build hybrid mobile navigation: bottom nav bar (Academy, Nuzlocke, Tools) + hamburger drawer (Search, Dexes, Competitive)
- [ ] Redesign Pokédex grid filters for mobile — compact/collapsible UI that doesn't stack vertically
- [ ] Polish Academy module layout for phone and tablet breakpoints
- [ ] Ensure full responsive coverage across all pages at < 640px (phone) and 768–1024px (tablet) breakpoints
- [ ] Maintain cyberpunk glassmorphism aesthetic at all viewport sizes

**i18n Finalization**
- [ ] Audit all user-facing strings for complete ES/EN translation coverage
- [ ] Implement type-safe dictionary system — replace `any` casts with strict typed dictionary access
- [ ] Verify i18n works correctly across all routes and components (exception: Pokémon technical terms and purely aesthetic UI text may remain in English)

**Stability & Resilience**
- [ ] Implement Next.js `error.tsx` boundaries at route level for all route groups
- [ ] Add lightweight component-level error catchers for complex viewports (EvolutionChart, MoveRegistry, CompetitiveClient)
- [ ] Implement consistent loading skeleton/shimmer pattern across the app — critical for masking PokeAPI waterfall latency
- [ ] Decompose `pokeapi.ts` god file into separate modules: constants, transformers, hooks, fetchers
- [ ] Remove `@ts-ignore` usages in `pokeapi.ts` and `useNuzlockeAnalysis.ts` — replace with proper typing
- [ ] Remove empty `src/utils/` directory
- [ ] Clean up dead code in `scripts/legacy-parser.ts`

### Out of Scope

<!-- Explicit boundaries — feature freeze for v1.0. -->

- Test infrastructure (Vitest, component tests, E2E) — deferred to v1.1 milestone after production launch
- Academy modules 2-6 content — locked modules stay locked, content is future work
- PWA / offline support / service worker — future enhancement
- Authentication / authorization system — not needed for a read-only knowledge hub
- Real-time features (WebSockets, live data) — not in scope
- New features of any kind — strict feature freeze
- OAuth or social login — unnecessary for current use case
- Component decomposition of large files (EvolutionChart 52K, CompetitiveClient 35K) beyond what's needed for error boundaries — cosmetic refactoring deferred
- Massive structural refactors to the 26 ETL scripts beyond the movepool_dex optimization — keep working pipelines stable

## Context

**Codebase state:** Fully functional brownfield Next.js 13.5.1 App Router application. All features work on desktop. The cyberpunk glassmorphism design system with Framer Motion animations is polished and cohesive on large screens. The ETL pipeline generates competitive data from Smogon CHAOS JSON files and supports multiple game generations.

**Critical constraint — movepool_dex.json lifecycle:** The 33MB `movepool_dex.json` is dynamically generated by the ETL script `scripts/generate-movepool-dex.ts` and is run on-demand when new Pokémon generations or games release. Any optimization (chunking, lazy loading, restructuring) MUST preserve: (1) full queryability by the application, and (2) the ETL script must be refactored to output the new optimized structure so the data remains easily updatable. The generation pipeline cannot break.

**Deployment context:** Targeting Vercel for production. All architecture decisions must account for ephemeral serverless functions — no persistent in-memory caches, no long-lived filesystem assumptions.

**Current pain points:**
- Mobile viewports are broken — Pokédex detail views cram viewports under the main panel
- 6 npm audit vulnerabilities including 1 critical (Next.js SSRF/DoS)
- 33MB JSON imported in client hooks could bloat the bundle
- No error boundaries — a single component crash takes down the page
- i18n dictionary loaded as `any` with no type safety

## Constraints

- **Framework:** Must upgrade Next.js but retain App Router architecture and all existing route patterns
- **Deployment:** Vercel serverless — no persistent state, no local filesystem writes at runtime
- **Data pipeline:** movepool_dex ETL must remain functional with any data restructuring
- **Feature freeze:** Zero new features — only hardening, fixing, and polishing existing functionality
- **Design system:** Cyberpunk glassmorphism aesthetic must be preserved across all breakpoints
- **i18n:** Pokémon technical terms (move names, ability names, type names) and purely aesthetic UI text may remain in English

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Upgrade to Next.js 14/15 (not patch 13.x) | Permanently resolve critical framework vulnerabilities rather than patching | — Pending |
| Defer test infrastructure to v1.1 | Writing meaningful coverage from scratch (especially 35K Nuzlocke engine) would derail v1.0 velocity | — Pending |
| Hybrid mobile navigation (bottom bar + hamburger) | Bottom nav for core hubs, drawer for secondary — balances quick access with information density | — Pending |
| Target Vercel for deployment | Informs all caching, filesystem, and serverless architecture decisions | — Pending |
| Preserve movepool_dex ETL pipeline | 33MB JSON optimization must not break the generation script used for game updates | — Pending |
| Type-safe i18n dictionary | Fix `any` casts now rather than accumulating more runtime key-lookup risk | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-03 after initialization*
