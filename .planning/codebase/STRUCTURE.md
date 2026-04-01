# Directory Structure

## Project Root
```
SilphCo2/
├── .agent/                    # GSD agent system (skills, workflows)
├── .eslintrc.json             # ESLint config (Next.js defaults)
├── .gitignore
├── .next/                     # Next.js build output (gitignored)
├── .vscode/                   # VS Code settings
├── GEMINI.md                  # AI context document
├── README.md                  # Project readme
├── next-env.d.ts              # Next.js TypeScript env declarations
├── next.config.js             # Next.js configuration
├── node_modules/              # Dependencies
├── nuzlocke.data-main/        # Raw Nuzlocke source data (leagues, routes, patches)
├── package.json               # Dependencies & scripts
├── package-lock.json
├── postcss.config.js          # PostCSS plugins (Tailwind + Autoprefixer)
├── public/                    # Static assets (served at /)
├── scripts/                   # ETL build scripts (TypeScript)
├── src/                       # Application source code
├── tailwind.config.ts         # Tailwind theme extensions
├── tsconfig.json              # TypeScript config (app)
├── tsconfig.script.json       # TypeScript config (build scripts)
└── tsconfig.tsbuildinfo       # TS incremental build cache
```

## Source Code (`src/`)
```
src/
├── app/                       # Next.js App Router
│   ├── [lang]/                # i18n dynamic segment (es/en)
│   │   ├── layout.tsx         # Root layout (fonts, sidebar, providers)
│   │   └── (hub)/             # Main content group
│   │       ├── page.tsx       # Hub landing page
│   │       ├── HubPageView.tsx # Hub client component
│   │       ├── (academy)/     # Academy route group
│   │       │   └── academy/   # Academy pages
│   │       ├── (nuzlocke)/    # Nuzlocke route group
│   │       │   └── nuzlocke/  # Nuzlocke pages
│   │       ├── (tools)/       # Tools route group
│   │       ├── pokedex/       # Pokédex listing & detail
│   │       │   ├── page.tsx   # Pokédex grid page
│   │       │   └── [pokemonId]/ # Dynamic Pokémon detail
│   │       ├── competitive/   # Competitive dashboard
│   │       │   ├── page.tsx   # SSR wrapper
│   │       │   └── CompetitiveClient.tsx # Interactive dashboard (35K)
│   │       ├── moves/         # MoveDex listing & detail
│   │       │   ├── page.tsx   # Move listing (15K)
│   │       │   └── [id]/      # Move detail page
│   │       ├── items/         # ItemDex listing & detail
│   │       │   ├── page.tsx   # Item listing
│   │       │   └── [id]/      # Item detail page
│   │       ├── abilities/     # AbilityDex listing & detail
│   │       │   ├── page.tsx   # Ability listing (12.6K)
│   │       │   └── [id]/      # Ability detail page
│   │       └── dex/           # Dex landing (overview)
│   │           ├── page.tsx
│   │           └── DexLanding.tsx
│   ├── api/                   # API Route Handlers
│   │   ├── competitive/route.ts  # Smogon data extraction (11K)
│   │   └── formats/route.ts     # Format tree generation (5.6K)
│   ├── tools/                 # Standalone tools (outside lang scope)
│   │   ├── layout.tsx
│   │   └── type-calculator/   # Type effectiveness calculator
│   ├── globals.css            # Global styles, scrollbar, animations
│   └── favicon.ico
│
├── components/                # React Components (by domain)
│   ├── academy/               # Academy section
│   │   ├── AcademyHeaderLite.tsx
│   │   └── ModuleCard.tsx     # (7K)
│   ├── competitive/           # Competitive analysis
│   │   ├── BattleGimmickGallery.tsx  # (25.7K) Mega/Z/Tera gallery
│   │   ├── RolesAnalysis.tsx         # (16.5K) Offensive/defensive role breakdown
│   │   ├── SpeedTierBar.tsx          # (6.5K)
│   │   ├── TacticalDrawer.tsx        # (16.5K) Per-Pokémon competitive detail
│   │   ├── TeamDetailModal.tsx       # (11.4K) Top-cut team viewer
│   │   └── TypeEcosystem.tsx         # (9.4K) Type distribution chart
│   ├── hub/                   # Hub/landing components
│   │   ├── HeroContent.tsx    # Landing hero section
│   │   ├── HubNavigation.tsx  # Hub nav cards
│   │   └── IntroSimulation.tsx # Animated intro (8K)
│   ├── items/                 # Item section
│   │   ├── ItemDexFinderClient.tsx  # (7K) Search/filter client
│   │   ├── ItemStatCalculator.tsx   # (14.8K) Item stat impact calculator
│   │   └── PokemonAvatar.tsx
│   ├── layout/                # App shell
│   │   ├── CustomScrollbar.tsx     # (4.7K) Cyberpunk scrollbar
│   │   ├── FullSidebar.tsx         # (11.8K) Main navigation sidebar
│   │   ├── GlobalSearchBar.tsx     # (11.4K) Omni-search overlay
│   │   └── ScrollProvider.tsx      # Lenis scroll wrapper
│   ├── navigation/            # Sub-navigation
│   │   ├── ModuleCards.tsx    # Module selection UI
│   │   └── StickySubNav.tsx   # (6.4K) Sticky section nav
│   ├── nuzlocke/              # Nuzlocke tools
│   │   ├── FieldTool.tsx      # Field effects tool
│   │   ├── NuzlockeDashboard.tsx  # Dashboard container
│   │   └── TacticalFile.tsx   # Tactical analysis viewer
│   ├── pokedex/               # Pokédex system (largest domain)
│   │   ├── AbilityChip.tsx    # (4.8K)
│   │   ├── DetailDeck.tsx     # Tab container for viewports
│   │   ├── PokemonDetailView.tsx  # Detail page orchestrator
│   │   ├── PokemonMasterPanel.tsx # (10.9K) Main info panel
│   │   ├── StatsDisplay.tsx   # Short stat bar display
│   │   ├── grid/              # Grid/listing components
│   │   │   ├── DexFilterPanel.tsx    # (14.1K) Advanced filtering
│   │   │   ├── DexLandingView.tsx    # (7.7K) Grid landing
│   │   │   └── TacticalDexCard.tsx   # (9K) Pokémon card
│   │   ├── layout/            # Pokédex layout helpers
│   │   ├── navigation/        # Pokédex nav
│   │   └── viewports/         # Detail view tabs
│   │       ├── EvolutionChart.tsx     # (52.6K) Evolution tree visualizer
│   │       ├── LocationMatrix.tsx     # (9.6K) Location/version matrix
│   │       ├── MoveRegistry.tsx       # (29.7K) Full move table
│   │       ├── VisualStats.tsx        # (15.9K) Stat radar + analysis
│   │       ├── ViewportData.tsx       # Data tab wrapper
│   │       ├── YieldData.tsx          # (8K) EV/drop yields
│   │       ├── Placeholders.tsx       # Loading placeholders
│   │       ├── competitive/           # Competitive viewport
│   │       └── nuzlocke/             # Nuzlocke viewport
│   ├── providers/             # Context providers
│   │   └── QueryProvider.tsx  # React Query wrapper
│   ├── scenes/                # Narrative scene system
│   │   ├── NarrativeScene.tsx # (13.8K) Scene controller
│   │   └── visuals/           # Scene visual components
│   ├── tools/                 # Tools section
│   │   ├── ToolTile.tsx       # Tool card component
│   │   └── ToolsDashboard.tsx # Tools overview
│   └── ui/                    # Shared UI primitives
│       ├── DexSelector.tsx    # Dex region picker
│       ├── FormSelector.tsx   # Form/variant picker
│       ├── HeroHeader.tsx     # Reusable hero header
│       ├── HoloAsset.tsx      # Holographic image wrapper
│       ├── ReadingProgress.tsx # Reading progress indicator
│       ├── StatRadarChart.tsx # (4.6K) SVG radar chart
│       ├── TacticalIcon.tsx   # Role/archetype icons
│       ├── TextScramble.tsx   # Text glitch effect
│       ├── TypeBadge.tsx      # (2.5K) Type pill badge
│       ├── TypeHeatmap.tsx    # Type effectiveness heatmap
│       ├── UsageBar.tsx       # Horizontal usage bar
│       ├── modals/            # Modal components
│       └── tooltips/          # Tooltip components
│
├── data/                      # App data & config
│   ├── design_tokens.json     # Design system tokens
│   ├── games_index.json       # Game listing for Nuzlocke
│   ├── item_dex.json          # Item database (250K)
│   ├── move_dex.json          # Move database (840K)
│   ├── movepool_dex.json      # Movepool database (33MB!)
│   ├── navigation.ts          # Navigation tree factories
│   ├── pokedex_base_stats.json # Base stats (232K)
│   ├── pokedex_ids.json       # Name→ID mapping
│   ├── smogon_formats.ts      # Static format definitions
│   └── modules/module_1/     # Academy module content
│
├── hooks/                     # Custom React hooks
│   ├── useGlobalSearch.ts     # Fuse.js lazy search
│   ├── useNuzlockeAnalysis.ts # Nuzlocke simulation orchestrator
│   └── usePokemonNavigation.ts # Dex navigation state
│
├── i18n/                      # Internationalization
│   ├── settings.ts            # Locale config (es, en)
│   ├── get-dictionary.ts      # Dynamic import dictionary loader
│   └── dictionaries/         # Translation JSON files
│       └── ...
│
├── lib/                       # Core logic
│   ├── pokedexDictionary.ts   # (17.9K) Bilingual Pokédex labels
│   ├── typeLogic.ts           # (4.9K) Type effectiveness engine
│   ├── utils.ts               # General utilities
│   ├── dictionaries/          # Additional dictionaries
│   │   └── nuzlockeDict.ts    
│   └── utils/                 # Heavy logic utilities
│       ├── competitive-analysis.ts   # (17K) Meta analysis
│       ├── competitive-mapping.ts    # (8.3K) Trait mapping
│       ├── nuzlockeEngine.ts         # (34.7K) Battle simulator
│       ├── pokemon-normalizer.ts     # (4.1K) Name normalization
│       ├── smogon-raw-utils.ts       # (3.2K) Smogon utilities
│       └── smogonHelper.ts           # (5.4K) Smogon helpers
│
├── middleware.ts              # Locale middleware
├── services/                  # External service clients
│   ├── pokeapi.ts             # (23.7K) PokeAPI service + hooks
│   └── smogonService.ts       # Smogon data fetcher
│
├── types/                     # TypeScript type definitions
│   ├── interfaces.ts          # (4.8K) Core domain interfaces
│   ├── competitive.ts         # (2.5K) Competitive dashboard types
│   ├── smogon.ts              # (1.8K) Smogon response types
│   ├── nuzlocke.ts            # (7.1K) Nuzlocke game/boss types
│   ├── silph.ts               # (2.7K) Narrative scene types
│   ├── items.ts               # (1.9K) Item types
│   ├── search.ts              # Global search types
│   ├── abilitydex.ts          # Ability types
│   ├── movedex.ts             # Move types
│   ├── pokedex.ts             # Pokedex types
│   └── pokemon.ts             # Pokemon types
│
└── utils/                     # (empty — logic lives in lib/utils/)
```

