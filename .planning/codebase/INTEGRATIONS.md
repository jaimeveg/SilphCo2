# External Integrations

## Runtime APIs (Client-Side)

### PokeAPI v2
- **URL:** `https://pokeapi.co/api/v2`
- **Usage:** Primary Pokémon data source at runtime
- **Service:** `src/services/pokeapi.ts`
- **Endpoints consumed:**
  - `/pokemon/{id}` — Base stats, sprites, types, abilities, moves
  - `/pokemon-species/{id}` — Evolution chains, varieties, Pokédex numbers, gender rates
  - `/pokedex/{id}` — Regional dex entries (National, Kanto through Paldea)
  - `/pokemon/{id}/encounters` — Location/version encounter data
  - `/move/{id}` — Move details (power, accuracy, type, flavor text)
  - `/machine/{id}` — TM/HM machine details
- **Caching:** React Query with `staleTime: 0` for Pokémon data, `24h` for moves/machines/dex entries
- **Prefetching:** Variant forms are auto-prefetched when base Pokémon loads
- **Error Handling:** Graceful fallback on 404s; evolution/location errors caught silently

### GitHub Raw Content (Sprites)
- **URL:** `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/`
- **Usage:** Official artwork and mini sprites
- **Config:** Allowed in `next.config.js` via `remotePatterns`
- **Fallback sprite:** Pokemon #0 sprite used when image unavailable

## Internal API Routes (Server-Side)

### `/api/competitive` (GET)
- **File:** `src/app/api/competitive/route.ts`
- **Purpose:** Extract per-Pokémon competitive data from Smogon CHAOS JSON files
- **Params:** `pokemon` (Dex ID), `fileId` (Smogon JSON filename), `date`
- **Data source:** `public/data/smogon/*.json` — Pre-downloaded Smogon usage stats
- **Processing:** Extracts moves, items, abilities, teammates, counters, nature spreads, Tera types
- **Speed analysis:** Calculates speed tier percentile against meta using `pokedex_speed_map.json`
- **Caching:** In-memory `speedMapCache` for speed map; Next.js `revalidate: 0` on client calls

### `/api/formats` (GET)
- **File:** `src/app/api/formats/route.ts`
- **Purpose:** Build dynamic format tree from Smogon data files
- **Data source:** `public/data/smogon/meta.json` + directory listing of `public/data/smogon/`
- **Processing:** Parses filenames to extract gen, mode (singles/doubles), format, regulation, ELO
- **Output:** Hierarchical tree: `gen → mode → formatName → regulation → ELO options`

## Build-Time Data Sources (ETL Scripts)

### PokeAPI (via `pokedex-promise-v2`)
- **Scripts:** `scripts/generate-base-dex.ts`, `scripts/generate-ids-dex.ts`, `scripts/generate-move-dex.ts`, etc.
- **Purpose:** Build static JSON indexes for offline use (base stats, move data, movepools, IDs)
- **Output:** `public/data/pokedex_*.json`, `public/data/move_dex.json`, `public/data/movepool_dex.json`

### Smogon (Usage Stats)
- **Script:** `scripts/update-smogon-data.ts`
- **Purpose:** Download and process CHAOS JSON files from Smogon's usage statistics
- **Output:** `public/data/smogon/*.json` — One file per format/ELO combination

### Pikalytics
- **Script:** `scripts/pikalytics-scraper.ts`
- **Purpose:** Scrape VGC ladder usage data
- **Technology:** Playwright browser automation + Cheerio HTML parsing
- **Output:** `public/data/pikalytics_ladder.json`

### RK9 (Tournament Data)
- **Script:** `scripts/rk9-scraper.ts`
- **Purpose:** Scrape tournament results and team compositions
- **Output:** `public/data/tournaments/`

### Meta Dashboard Builder
- **Script:** `scripts/build-meta-dashboard.ts` (32K lines)
- **Purpose:** Aggregate competitive data into macro-level dashboard (type ecosystem, roles, cores, gimmicks, rogue picks, top cut teams)
- **Input:** Smogon CHAOS files + traits map + alias map
- **Output:** `public/data/competitive/`

## Static Data Files (Pre-Built)

### Core Pokédex Data
| File | Size | Purpose |
|------|------|---------|
| `public/data/pokedex_index.json` | 4.7 MB | Complete Pokédex index with names/types/sprites |
| `public/data/movepool_dex.json` | ~33 MB | Full movepool database (all Pokémon × moves × learn methods) |
| `public/data/move_dex.json` | ~840 KB | Move database with power/accuracy/type/tactics |
| `public/data/pokedex_base_stats.json` | ~232 KB | Base stats for all Pokémon (used by Nuzlocke engine) |
| `public/data/item_dex.json` | ~250 KB | Item database with mechanics/sprites |
| `public/data/global_search_index.json` | ~338 KB | Fuse.js search index (Pokémon + moves + items + abilities) |

### Competitive Data
| File | Purpose |
|------|---------|
| `public/data/traits_map.json` | Pokémon competitive traits (roles, archetypes) |
| `public/data/alias_map.json` | Name alias resolution (forms, regional variants) |
| `public/data/pokedex_speed_map.json` | Base speed values for speed tier calculations |

### Nuzlocke Data  
| Directory | Purpose |
|-----------|---------|
| `public/data/games/` | Per-game manifest, boss teams, balance patches |
| `public/data/nuzlocke_availability.json` | Pokémon availability per game route |
| `nuzlocke.data-main/` | Raw Nuzlocke source data (leagues, routes, patches) |

## External Image Sources
- **PokeAPI Sprites:** Official artwork via GitHub CDN
- **Duiker101:** SVG type icons (referenced in `next.config.js` comments)
- **Local sprites:** `public/images/items/` — Item sprites (low-res + high-res)
