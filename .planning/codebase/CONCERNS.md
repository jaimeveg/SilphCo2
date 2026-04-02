# Concerns

## Technical Debt

### 1. Massive Component Files
Several components exceed reasonable size thresholds and would benefit from decomposition:

| File | Size (characters) | Concern |
|------|-------------------|---------|
| `src/components/pokedex/viewports/EvolutionChart.tsx` | 52.6K | Largest component — likely combines rendering, data transformation, and layout logic |
| `src/lib/utils/nuzlockeEngine.ts` | 34.7K | Battle simulation engine — complex but functional; would benefit from modularization |
| `src/app/[lang]/(hub)/competitive/CompetitiveClient.tsx` | 34.9K | Entire competitive dashboard in one client component |
| `scripts/legacy-parser.ts` | 35.6K | Legacy data parser — may contain dead code |
| `scripts/build-meta-dashboard.ts` | 32K | Complex ETL — tightly coupled |
| `src/components/pokedex/viewports/MoveRegistry.tsx` | 29.7K | Full move table with filtering/sorting |
| `scripts/build-smogon-dashboard.ts` | 29K | Complex ETL |
| `src/components/competitive/BattleGimmickGallery.tsx` | 25.7K | Mega/Z/Tera gallery component |
| `src/services/pokeapi.ts` | 23.7K | Mixes data fetching, constants, processing, hooks, and dictionaries |

### 2. `pokeapi.ts` Is a God File
`src/services/pokeapi.ts` (487 lines) serves too many roles:
- **Data constants:** Version metadata, dex maps, stat labels, form translations, evolution overrides
- **Data processing:** Evolution chain building, location parsing, form name formatting
- **React hooks:** `usePokemon`, `useMoveDetail`, `useMachine`, `usePokedexEntries`, `useNationalDexLookup`
- **Fetch functions:** `fetchPokemon`, `fetchMoveDetail`, `fetchMachineDetail`, `fetchPokedexEntries`, `fetchNationalDexLookup`

Should be split into: constants, transformers, hooks, and fetchers.

### 3. In-Memory Caching in API Routes
`src/app/api/competitive/route.ts` uses a module-level `speedMapCache` variable. This works in development but is fragile in serverless deployments where function instances are ephemeral.

### 4. `@ts-ignore` Usage
Found in:
- `src/services/pokeapi.ts` — Dynamic dictionary key access for evolution overrides
- `src/hooks/useNuzlockeAnalysis.ts` — Patch data merging with dynamic keys

These suppress legitimate type safety issues that should be addressed with proper typing.

### 5. Unused Empty Directory
`src/utils/` exists but is completely empty — all utility logic lives in `src/lib/utils/`. Should be removed.

### 6. Locked Academy Modules
`src/data/navigation.ts` defines 6 academy modules but modules 2-6 are `locked: true` with empty sections. This is planned future content but creates dead navigation structure.

## Performance Concerns

### 1. Massive Static JSON Files
| File | Size | Impact |
|------|------|--------|
| `src/data/movepool_dex.json` | 33 MB | Imported statically in `useNuzlockeAnalysis.ts` — could blow up bundle size |
| `public/data/movepool_dex.json` | 33 MB | Also exists in public — data duplication - other elements are duplicated, probably need to decide where to keep them and how to handle them |
| `public/data/pokedex_index.json` | 4.7 MB | Large index loaded for dex listing |

The `movepool_dex.json` (33MB) is imported via `import staticMovepoolDex from '@/data/movepool_dex.json'` in `useNuzlockeAnalysis.ts`, which could cause massive client-side bundle bloat if not properly tree-shaken or code-split.

### 2. N+1 API Call Pattern in `fetchPokemon`
The `fetchPokemon` function in `pokeapi.ts` makes sequential calls:
1. Fetch `/pokemon/{id}`
2. Fetch `/pokemon-species/{id}` (species data)
3. Fetch each ability URL (N abilities × 1 call each)
4. Fetch evolution chain
5. Fetch `/pokemon/{id}/encounters`

This results in 5+ network round trips per Pokémon. While React Query caches subsequent requests, the first load is slow. We now have some elements in local, might worth check if we can optimize this.

### 3. No Image Optimization for Sprites
Pokémon sprites are loaded from GitHub CDN raw URLs. No `next/image` optimization, no blur placeholders, no lazy loading strategy for sprite-heavy views (Pokédex grid).

## Security Considerations

### 1. No Authentication/Authorization
The application has no auth layer — all API routes and data are publicly accessible. This is acceptable for a read-only knowledge hub but would need attention if user-generated content is added.

### 2. Filesystem Access in API Routes
Both API routes (`/api/competitive`, `/api/formats`) read from the filesystem using `fs.readFile`. The `fileId` parameter in the competitive route is user-controlled and used directly to construct a file path:
```typescript
const filePath = path.join(process.cwd(), 'public/data/smogon', fileId);
```
While `path.join` prevents traversal, the `fileId` is not validated against a whitelist. A malicious `fileId` like `../../package.json` would be constrained by `path.join` but this should still be validated.