## Public Assets (`public/`)
```
public/
├── data/                      # Pre-built data files
│   ├── abilities/             # Ability detail JSONs
│   ├── competitive/           # Competitive meta dashboards
│   ├── games/                 # Nuzlocke game data (manifest/bosses/patch)
│   ├── items/                 # Item detail JSONs
│   ├── moves/                 # Move detail JSONs
│   ├── smogon/                # Smogon CHAOS files + meta.json
│   ├── tournaments/           # Tournament data
│   ├── *.json                 # Various index files
│   └── ...
├── images/                    # Static images
│   └── items/                 # Item sprites
└── *.svg                      # Misc SVG assets
```

## Build Scripts (`scripts/`)
```
scripts/
├── build-abilitydex.ts        # AbilityDex index builder
├── build-global-search.ts     # Global search index builder
├── build-item-dex.ts          # ItemDex builder
├── build-meta-dashboard.ts    # (32K) Competitive meta aggregator
├── build-movedex.ts           # MoveDex builder
├── build-smogon-dashboard.ts  # (29K) Smogon dashboard builder
├── download-pokemon-assets.ts # Sprite downloader
├── download-shiny-high-res.ts # Shiny sprite downloader
├── download-variants-assets.ts # Variant sprite downloader
├── enrich-itemdex.ts          # Item enrichment
├── generate-alias-map.ts      # Alias map generator
├── generate-base-dex.ts       # Base stat dex generator
├── generate-game-index.ts     # Game index generator
├── generate-ids-dex.ts        # ID mapping generator
├── generate-move-dex.ts       # Move dex generator
├── generate-movepool-dex.ts   # Movepool dex generator
├── generate-pokedex-index.ts  # Pokédex index generator
├── generate-speed-dex.ts      # Speed map generator
├── generate-tier-data.ts      # Tier data generator
├── generate-traits-map.ts     # Traits map generator
├── legacy-parser.ts           # (35.6K) Legacy data parser
├── patch-variants-stats.ts    # Variant stat patcher
├── pikalytics-scraper.ts      # Pikalytics scraper
├── rk9-scraper.ts             # (12.7K) RK9 tournament scraper
├── test-rk9.ts                # RK9 scraper test
├── update-smogon-data.ts      # (10.6K) Smogon data updater
└── utils/                     # Shared script utilities
```

## Key Location Summaries
| What | Where |
|------|-------|
| App entry | `src/app/[lang]/layout.tsx` |
| Main landing | `src/app/[lang]/(hub)/page.tsx` |
| Pokédex grid | `src/app/[lang]/(hub)/pokedex/page.tsx` |
| Pokémon detail | `src/app/[lang]/(hub)/pokedex/[pokemonId]/` |
| Competitive dashboard | `src/app/[lang]/(hub)/competitive/CompetitiveClient.tsx` |
| API routes | `src/app/api/competitive/route.ts`, `src/app/api/formats/route.ts` |
| Core service | `src/services/pokeapi.ts` |
| Type logic | `src/lib/typeLogic.ts` |
| Nuzlocke engine | `src/lib/utils/nuzlockeEngine.ts` |
| Type definitions | `src/types/` |
| Translations | `src/i18n/dictionaries/` |
| Build pipeline | `scripts/` |
