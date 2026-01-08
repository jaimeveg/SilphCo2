'use client';

import { IPokemon } from '@/types/interfaces';
import { Lang, POKEDEX_DICTIONARY } from '@/lib/pokedexDictionary';
import VisualStats from './VisualStats';
import EvolutionChart from './EvolutionChart';
import LocationMatrix from './LocationMatrix';
import { Network, Map } from 'lucide-react';

interface Props {
  pokemon: IPokemon;
  lang: Lang;
}

export default function ViewportData({ pokemon, lang }: Props) {
  const dict = POKEDEX_DICTIONARY[lang].labels;

  return (
    // FIX SCROLL: Usamos 'absolute inset-0' para forzar que este div ocupe
    // exactamente el espacio del padre (DetailDeck/flex-1) y scrollee internamente.
    <div className="absolute inset-0 overflow-y-auto custom-scrollbar pr-3 pb-6 pl-1">
      
      <div className="space-y-6 pt-1">
        
        {/* 1. STATS ENGINE (PRO) */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <VisualStats stats={pokemon.stats} lang={lang} />
        </section>

        {/* 2. EVOLUTION VECTOR */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <div className="flex items-center gap-2 mb-2 border-b border-slate-800 pb-1 mx-1">
              <Network className="text-cyan-500" size={14} />
              <h3 className="text-xs font-display font-bold text-slate-300 uppercase tracking-widest">
                {dict.evo_title}
              </h3>
          </div>
          <EvolutionChart 
  chain={pokemon.evolutionChain} 
  lang={lang} 
  activeSpecies={pokemon.name} // IMPORTANTE
/>
        </section>

        {/* 3. GEO MATRIX */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <div className="flex items-center gap-2 mb-2 border-b border-slate-800 pb-1 mx-1">
              <Map className="text-cyan-500" size={14} />
              <h3 className="text-xs font-display font-bold text-slate-300 uppercase tracking-widest">
                {dict.loc_title}
              </h3>
          </div>
          <LocationMatrix locations={pokemon.locations} lang={lang} />
        </section>
        
      </div>
    </div>
  );
}