# Technology Stack

## Runtime & Language
- **Runtime:** Node.js
- **Language:** TypeScript 5.9.x (`tsconfig.json` targets ES5 with `esnext` modules, bundler resolution)
- **Strict mode:** Enabled (`"strict": true`)
- **Path aliases:** `@/*` → `./src/*`

## Framework
- **Next.js 13.5.1** — App Router architecture (NOT Pages Router)
  - Server components by default; client components use `'use client'` directive
  - `[lang]` dynamic segment at root for i18n routing
  - Route groups `(hub)`, `(academy)`, `(nuzlocke)`, `(tools)` for layout segmentation
  - API routes in `src/app/api/` (Route Handlers)
  - Custom middleware for locale detection/redirect (`src/middleware.ts`)
  - Dev server on port **3050** (`next dev -p 3050`)

## Styling
- **TailwindCSS 3.3.3** — Primary styling system
  - Custom design tokens: `slate-950` (deep space bg), `brand-cyan` (#38BDF8 neon pulse)
  - Custom fonts: Inter (body), Space Grotesk (display) via `next/font/google`
  - Custom animations: `pulse-slow`, neon drop-shadow
  - Glassmorphism patterns via `design_tokens.json`
- **PostCSS 8.4.30** + Autoprefixer
- **Global CSS** (`src/app/globals.css`):
  - Custom scrollbar styles (cyberpunk theme)
  - Holographic glitch animation
  - Neon border box utility

## Core Dependencies

### Data Fetching & State
| Package | Version | Purpose |
|---------|---------|---------|
| `@tanstack/react-query` | ^5.90.16 | Client-side data fetching, caching, prefetching |
| `axios` | ^1.13.3 | HTTP client (used in build scripts) |

### UI & Animation
| Package | Version | Purpose |
|---------|---------|---------|
| `framer-motion` | ^12.23.26 | Page transitions, viewport animations, micro-interactions |
| `lucide-react` | ^0.562.0 | Icon system (all navigation icons) |
| `clsx` | ^2.1.1 | Conditional className joining |
| `tailwind-merge` | ^3.4.0 | Tailwind class conflict resolution |

### Search
| Package | Version | Purpose |
|---------|---------|---------|
| `fuse.js` | ^7.1.0 | Client-side fuzzy search (lazy-loaded) |

### Scrolling
| Package | Version | Purpose |
|---------|---------|---------|
| `@studio-freight/react-lenis` | ^0.0.47 | Smooth scroll provider |

### Web Scraping (Build-Time)
| Package | Version | Purpose |
|---------|---------|---------|
| `cheerio` | ^1.2.0 | HTML parsing for Pikalytics/RK9 scrapers |
| `playwright` | ^1.58.2 | Browser automation for scraping |

## Dev Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^5.9.3 | Type system |
| `tsx` / `ts-node` | ^4.21.0 / ^10.9.2 | Script runners for ETL pipelines |
| `pokedex-promise-v2` | ^4.2.1 | PokeAPI SDK (build scripts) |
| `chalk` | ^4.1.2 | CLI output formatting |
| `inquirer` | ^8.2.7 | Interactive CLI prompts |
| `slugify` | ^1.6.6 | String normalization |
| `dotenv` | ^17.2.3 | Environment variable loading |

## Configuration Files
- `next.config.js` — Remote image patterns (GitHub raw content for sprites)
- `tailwind.config.ts` — Extended theme with custom colors, fonts, animations
- `tsconfig.json` — Main app config (bundler resolution, path aliases)
- `tsconfig.script.json` — Separate config for build scripts
- `postcss.config.js` — TailwindCSS + Autoprefixer plugins
- `.eslintrc.json` — NextJS default ESLint config

## Build & Scripts
- `npm run dev` — Development server (port 3050)
- `npm run build` — Production build
- `npm run lint` — ESLint
- **26 ETL/build scripts** in `scripts/` — TypeScript data pipeline tools
