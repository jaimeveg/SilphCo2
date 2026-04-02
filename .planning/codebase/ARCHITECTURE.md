# Architecture

## Pattern
**Next.js 13 App Router** with a hybrid server/client rendering strategy:
- **Server Components** for layouts, page shells, and data-heavy initial renders
- **Client Components** for interactive UI (search, filters, competitive dashboard, Pokédex detail views)
- **API Route Handlers** for server-side data processing (Smogon CHAOS JSON parsing)
- **Static JSON indexes** prebuilt via ETL scripts for offline-capable client querying

## Runtime Architecture

```
┌────────────────────────────────────────────────────────────┐
│                        Browser (Client)                    │
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  React Query │  │  Fuse.js     │  │  Framer Motion   │  │
│  │  (Data Layer)│  │  (Search)    │  │  (Animations)    │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────┘  │
│         │                 │                                │
│  ┌──────▼─────────────────▼────────────────────────────┐   │
│  │              Component Tree                         │   │
│  │  Layout → Sidebar → Main → Page → Viewports         │   │
│  └───────────────────────┬─────────────────────────────┘   │
│                          │                                 │
│              ┌───────────▼────────────┐                    │
│              │    Services Layer      │                    │
│              │  pokeapi.ts (hooks)    │                    │
│              │  smogonService.ts      │                    │
│              └───────┬───────┬────────┘                    │
└──────────────────────┼───────┼─────────────────────────────┘
                       │       │
          ┌────────────▼───┐  ┌▼────────────────────┐
          │   PokeAPI v2   │  │  Next.js API Routes │
          │   (External)   │  │  /api/competitive   │
          └────────────────┘  │  /api/formats       │
                              └─────────┬───────────┘
                                        │
                              ┌─────────▼────────────┐
                              │  public/data/smogon/ │
                              │  (Static JSON Files) │
                              └──────────────────────┘
```

## Layers

### 1. Routing Layer (`src/app/`)
- **Middleware** (`src/middleware.ts`): Locale detection, redirects non-localized URLs to `/{defaultLocale}/...`
- **Root Layout** (`src/app/[lang]/layout.tsx`): Font loading, QueryProvider, Sidebar, ScrollProvider
- **Route Groups**: `(hub)` wraps all main pages, `(academy)`, `(nuzlocke)`, `(tools)` for sub-layouts
- **Dynamic Routes**: `[lang]`, `[pokemonId]`, `[id]` (for moves, items, abilities)

### 2. Service Layer (`src/services/`)
- `pokeapi.ts` — **Central data service**. Exports React Query hooks (`usePokemon`, `useMoveDetail`, `useMachine`, `usePokedexEntries`, `useNationalDexLookup`). Handles PokeAPI data fetching, multi-dex resolution, evolution chain processing, location encounters, form translations (EN/ES).
- `smogonService.ts` — Fetches competitive data via internal API routes. Exports `fetchFormatsIndex` and `fetchSmogonData`.

### 3. Component Layer (`src/components/`)
Organized by domain:
- **`layout/`** — Shell components: `FullSidebar`, `GlobalSearchBar`, `ScrollProvider`, `CustomScrollbar`
- **`pokedex/`** — Pokédex views: grid (landing, cards, filters), viewports (stats, evolution, moves, locations, competitive, nuzlocke)
- **`competitive/`** — Dashboard components: `BattleGimmickGallery`, `RolesAnalysis`, `SpeedTierBar`, `TypeEcosystem`, `TeamDetailModal`, `TacticalDrawer`
- **`hub/`** — Hub landing: `HeroContent`, `HubNavigation`, `IntroSimulation`
- **`navigation/`** — Sub-nav: `ModuleCards`, `StickySubNav`
- **`scenes/`** — Academy narrative: `NarrativeScene` with visual signature system
- **`academy/`** — Academy UI: `AcademyHeaderLite`, `ModuleCard`
- **`nuzlocke/`** — Nuzlocke tools: `NuzlockeDashboard`, `FieldTool`, `TacticalFile`
- **`items/`** — Item views: `ItemDexFinderClient`, `ItemStatCalculator`, `PokemonAvatar`
- **`tools/`** — Utility tools: `ToolTile`, `ToolsDashboard`
- **`ui/`** — Shared primitives: `TypeBadge`, `StatRadarChart`, `UsageBar`, `TypeHeatmap`, `HoloAsset`, `TextScramble`, `DexSelector`, `FormSelector`, etc.
- **`providers/`** — Context wrappers: `QueryProvider` (React Query)

