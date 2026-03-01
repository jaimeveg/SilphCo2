'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PokemonIndexCard } from '@/types/pokedex';
import TypeBadge from '@/components/ui/TypeBadge';
import { cn } from '@/lib/utils';
import { ImageOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { Lang } from '@/lib/pokedexDictionary';

interface Props {
  pokemon: PokemonIndexCard;
  selectedGame: string;
  lang: Lang;
}

const TIER_COLORS: Record<string, string> = {
  'S': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 shadow-[0_0_8px_rgba(234,179,8,0.3)]',
  'A': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]',
  'B': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.3)]',
  'C': 'bg-amber-500/20 text-amber-500 border-amber-500/50',
  'D': 'bg-orange-500/20 text-orange-500 border-orange-500/50',
  'F': 'bg-red-500/20 text-red-500 border-red-500/50',
  'N/A': 'bg-slate-800 text-slate-500 border-slate-700',
};

const StatMicroBox = ({ label, value }: { label: string, value: number }) => (
  <div className="flex flex-col items-center flex-1 border-r border-slate-800/50 last:border-0 px-0.5">
    <span className="text-[7px] text-slate-500 uppercase font-mono tracking-tighter">{label}</span>
    <span className="text-[9px] font-bold text-slate-300 font-mono">{value}</span>
  </div>
);

const TierBadge = ({ phase, tier }: { phase: string, tier: string }) => {
  const safeTier = tier || 'N/A';
  const colorClass = TIER_COLORS[safeTier] || TIER_COLORS['N/A'];
  
  return (
    <div className={cn("flex flex-col items-center justify-center border rounded px-1.5 py-0.5 min-w-[32px]", colorClass)}>
      <span className="text-[6px] uppercase tracking-widest leading-none mb-0.5 opacity-80">{phase}</span>
      <span className="text-[10px] font-black font-display leading-none">{safeTier}</span>
    </div>
  );
};

