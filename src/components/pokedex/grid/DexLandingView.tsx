'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { PokemonIndexCard, FilterState } from '@/types/pokedex';
import TacticalDexCard from './TacticalDexCard';
import DexFilterPanel from './DexFilterPanel';
import { Lang } from '@/lib/pokedexDictionary';
import { Loader2, Database, ImageOff, ArrowUp } from 'lucide-react';

interface Props {
  initialData: PokemonIndexCard[]; 
  availableGames: { id: string; name: string; type: string }[];
  lang: Lang;
}

const CHUNK_SIZE = 50;

const TIER_WEIGHTS: Record<string, number> = {
  'S': 6, 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'F': 1, 'N/A': 0
};

export default function DexLandingView({ initialData, availableGames, lang }: Props) {
  
  const defaultGameObj = availableGames.find(g => g.id === 'firered' || g.id === 'fire-red') || availableGames[0];

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    gameType: defaultGameObj?.type || 'vanilla',
    game: defaultGameObj?.id || '',
    gen: 'ALL',
    types: [],
    tierPhase: 'early', 
    tier: 'ALL',
    fullyEvolvedOnly: false,
    minStatTarget: 'none',
    minStatValue: 0,
    sortBy: 'id',
    sortOrder: 'asc'
  });

  const [visibleCount, setVisibleCount] = useState(CHUNK_SIZE);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleCount(CHUNK_SIZE);
  }, [filters]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Motor O(N) Profundo (Evalúa Padre e Hijos)
  const filteredData = useMemo(() => {
    
    // Función extractora para evaluar una tarjeta (sea padre o variante)
    const matchesFilters = (p: PokemonIndexCard) => {
        if (filters.search && !p.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
        if (filters.gen !== 'ALL' && p.generation !== filters.gen) return false;
        
        if (filters.types.length > 0) {
           const hasAllTypes = filters.types.every(t => p.types.includes(t));
           if (!hasAllTypes) return false;
        }

        if (filters.tier !== 'ALL') {
           const gameTiers = p.tiers[filters.game];
           if (!gameTiers) return false;
           // @ts-ignore
           const pkmTierScore = TIER_WEIGHTS[gameTiers[filters.tierPhase]] || 0;
           const targetTierScore = TIER_WEIGHTS[filters.tier] || 0;
           if (pkmTierScore < targetTierScore) return false;
        }

        if (filters.minStatTarget !== 'none') {
            const val = Object.entries(p.base_stats).find(([k]) => k === filters.minStatTarget)?.[1] || 0;
            if (val < filters.minStatValue) return false;
        }

        if (filters.fullyEvolvedOnly && !p.is_fully_evolved) return false;

        return true;
    };

    return initialData
      .filter(basePkm => {
        // MATCH PROFUNDO: Si la base pasa el filtro, se muestra. 
        // Si no pasa, pero AL MENOS UNA de sus variantes lo pasa (ej. Vulpix falla, pero Alola Vulpix acierta), se muestra la tarjeta.
        if (matchesFilters(basePkm)) return true;
        if (basePkm.varieties && basePkm.varieties.some(v => matchesFilters(v))) return true;
        
        return false;
      })
      .sort((a, b) => {
        let valA: number; let valB: number;

        switch (filters.sortBy) {
            case 'bst': valA = a.base_stats.bst; valB = b.base_stats.bst; break;
            case 'hp':  valA = a.base_stats.hp;  valB = b.base_stats.hp; break;
            case 'atk': valA = a.base_stats.atk; valB = b.base_stats.atk; break;
            case 'def': valA = a.base_stats.def; valB = b.base_stats.def; break;
            case 'spa': valA = a.base_stats.spa; valB = b.base_stats.spa; break;
            case 'spd': valA = a.base_stats.spd; valB = b.base_stats.spd; break;
            case 'spe': valA = a.base_stats.spe; valB = b.base_stats.spe; break;
            case 'id': default: valA = a.dex_number; valB = b.dex_number; break;
        }

        if (valA === valB) return 0;
        const compare = valA < valB ? -1 : 1;
        return filters.sortOrder === 'asc' ? compare : -compare;
      });
  }, [initialData, filters]);

  const visibleCards = filteredData.slice(0, visibleCount);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + CHUNK_SIZE, filteredData.length));
        }
      },
      { rootMargin: '200px' }
    );

    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [filteredData.length]);

  return (
    <div className="w-full min-h-screen flex flex-col p-4 md:p-8 pt-24 max-w-[1920px] mx-auto">
      
      <div className="mb-6 flex items-center gap-3">
            <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                <Database size={24} />
            </div>
            <div>
                <h1 className="text-3xl font-display font-black text-white uppercase tracking-tighter shadow-black drop-shadow-md">National <span className="text-cyan-400">Database</span></h1>
                <p className="text-xs font-mono text-slate-400">Silph Co. Central Server • Indexing {filteredData.length} species</p>
            </div>
        </div>

      <DexFilterPanel 
        filters={filters} 
        setFilters={setFilters} 
        availableGames={availableGames} 
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
        {visibleCards.map((pkm, index) => (
           <div key={`${pkm.dex_number}-${index}`} className="animate-in fade-in zoom-in-95 duration-500" style={{ animationDelay: `${(index % CHUNK_SIZE) * 20}ms` }}>
              <TacticalDexCard 
                 pokemon={pkm} 
                 selectedGame={filters.game} 
                 lang={lang} 
              />
           </div>
        ))}
      </div>

      {filteredData.length === 0 && (
         <div className="w-full py-20 flex flex-col items-center justify-center text-slate-600 border border-slate-800 border-dashed rounded-xl bg-slate-900/20">
             <ImageOff size={48} className="mb-4 opacity-50" />
             <p className="font-mono text-sm uppercase tracking-widest">No Matches Found in Database</p>
         </div>
      )}

      {visibleCount < filteredData.length && (
         <div ref={observerRef} className="w-full h-32 flex items-center justify-center text-cyan-500/50 mt-8">
            <Loader2 size={24} className="animate-spin" />
         </div>
      )}
      
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 md:bottom-12 md:right-12 z-50 p-3 bg-slate-900/90 backdrop-blur border border-cyan-500/50 rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:bg-slate-800 hover:scale-110 hover:border-cyan-400 transition-all text-cyan-400 group"
          aria-label="Scroll to top"
        >
          <ArrowUp size={24} className="group-hover:-translate-y-1 transition-transform" />
        </button>
      )}

    </div>
  );
}