### 4. Logic Layer (`src/lib/`)
- `typeLogic.ts` — Pokémon type effectiveness calculations (weakness, resistance, immunity charts for all 18 types)
- `pokedexDictionary.ts` — Bilingual dictionary for Pokédex UI labels, evolution descriptions, form names
- `utils/competitive-analysis.ts` — Competitive meta analysis algorithms (17K)
- `utils/competitive-mapping.ts` — Pokémon-to-competitive-trait mapping
- `utils/nuzlockeEngine.ts` — **Battle simulation engine** (35K) — analyzes Nuzlocke viability through boss matchup simulation
- `utils/pokemon-normalizer.ts` — Name/slug normalization utilities
- `utils/smogon-raw-utils.ts` / `smogonHelper.ts` — Smogon data processing helpers

### 5. Data Layer (`src/data/`)
- Static JSON files loaded at build time or lazy-loaded at runtime
- `navigation.ts` — Navigation tree factory functions (i18n-aware)
- `smogon_formats.ts` — Static format definitions
- `design_tokens.json` — Design system tokens (glassmorphism, animation easing, scroll triggers)
- `modules/module_1/` — Academy module content data

### 6. Hooks Layer (`src/hooks/`)
- `useGlobalSearch.ts` — Lazy-loaded Fuse.js search across Pokémon/moves/items/abilities
- `useNuzlockeAnalysis.ts` — Orchestrates Nuzlocke analysis: loads game data, applies patches, runs simulation engine
- `usePokemonNavigation.ts` — Pokédex navigation state management

### 7. Type System (`src/types/`)
- `interfaces.ts` — Core domain types: `IPokemon`, `IStat`, `IAbility`, `IEvolutionNode`, `IMoveDetail`, `ILocationEncounter`
- `competitive.ts` — Macro dashboard types: `IMacroDashboardData`, `ITypeEcosystem`, `IRolesAnalysis`, `ITopCutTeam`
- `smogon.ts` — Smogon API response types: `CompetitiveResponse`, `IRawStatData`
- `nuzlocke.ts` — Game manifest, boss database, balance patch, battle simulation types
- `silph.ts` — Academy narrative scene discriminated union types
- `items.ts` — Item database, mechanics, usage types
- `search.ts` — Global search node type

### 8. i18n Layer (`src/i18n/`)
- `settings.ts` — Locale config: `['es', 'en']`, default `'es'`
- `get-dictionary.ts` — Dynamic import-based dictionary loader (code-split per locale)
- `dictionaries/` — JSON translation files (ES/EN)

## Data Flow

### Pokédex Detail View
```
User clicks Pokémon card
  → [pokemonId]/page.tsx renders PokemonDetailView
    → usePokemon(id, lang) hook fires
      → React Query fetches from PokeAPI v2
        → /pokemon/{id} + /pokemon-species/{id} + abilities + evolution chain + encounters
      → Returns IPokemon with stats, types, abilities, evolution tree, locations
    → Viewport tabs render: VisualStats, EvolutionChart, MoveRegistry, LocationMatrix, Competitive, Nuzlocke
    → Variant prefetching auto-triggers for all forms
```

### Competitive Analysis
```
User selects format in CompetitiveClient
  → fetchFormatsIndex() → /api/formats (builds tree from filesystem)
  → fetchSmogonData(pokemonId, date, fileId) → /api/competitive
    → Server reads public/data/smogon/{fileId}
    → Extracts moves, items, abilities, teammates, counters, spreads, Tera types
    → Calculates speed tier percentile against meta
    → Returns CompetitiveResponse
```

### Nuzlocke Viability
```
User selects game → useNuzlockeAnalysis hook
  → Fetches /data/games/{gamePath}/manifest.json + bosses.json + patch.json
  → Applies balance patches to base stat/move dexes (deep clone + merge)
  → analyzeNuzlockeViability() engine simulates every boss battle
    → Calculates matchup results, role assignments, availability by phase
  → Returns SimulationResult with tier, phase breakdown, roles
```

## Entry Points
- **Web app:** `src/app/[lang]/layout.tsx` → root layout
- **Hub landing:** `src/app/[lang]/(hub)/page.tsx` → HubPageView
- **API:** `src/app/api/competitive/route.ts`, `src/app/api/formats/route.ts`
- **Build scripts:** `scripts/*.ts` (run via `tsx` / `ts-node`)
