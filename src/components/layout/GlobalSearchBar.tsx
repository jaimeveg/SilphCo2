'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, Package, Sparkles, Zap, Sword } from 'lucide-react';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import type { ISearchNode, SearchEntityType } from '@/types/search';
import { cn } from '@/lib/utils';

interface GlobalSearchBarProps {
  lang: string;
  isExpanded: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onClickOutside: () => void;  // NEW: collapse sidebar on outside click
  inputRef: React.RefObject<HTMLInputElement>;
}

const ENTITY_ROUTE: Record<SearchEntityType, string> = {
  pokemon: 'pokedex',
  move: 'moves',
  item: 'items',
  ability: 'abilities',
};

const ENTITY_ICON: Record<SearchEntityType, React.ElementType> = {
  pokemon: Zap,
  move: Sword,
  item: Package,
  ability: Sparkles,
};

const ENTITY_COLOR: Record<SearchEntityType, string> = {
  pokemon: 'text-cyan-400',
  move: 'text-orange-400',
  item: 'text-amber-400',
  ability: 'text-purple-400',
};

const ENTITY_BG: Record<SearchEntityType, string> = {
  pokemon: 'bg-cyan-500/10',
  move: 'bg-orange-500/10',
  item: 'bg-amber-500/10',
  ability: 'bg-purple-500/10',
};

// Type colors matching TypeBadge
const TYPE_COLORS: Record<string, string> = {
  normal: '#A8A77A', fire: '#EE8130', water: '#6390F0', electric: '#F7D02C',
  grass: '#7AC74C', ice: '#96D9D6', fighting: '#C22E28', poison: '#A33EA1',
  ground: '#E2BF65', flying: '#A98FF3', psychic: '#F95587', bug: '#A6B91A',
  rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC', steel: '#B7B7CE',
  fairy: '#D685AD', stellar: '#48D0B0',
};

function MoveTypeBadge({ type }: { type: string }) {
  const normalized = type.toLowerCase();
  const color = TYPE_COLORS[normalized] || '#777';
  const iconUrl = `https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${normalized}.svg`;
  return (
    <div
      className="flex items-center justify-center w-5 h-5 rounded-full border flex-shrink-0"
      style={{ backgroundColor: `${color}20`, borderColor: `${color}60`, boxShadow: `0 0 5px ${color}30` }}
      title={type}
    >
      <img src={iconUrl} alt={type} className="w-3 h-3 object-contain" />
    </div>
  );
}

