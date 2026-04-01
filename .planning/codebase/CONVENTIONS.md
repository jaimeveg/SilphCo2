# Code Conventions

## Language & Style

### TypeScript
- **Strict mode** enabled globally
- **Path aliases:** `@/*` maps to `./src/*` (consistent across all imports)
- **Target:** ES5 with `esnext` module system
- Code is bilingual — comments and variable names mix English and Spanish naturally
  - Component names, interfaces, exports: **English**
  - Code comments, UI labels, documentation: **Spanish** (primary) with English fallbacks

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Components | PascalCase | `PokemonMasterPanel.tsx`, `TypeBadge.tsx` |
| Hooks | `use` prefix + PascalCase | `usePokemon`, `useGlobalSearch` |
| Types/Interfaces | `I` prefix for interfaces | `IPokemon`, `IStat`, `IEvolutionNode` |
| Constants | UPPER_SNAKE_CASE | `POKEAPI_BASE`, `STAT_LABELS`, `DEX_MAP` |
| Functions | camelCase | `fetchPokemon`, `processEvolutionChain` |
| Files - Components | PascalCase.tsx | `EvolutionChart.tsx`, `NarrativeScene.tsx` |
| Files - Utilities | kebab-case.ts | `competitive-analysis.ts`, `pokemon-normalizer.ts` |
| Files - Data | snake_case.json | `pokedex_base_stats.json`, `move_dex.json` |
| CSS classes | Tailwind utilities | Not custom class names |
| Route segments | kebab-case | `type-calculator`, `pokedex` |

### File Organization
- **One component per file** — component name matches filename
- **Colocation:** Page-specific client components live next to their `page.tsx` (e.g., `CompetitiveClient.tsx` next to `page.tsx`)
- **Domain grouping in components:** Components are organized by feature domain, not component type
- **Barrel exports:** Not used — direct imports from file paths

## React Patterns

### Component Patterns
- **Server/Client split:** Server components for data fetching and layout; `'use client'` for interactivity
- **Props drilling with dict:** i18n dictionary object (`dict`) is passed from server layout through props
- **React Query for all external data:** No raw `useEffect` + `useState` for API calls — hooks from `pokeapi.ts` handle caching and prefetching
- **Framer Motion for animation:** `motion.div` wrappers with `initial`/`animate`/`exit` for page transitions and reveals

### State Management
- **No global state library** — React Query handles server state; component-local `useState` for UI state
- **No Redux, Zustand, or Context** (beyond QueryProvider and ScrollProvider)
- **Prop drilling** is the primary state sharing pattern between parent-child components

### Data Fetching Patterns
- **Custom hooks wrapping React Query:** `usePokemon(id, lang)`, `useMoveDetail(url)`, `useMachine(url)`, `usePokedexEntries(context)`
- **Prefetching:** `queryClient.prefetchQuery` for variant forms
- **Stale times:** 0 for live API data, 24h for reference data (moves, machines, dex entries)

### Component Structure Pattern
```tsx
'use client'; // if interactive

import { ... } from 'react';
import { motion } from 'framer-motion';
// ... other imports

// Local constants/types
const SOME_CONFIG = { ... };

interface ComponentProps { ... }

export default function ComponentName({ prop1, prop2 }: ComponentProps) {
  // State hooks
  const [state, setState] = useState(...);
  
  // Data hooks
  const { data, isLoading } = useSomeHook(...);
  
  // Effects
  useEffect(() => { ... }, [...]);
  
  // Handlers
  const handleAction = () => { ... };
  
  // Render
  return (
    <motion.div initial={...} animate={...}>
      {/* Tailwind classes for styling */}
    </motion.div>
  );
}
```

## Styling Patterns

### TailwindCSS Usage
- **Inline utility classes** — no CSS modules, no styled-components
- **`clsx` + `tailwind-merge`** for conditional class combining
- **Custom theme extensions** in `tailwind.config.ts`: brand colors, custom fonts, animations
- **Dark theme by default** — `bg-slate-950`, `text-slate-50` as the base palette
- **Glassmorphism pattern:** `bg-*/70 backdrop-blur-xl` with `border border-white/10`
- **Neon accents:** `text-cyan-400`, `shadow-cyan-500/50`, custom `neon-border-box` utility

### Design Token Usage
- Design tokens defined in `src/data/design_tokens.json`
- Tokens cover: typography, glassmorphism, animation easing, scroll triggers, FX palette
- Referenced in component code and Tailwind config

## Error Handling
- **Graceful degradation:** API failures caught silently with `try/catch`, return empty data instead of crashing
- **No error boundaries** currently — errors in components would bubble up
- **Console logging:** `console.error` for caught exceptions (no structured logging)
- **Fallback sprites:** Default Pokémon #0 sprite when image fails to load

## Code Comments
- **Spanish-dominant comments** with technical English terms inline
- Section headers use `// --- SECTION NAME ---` pattern
- TODO markers: None found in current codebase (clean)
- `@ts-ignore` usage: Found only in `pokeapi.ts` for dynamic dictionary key access and in `useNuzlockeAnalysis.ts` for patch data merging

## Import Order (Informal)
1. React & Next.js imports
2. Third-party libraries (framer-motion, tanstack, etc.)
3. Internal types (`@/types/...`)
4. Internal libs/utils (`@/lib/...`)
5. Internal services (`@/services/...`)
6. Internal components (`@/components/...`)
7. Internal data (`@/data/...`)
8. Static data imports (JSON files)