export default function TacticalDexCard({ pokemon, selectedGame, lang }: Props) {
  const [imgError, setImgError] = useState(false);
  const [fatalError, setFatalError] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const variantsList = [pokemon, ...(pokemon.varieties || [])];
  const safeIdx = activeIdx < variantsList.length ? activeIdx : 0;
  const activePokemon = variantsList[safeIdx];

  const variantSuffix = activeIdx > 0 ? activePokemon.name.replace(pokemon.name + '-', '').replace(/-/g, ' ') : null;

  useEffect(() => {
    setImgError(false);
    setFatalError(false);
  }, [activeIdx, pokemon.id]);

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setActiveIdx((prev) => (prev - 1 + variantsList.length) % variantsList.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setActiveIdx((prev) => (prev + 1) % variantsList.length);
  };

  const localImage = `/images/pokemon/high-res/${activePokemon.dex_number}.png`;
  const remoteImage = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${activePokemon.dex_number}.png`;
  const currentImage = imgError ? remoteImage : localImage;

  const gameTiers = activePokemon.tiers[selectedGame] || { early: 'N/A', mid: 'N/A', late: 'N/A' };
  
  const destUrl = activeIdx === 0 
    ? `/${lang}/pokedex/${pokemon.dex_number}` 
    : `/${lang}/pokedex/${pokemon.dex_number}?variant=${activePokemon.dex_number}`;

  return (
    <Link href={destUrl} className="group block h-full">
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden relative transition-all duration-300 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.1)] hover:-translate-y-1 h-full flex flex-col backdrop-blur-sm">
        
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(34,211,238,0.02)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Header con Selector Integrado */}
        <div className="px-3 py-2 flex justify-between items-center border-b border-slate-800/50 bg-slate-900/50 h-9">
          
          {/* SE USA EL ID DEL PADRE SIEMPRE (pokemon.dex_number) PARA MANTENER EL NACIONAL DEX */}
          <span className="text-[10px] font-mono font-bold text-cyan-600 group-hover:text-cyan-400 transition-colors">
            #{String(pokemon.dex_number).padStart(4, '0')}
          </span>
          
          <div className="flex items-center gap-2">
            {activePokemon.is_fully_evolved && activeIdx === 0 && (
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 border border-emerald-500 shadow-[0_0_4px_#10b981]" title="Fully Evolved" />
            )}
            
            {/* MINI SELECTOR DE VARIANTES */}
            {variantsList.length > 1 && (
               <div className="flex items-center gap-0.5 bg-slate-950 border border-slate-700 rounded shadow-inner p-0.5 z-30">
                  <button onClick={handlePrev} className="text-slate-500 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors p-[1px]">
                     <ChevronLeft size={12} strokeWidth={3} />
                  </button>
                  <span className="text-[8px] font-mono font-bold text-slate-400 w-3 text-center">
                     {activeIdx + 1}
                  </span>
                  <button onClick={handleNext} className="text-slate-500 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors p-[1px]">
                     <ChevronRight size={12} strokeWidth={3} />
                  </button>
               </div>
            )}
          </div>
        </div>

        {/* Asset Viewport */}
        <div className="relative w-full aspect-square p-4 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent z-10 pointer-events-none" />
          
          {fatalError ? (
             <div className="flex flex-col items-center justify-center text-slate-700 z-0">
               <ImageOff size={32} strokeWidth={1} />
             </div>
          ) : (
             <div className="relative w-full h-full z-0 group-hover:scale-110 transition-transform duration-500 drop-shadow-2xl rendering-pixelated">
               <Image 
                 src={currentImage} 
                 alt={activePokemon.name} 
                 fill 
                 className="object-contain"
                 unoptimized
                 onError={() => {
                    if (!imgError) setImgError(true);
                    else setFatalError(true);
                 }}
               />
             </div>
          )}
        </div>

        {/* Content Body */}
        <div className="px-3 pt-1 pb-3 flex flex-col gap-2 relative z-20 flex-1">
          <div className="flex flex-wrap items-center gap-1 mb-1">
            {activePokemon.types.map(t => (
              <TypeBadge key={t} type={t} showLabel={false} lang={lang} className="w-6 h-6 !p-0 justify-center shadow-sm border border-slate-800" />
            ))}
            {variantSuffix && (
                <span className="text-[7px] font-mono text-cyan-300 uppercase tracking-widest border border-cyan-500/30 px-1 rounded bg-cyan-950/40 ml-1 truncate max-w-[80px]">
                    {variantSuffix}
                </span>
            )}
          </div>

          {/* NOMBRE GENÉRICO: Eliminamos -male y -female mediante Regex */}
          <h2 className="text-[11px] sm:text-xs font-display font-black text-slate-200 uppercase tracking-wider truncate group-hover:text-white transition-colors" title={activePokemon.name}>
            {activePokemon.name.replace(/-male|-female/gi, '').replace(/-/g, ' ')}
          </h2>

          <div className="flex justify-between gap-1 mt-auto pt-2">
            <TierBadge phase="ERL" tier={gameTiers.early} />
            <TierBadge phase="MID" tier={gameTiers.mid} />
            <TierBadge phase="LTE" tier={gameTiers.late} />
          </div>
        </div>

        {/* Footer Stats Bar */}
        <div className="flex bg-slate-900 border-t border-slate-800 py-1.5 px-1 mt-auto">
           <StatMicroBox label="HP" value={activePokemon.base_stats.hp} />
           <StatMicroBox label="ATK" value={activePokemon.base_stats.atk} />
           <StatMicroBox label="DEF" value={activePokemon.base_stats.def} />
           <StatMicroBox label="SPA" value={activePokemon.base_stats.spa} />
           <StatMicroBox label="SPD" value={activePokemon.base_stats.spd} />
           <StatMicroBox label="SPE" value={activePokemon.base_stats.spe} />
        </div>

      </div>
    </Link>
  );
}