export default function GlobalSearchBar({ lang, isExpanded, onFocus, onBlur, onClickOutside, inputRef }: GlobalSearchBarProps) {
  const router = useRouter();
  const { search, isLoaded } = useGlobalSearch();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ISearchNode[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showResults, setShowResults] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  // Perform search on query change
  useEffect(() => {
    if (query.trim().length >= 2) {
      const r = search(query);
      setResults(r);
      setShowResults(r.length > 0);
      setActiveIndex(-1);
    } else {
      setResults([]);
      setShowResults(false);
    }
  }, [query, search]);

  // Close results + collapse sidebar on click outside the WHOLE sidebar
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      // Find sidebar element (parent of barRef traversing up to <aside>)
      const sidebar = barRef.current?.closest('aside');
      if (sidebar && !sidebar.contains(e.target as Node)) {
        setShowResults(false);
        onClickOutside();
      } else if (barRef.current && !barRef.current.contains(e.target as Node)) {
        // Click inside sidebar but outside bar: just close results
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClickOutside]);

  const navigate = useCallback((node: ISearchNode) => {
    const route = ENTITY_ROUTE[node.entity_type];
    router.push(`/${lang}/${route}/${node.id}`);
    setQuery('');
    setShowResults(false);
    setResults([]);
    onClickOutside(); // also collapse sidebar after navigation
  }, [lang, router, onClickOutside]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle Escape universally first
    if (e.key === 'Escape') {
      setShowResults(false);
      inputRef.current?.blur();
      onClickOutside();
      return;
    }

    if (!showResults || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      navigate(results[activeIndex]);
    }
  };

  return (
    <div ref={barRef} className="relative flex-shrink-0">
      {/* Search input row */}
      <div className={cn(
        "flex items-center h-11 mx-3 my-2 rounded-lg border transition-all duration-200",
        showResults
          ? 'border-cyan-500/50 bg-slate-900/90'
          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700',
      )}>
        {/* Lupa — always visible */}
        <div className="w-10 flex items-center justify-center flex-shrink-0">
          {!isLoaded ? (
            <Loader2 size={15} className="text-slate-600 animate-spin" />
          ) : (
            <Search size={15} className={cn("transition-colors", showResults ? "text-cyan-400" : "text-slate-500")} />
          )}
        </div>

        {/* Input — only visible when expanded */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => {
            onFocus();
            if (results.length > 0) setShowResults(true);
          }}
          onBlur={() => {
            setTimeout(() => onBlur(), 150);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search... (Ctrl+K)"
          autoComplete="off"
          className={cn(
            "flex-1 bg-transparent text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none pr-3",
            "transition-all duration-300",
            isExpanded ? "opacity-100 w-full" : "opacity-0 w-0 pointer-events-none"
          )}
        />
      </div>

      {/* Results popover */}
      {showResults && isExpanded && (
        <div className="absolute left-3 right-3 top-[calc(100%-4px)] z-[99999] bg-slate-950 border border-cyan-500/30 rounded-lg shadow-2xl shadow-black/60 overflow-hidden">
          {/* Header */}
          <div className="px-3 py-1.5 border-b border-slate-800 flex items-center justify-between">
            <span className="text-[9px] font-mono uppercase tracking-widest text-slate-600">
              {results.length} result{results.length !== 1 ? 's' : ''}
            </span>
            <span className="text-[9px] font-mono text-slate-700">↑↓ navigate · ↵ open</span>
          </div>

          {/* Result rows */}
          <ul>
            {results.map((node, idx) => {
              // Extract move type from subtitle for TypeBadge (format: "Fire — Physical")
              const moveType = node.entity_type === 'move'
                ? node.subtitle.split(' — ')[0].trim().toLowerCase()
                : null;
                
              const EntityIcon = ENTITY_ICON[node.entity_type];

              return (
                <li key={`${node.entity_type}-${node.id}`}>
                  <button
                    onMouseDown={(e) => { e.preventDefault(); navigate(node); }}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                      idx === activeIndex
                        ? "bg-slate-800/80"
                        : "hover:bg-slate-900/60"
                    )}
                  >
                    {/* 1. Entity type visual (Sword, Package, etc) */}
                    <div className={cn("w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 border border-white/5", ENTITY_BG[node.entity_type])}>
                      <EntityIcon size={13} className={ENTITY_COLOR[node.entity_type]} />
                    </div>

                    {/* 2. Classic Image Icon (Only for Pokemon and Items) */}
                    {(node.entity_type === 'pokemon' || node.entity_type === 'item') && (
                      <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center ml-1">
                        <img
                          src={node.icon_url}
                          alt=""
                          className="w-full h-full object-contain drop-shadow-md"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            if (node.entity_type === 'pokemon') {
                              const step = parseInt(target.dataset.fallback || '0');
                              if (step === 0) {
                                target.dataset.fallback = '1';
                                target.src = target.src.replace('/pokemon/icon/', '/pokemon/high-res/');
                              } else if (step === 1) {
                                target.dataset.fallback = '2';
                                // Try direct pokeapi string fallback if missing in local
                                const match = node.icon_url.match(/\/(\d+)\.png$/);
                                const pokeId = match ? match[1] : node.id.split('-')[0];
                                target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokeId}.png`;
                              } else {
                                target.style.display = 'none';
                              }
                            } else {
                              target.style.display = 'none';
                            }
                          }}
                        />
                      </div>
                    )}

                    {/* 3. Intermediate Badge (Move type SVG or Ability AB/HAB) */}
                    {node.entity_type === 'move' && moveType && (
                      <div className="flex-shrink-0 flex items-center justify-center ml-2 mr-1">
                        <MoveTypeBadge type={moveType} />
                      </div>
                    )}
                    {node.entity_type === 'ability' && (
                      <div className="flex-shrink-0 flex items-center justify-center ml-2 mr-1">
                        <span className="text-[8px] font-bold text-slate-300 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5">
                          {lang === 'es' ? 'HAB' : 'AB'}
                        </span>
                      </div>
                    )}

                    {/* Text */}
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-mono text-slate-200 truncate">{node.name}</span>
                      <span className="text-[9px] font-mono text-slate-500 truncate">{node.subtitle}</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