### 3. No Rate Limiting
API routes have no rate limiting — could be abused. The PokeAPI calls also have no rate limiting on the client side (though PokeAPI itself has limits).

### 4. Cache-Buster Pattern
The Smogon service uses `Date.now()` as a cache buster (`?v=${Date.now()}`), which bypasses any CDN/edge caching that might be configured.

### 5. Dependency Security Vulnerabilities (NPM Audit)
The dependency tree analysis reveals **6 vulnerabilities** (1 Critical, 3 High, 2 Moderate) that compromise the application's security posture, exposing it to Denial of Service (DoS) and Server-Side Request Forgery (SSRF). Crucially, the default automated remediation strategies proposed by npm represent a significant architectural risk.

**Critical Vulnerability:**
* **`next`**: The core framework flags severe attack vectors, including SSRF in Server Actions, Cache Poisoning, and multiple DoS flaws. 
  * *Operational Risk:* NPM's suggested fix requires running `--force`, which triggers a destructive downgrade to Next.js `13.5.11`. This action will almost certainly break the application if modern App Router or Server Actions features are currently in use.

**High Vulnerabilities:**
* **`minimatch`**: Presents multiple *ReDoS* (Regular Expression Denial of Service) risks via combinatorial backtracking. It is currently locked as a nested sub-dependency of the `@typescript-eslint` tooling. While this primarily affects the development and build environments, malicious or overly complex inputs can cause process hangs and exhaust memory.

**Moderate Vulnerabilities:**
* **`postcss` & `zod`**: Present risks for line return parsing errors and minor DoS vulnerabilities. Similar to the `next` package, NPM's automated fix incorrectly suggests a forced downgrade of the entire Next.js ecosystem to resolve these specific dependencies.

**Recommended Mitigation Plan (GSD Approach):**
1. **Strictly Avoid `--force`**: Under no circumstances should `npm audit fix --force` be executed, as it will compromise the application's framework foundation.
2. **Manual Upgrades**: Review the `package.json` to manually update `next`, `postcss`, and `zod` to their latest secure minor or patch versions within your current major release, bypassing npm's aggressive downgrade path.
3. **Dependency Overrides**: For locked sub-dependencies like `minimatch`, implement an `overrides` (or `resolutions` if using Yarn) block in the `package.json` to force the installation of a secure version (e.g., `>9.0.6`) across the entire dependency tree.

## Architecture Gaps

### 1. No Error Boundaries
No React Error Boundaries are implemented. A crash in any viewport component (EvolutionChart, MoveRegistry, etc.) would crash the entire page.

### 2. No Loading States Architecture  
Loading states are handled ad-hoc in individual components. No consistent skeleton/shimmer pattern across the app.

### 3. No Offline Support
Despite having large static JSON datasets, there's no service worker or offline caching strategy. The app could work well as a PWA.

### 4. i18n Dictionary Not Type-Safe
The dictionary is loaded as `any` type and passed through props without type validation:
```typescript
const dict = await getDictionary(params.lang as any);
```
Type-safe i18n would prevent runtime key-lookup failures.

### 5. Duplicate Data Files
Several data files exist in both `src/data/` and `public/data/`:
- `move_dex.json` — exists in both locations
- `movepool_dex.json` — exists in both locations  
- `pokedex_base_stats.json` — exists in both locations
- `item_dex.json` — exists in both locations
- `pokedex_ids.json` — exists in both locations
- `games_index.json` — exists in both locations

The `src/data/` copies are statically imported at build time for the Nuzlocke engine; the `public/data/` copies are served via HTTP for client-side fetching. This duplication risks them drifting out of sync.

## Fragile Areas

### 1. Version Metadata Map
`src/services/pokeapi.ts` contains a hardcoded `VERSION_METADATA` dictionary mapping every game version to its metadata. New game releases require manual updates to this dictionary, and the fallback logic for unknown versions is imprecise.

### 2. Nuzlocke Patch Merging
The patch application logic in `useNuzlockeAnalysis.ts` uses deep cloning (`JSON.parse(JSON.stringify(...))`) of 33MB+ JSON objects, which is expensive and fragile. It also does multi-strategy key lookups (by slug, name, cleaned slug, numeric ID) which could miss edge cases.

### 3. Smogon Filename Parser
`src/app/api/formats/route.ts` parses Smogon data filenames with regex to extract format metadata. This is brittle — any change in Smogon's naming conventions would break the tree builder.

### 4. Evolution Chain Recursion
`processEvolutionChain` in `pokeapi.ts` recursively processes evolution chains. While Pokémon evolution chains are typically shallow (max 3 levels), there's no depth guard against pathological PokeAPI data.
